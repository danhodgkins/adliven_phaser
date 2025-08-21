import { Vector3, Euler, EventDispatcher } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";
import { Skeleton } from "../../media/Skeleton.glb.js";
import { Body, Material, Sphere, Vec3 } from "cannon-es";

export class SkeletonController extends EventDispatcher {

    STATE_WALKING = "STATE_WALKING";
    STATE_CHOPPING = "STATE_CHOPPING";
    STATE_IDLE = "STATE_IDLE";
    
    constructor({ world, scene, position, rotation, player, audioController }) {
        super();
        this.world = world;
        this.scene = scene;
        this.position = position;
        this.rotation = rotation;
        this.player = player;
        this.audioController = audioController;

        // Attack range for triggering chop state
        this.attackRange = 2.0;
        this.followRange = 7.0;

        // Add animation progress tracking (like in player.js)
        this.animationProgress = new Map();
        this.halfwayTriggered = new Map();

        this.initVisuals();
    }

    setState( newState  )
        {
            let animRef = null;
            switch( newState )
            {
                case this.STATE_WALKING:
                    this.glbController.mixer.timeScale = 0.75;
                    animRef = this.glbController.getAnimIndexByName("03_walk");
                    this.glbController.playAnimByIndex( animRef );
                    break;
    
                case this.STATE_CHOPPING:
                    this.glbController.mixer.timeScale = 1;
                    animRef = this.glbController.getAnimIndexByName("02_skeleton_attack");
                    this.glbController.playAnimByIndex( animRef );
                    break;
                case this.STATE_IDLE:
                    this.glbController.mixer.timeScale = 1;
                    animRef = this.glbController.getAnimIndexByName("01_skeleton_idle");
                    this.glbController.playAnimByIndex( animRef );
            }
    
            this.currentState = newState;
        }

    initVisuals() {

        // Create physics material (optional)
        const defaultMaterial = new Material("default");

        // Movable sphere object
        const radius = 1;
        const sphereShape = new Sphere(radius);
        const sphereBody = new Body({
            mass: 1,
            material: defaultMaterial,
            position: this.position
        });
        sphereBody.addShape(sphereShape);
        sphereBody.collisionFilterGroup = 2;        // skeleton group
        sphereBody.collisionFilterMask = 1 | 2 | 4; // floor + skeletons + player
        
        this.world.addBody(sphereBody);
        this.sphereBody = sphereBody;

        const loader = new GLTFLoader();
        loader.load(Skeleton, (gltf) => {
            // Traverse the loaded model and update materials to cast shadows
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    // Enable shadow casting and receiving
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Convert to MeshStandardMaterial if it isn't already
                    if (child.material && child.material.type !== 'MeshStandardMaterial') {
                        const oldMaterial = child.material;
                        const newMaterial = new MeshStandardMaterial({
                            map: oldMaterial.map || null,
                            color: oldMaterial.color || 0xffffff,
                            transparent: oldMaterial.transparent || false,
                            opacity: oldMaterial.opacity || 1,
                            roughness: 0.8,
                            metalness: 0.1
                        });
                        child.material = newMaterial;
                        
                        // Dispose of old material to prevent memory leaks
                        if (oldMaterial.dispose) oldMaterial.dispose();
                    }
                }
            });
            
            const zombieMesh = gltf.scene;
            zombieMesh.scale.set(1,1,1);
            zombieMesh.position.copy(this.position);
            zombieMesh.quaternion.setFromEuler(new Euler(0, Math.PI / 2, 0));
            this.scene.add(zombieMesh);
            this.mesh = zombieMesh;

            // Store the visual offset
            this.visualOffset = -0.2; // Adjust this value as needed

            // listen for animation complete ( loop only, 'finished' will nly fir on non looping anims )
            this.boundOnAnimComplete = this.onAnimComplete.bind(this);

            // Set up animation controller if needed
            this.glbController = new GlbController({  glb : gltf });
            this.glbController.mixer.addEventListener('loop', this.boundOnAnimComplete )

            this.setState( this.STATE_IDLE );
        });
    }

    onAnimComplete( e )
    {
        switch( e.action._clip.name )
        {
            case "02_skeleton_attack":
                // Keep this for any end-of-animation logic if needed
                break;
        }
    }

    // Add the animation progress checking method (copied from player.js)
    checkAnimationProgress() {
        if (!this.glbController || !this.glbController.mixer) return;
        
        // Get the current action
        const actions = this.glbController.mixer._actions;
        const currentAction = actions.find(action => action.isRunning() && action.getEffectiveWeight() > 0);
        if (!currentAction) return;
        
        const clipName = currentAction._clip.name;
        const duration = currentAction._clip.duration;
        const currentTime = currentAction.time;
        const progress = (currentTime % duration) / duration;
        
        // Check if we've crossed the 1/3 point (0.33)
        const triggerPoint = 0.33;
        
        // Get previous progress, default to 0 if undefined
        const previousProgress = this.animationProgress.get(clipName) || 0;
        const triggerAlreadyFired = this.halfwayTriggered.get(clipName) || false;
        
        const wasBeforeTrigger = previousProgress < triggerPoint;
        const isAfterTrigger = progress >= triggerPoint;
        
        if (wasBeforeTrigger && isAfterTrigger && !triggerAlreadyFired) {
            this.onAnimTriggerPoint({ action: currentAction });
            this.halfwayTriggered.set(clipName, true);
        }
        
        // Reset trigger when animation loops back to beginning
        if (progress < 0.1) {
            this.halfwayTriggered.set(clipName, false);
        }
        
        this.animationProgress.set(clipName, progress);
    }

    // Add the trigger point handler
    onAnimTriggerPoint( e ) {
        switch( e.action._clip.name ) {
            case "02_skeleton_attack":
                // Trigger the hit at 1/3 of the animation instead of at the start
                this.dispatchEvent({ type: 'skeleton_event', detail : "axe_chop_complete" });
                break;
        }
    }

    update(dt) {
        if (!this.mesh) return;
        
        const { sphereBody, mesh } = this;
        const walkSpeed = 1;
        const skeletonPos = this.mesh.position;
        
        // Use player physics body position for consistency
        const playerPos = new Vector3().copy(this.player.sphereBody.position);
        
        // Calculate distance to the player
        const distance = skeletonPos.distanceTo(playerPos);
        
        // Check if player is in attack range
        if (distance <= this.attackRange) {
            if (this.currentState !== this.STATE_CHOPPING) {
                this.setState(this.STATE_CHOPPING);
                // Remove immediate event dispatch - let animation progress handle it
                // this.dispatchEvent({ type: 'skeleton_event', detail : "axe_chop_complete" });
            }
            // Stop movement when attacking but maintain Y position
            sphereBody.velocity.x = 0;
            sphereBody.velocity.z = 0;
            sphereBody.position.y = 1; // Fix Y position
        }
        // Check if player is in follow range but outside attack range
        else if (distance <= this.followRange) {
            if (this.currentState !== this.STATE_WALKING) {
                this.setState(this.STATE_WALKING);
            }
            
            const direction = new Vector3()
                .subVectors(playerPos, skeletonPos)
                .setY(0)
                .normalize();

            // Apply horizontal (XZ) movement
            sphereBody.velocity.x = direction.x * walkSpeed;
            sphereBody.velocity.y = 0;
            sphereBody.velocity.z = direction.z * walkSpeed;

            // Prevent any physics Y movement on collision
            sphereBody.position.y = 1;

            // Smoothly rotate the skeleton to face the player
            const targetAngle = Math.atan2(direction.x, direction.z);
            const currentAngle = mesh.rotation.y;
            const lerpFactor = 0.1;
            mesh.rotation.y = currentAngle + (targetAngle - currentAngle) * lerpFactor;
        } 
        // Player is out of range
        else {
            if (this.currentState !== this.STATE_IDLE) {
                this.setState(this.STATE_IDLE);
            }
            // Stop movement but fix Y position to prevent sinking
            sphereBody.velocity.x = 0;
            sphereBody.velocity.z = 0;
            sphereBody.position.y = 1; // Fix Y position to prevent falling
        }

        // Sync mesh with physics body AND apply visual offset
        mesh.position.lerp(sphereBody.position, 0.25);
        mesh.position.y += this.visualOffset;

        // Update animation controller if it exists
        if (this.glbController) {
            this.glbController.update(dt);
            // Add animation progress checking (like in player.js)
            this.checkAnimationProgress();
        }
    }
}
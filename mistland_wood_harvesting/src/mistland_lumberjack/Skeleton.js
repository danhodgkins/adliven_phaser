import { Vector3, Euler, EventDispatcher } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";
import { Skeleton } from "../../media/Skeleton.glb.js";
import { Body, Material, Sphere, Vec3 } from "cannon-es";
import { SensorZone } from "./sensors/sensor.js";

export class SkeletonController extends EventDispatcher {

    STATE_WALKING = "STATE_WALKING";
    STATE_CHOPPING = "STATE_CHOPPING";
    
    constructor({ world, scene, position, rotation, player, audioController }) {
        super();
        this.world = world;
        this.scene = scene;
        this.position = position;
        this.rotation = rotation;
        this.player = player;
        this.audioController = audioController;

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

        const sensor = new SensorZone({
            world : this.world, 
            scene : this.scene,
            position: this.position,
            // position: position || new Vec3(0, 0, 0),
            radius: 2,
            playerBody: this.player.sphereBody, 
            color: 0xff00ff,
            sensorType : "skeleton",
            visible : false
        });

        

        this.boundOnPlayerEnter = this.onPlayerEnter.bind( this );
        this.boundOnPlayerExit = this.onPlayerExit.bind( this );
        sensor.addEventListener('enter', this.boundOnPlayerEnter );
        sensor.addEventListener('exit', this.boundOnPlayerExit );

        this.sensor = sensor;

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

            this.setState( this.STATE_WALKING );
        });
    }

    onPlayerEnter()
    {
        if( this.currentState != this.STATE_CHOPPING ) this.setState( this.STATE_CHOPPING );
        this.dispatchEvent({ type: 'skeleton_event', detail : "axe_chop_complete" });
    }

    onPlayerExit()
    {
        this.setState( this.STATE_WALKING );
    }

    onAnimComplete( e )
    {
        
        switch( e.action._clip.name )
        {
            case "02_skeleton_attack":
                // respond to chop loop complete
                this.dispatchEvent({ type: 'skeleton_event', detail : "axe_chop_complete" });
                break;
        }
    }

    update(dt) {
        this.sensor.update();

        if (!this.mesh) return;
        const { sphereBody, mesh } = this;

        const walkSpeed = 1;
        const skeletonPos = this.mesh.position;
        const playerPos = this.player.sphereMesh.position;

        // Calculate distance to the player
        const distance = skeletonPos.distanceTo(playerPos);

        // Only move if within 5 meters of the player
        if (distance <= 15.0) {
            const direction = new Vector3()
                .subVectors(playerPos, skeletonPos)
                .setY(0)
                .normalize();

            // Apply horizontal (XZ) movement
            sphereBody.velocity.x = direction.x * walkSpeed;
            sphereBody.velocity.y = 0;
            sphereBody.velocity.z = direction.z * walkSpeed;

            // Prevent any physics Y movement on collision
            sphereBody.position.y = 1; // Keep physics body above ground

            // Smoothly rotate the skeleton to face the player
            const targetAngle = Math.atan2(direction.x, direction.z);
            const currentAngle = mesh.rotation.y;
            const lerpFactor = 0.1; // Adjust for smoother or faster rotation
            mesh.rotation.y = currentAngle + (targetAngle - currentAngle) * lerpFactor;
        } else {
            // Stop movement if out of range
            sphereBody.velocity.set(0, 0, 0);
        }

        // Sync mesh with physics body AND apply visual offset
        mesh.position.lerp(sphereBody.position, 0.25);
        mesh.position.y += this.visualOffset; // Apply the visual offset after lerp

        // Update animation controller if it exists
        if (this.glbController) this.glbController.update(dt);
    }

    // update(deltaTime) {
    //     if (this.mesh && this.player && this.player.sphereMesh) {
    //         // Get positions as Vector3
    //         const skeletonPos = this.mesh.position;
    //         const playerPos = this.player.sphereMesh.position;
            
    //         // Calculate distance to player
    //         const distance = skeletonPos.distanceTo(playerPos);
            
    //         // Move towards player if within 5 meter radius
    //         const followRadius = 10.0;
    //         const moveSpeed = 1.0; // Units per second
    //         const rotationSpeed = 2.0; // Radians per second
            
    //         if (distance <= followRadius && distance > 0.5) { // Don't move if too close (0.5m)
    //             // Calculate direction vector from skeleton to player
    //             const direction = new Vector3()
    //                 .subVectors(playerPos, skeletonPos)
    //                 .normalize();
                
    //             // Move towards player
    //             const movement = direction.multiplyScalar(moveSpeed * deltaTime);
    //             this.mesh.position.add(movement);
                
    //             // Smooth rotation to face the player
    //             const targetAngle = Math.atan2(direction.x, direction.z);
    //             const currentAngle = this.mesh.rotation.y;
                
    //             // Calculate the shortest angular distance
    //             let angleDiff = targetAngle - currentAngle;
    //             while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    //             while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
    //             // Apply smooth rotation
    //             const maxRotation = rotationSpeed * deltaTime;
    //             const rotationAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxRotation);
    //             this.mesh.rotation.y += rotationAmount;
                
    //         }

    //         if (distance < 0.5){
    //             //Attack Player
    //             this.player.DropMultipleLogs();
    //         }
            
    //         // Update animation controller if it exists
    //         if (this.glbController) {
    //             this.glbController.update(deltaTime);
    //         }
    //     }
    // }

    
}
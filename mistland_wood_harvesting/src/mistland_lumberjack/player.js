import { Body, Material,  Sphere, Vec3 } from "cannon-es";
import { SphereGeometry, Quaternion, Mesh, MeshStandardMaterial, Object3D, Euler, Vector3, EventDispatcher, TextureLoader, PlaneGeometry, MeshBasicMaterial, DoubleSide } from "three";
import { Hero_avatar } from '../../media/Hero_avatar.glb.js';
import { Log_Single } from "../../media/Log_Single.glb.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";
import { arrow_plane } from '../../media/img_arrow_plane.webp.js';
import { degToRad } from "three/src/math/MathUtils.js";
import StackController from "./stack_controller.js";
import StackableAnimator from "./stackable_animator.js";

const logSpacing = 0.3;
export class Player extends EventDispatcher {
    carriedLogs = [];

    STATE_IDLE = "STATE_IDLE";
    STATE_WALKING = "STATE_WALKING";
    STATE_CHOPPING = "STATE_CHOPPING";

    isChopping = false;
    lastDropTime = 0; // Track last time logs were dropped
    dropCooldown = 3000; // 3 seconds in milliseconds
    
    constructor({ world, scene, audioController, applicationModel }) {
        super();
            this.applicationModel = applicationModel;
            this.world = world;
            this.scene = scene;
            this.audioController = audioController;
            this.axeLevel = 0;
            this.chopSpeed0 = 2.5;
            this.chopSpeed1 = 5;

            this.joystickInput = { x: 0, y: 0 };
            this.walkSpeed = getParamsNumberByID("walkSpeed");
            
            // Create physics material (optional)
            const defaultMaterial = new Material("default");
            
            // Movable sphere object
            const radius = 0.5;
            const sphereShape = new Sphere(radius);
            const sphereBody = new Body({
                mass: 1,
                material: defaultMaterial,
                position: new Vec3(0, radius, 0), // start above ground
            });
            sphereBody.addShape(sphereShape);
            sphereBody.collisionFilterGroup = 4;     // Player group
            sphereBody.collisionFilterMask = 1 | 2 | 8;       // Collidable group
            
            world.addBody(sphereBody);
            this.sphereBody = sphereBody;
                        
            this.sphereMesh = new Object3D();
            scene.add(this.sphereMesh);

            // Player body - prevent from launching up ( y ) on collision with skeletons
            sphereBody.linearFactor.set(1, 0, 1);  // No vertical motion from collisions
            sphereBody.angularFactor.set(0, 1, 0); // Can only rotate around Y
                
            const loader = new GLTFLoader();
            loader.load(
                Hero_avatar, 
                (e) => {                 
                    // Traverse the loaded model and update materials to cast shadows
                    e.scene.traverse((child) => {
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
                    e.scene.position.y -= 0.3;
                    scene.add(e.scene);   
                    // console.log("e.scene:", e.scene );
                    this.sphereMesh.add( e.scene );
                    this.glbController = new GlbController({ glb : e } );
                    this.setState( this.STATE_IDLE );

                    // listen for animation complete ( loop only, 'finished' will nly fir on non looping anims )
                    this.boundOnAnimComplete = this.onAnimComplete.bind(this);
                    this.glbController.mixer.addEventListener('loop', this.boundOnAnimComplete )

                    const logStackParent = new Object3D();
                    logStackParent.position.set(0, 0.5, -0.5); // position stack parent slightly behind player
                    this.sphereMesh.add( logStackParent );

                    const logScale = new Vec3( 0.4, 1.1, 1.1 );
                    this.logStackController = new StackController( { 
                        scene, 
                        stackableAsset : Log_Single, 
                        parent3DObject : logStackParent,
                        scale : logScale
                    })

                    this.logLauncherAnimator = new StackableAnimator( { 
                        scene,
                        launchableAsset : Log_Single,
                        scale : logScale
                    })
                    this.boundOnLogLaunchComplete = this.onLogLaunchComplete.bind( this );
                    this.logLauncherAnimator.addEventListener( "launch_complete" , this.boundOnLogLaunchComplete );
                    
                    this.switchAxe();
                }, 
                undefined, 
                (e) => { console.error("error loading model", e); }
            );

            /// direction marker
            const tloader = new TextureLoader();
    
            const texture = tloader.load(arrow_plane, () => {
                texture.needsUpdate = true;
                const geometry = new PlaneGeometry(6, 6); // Width and height
                const material = new MeshBasicMaterial({ 
                    map: texture, 
                    alphaMap: texture, // Use the same texture for alpha
                    transparent: false,
                    alphaTest: 0.1, // Pixels with alpha below 0.1 won't cast shadows
                    side: DoubleSide,
                    color: 0xffffff // Green tint
                });
                // const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent : false, wireframe: true   });
                const plane = new Mesh(geometry, material);
                
                // Enable shadow casting and receiving
                plane.castShadow = true;
                plane.receiveShadow = true;
    
                // the model rotation is not visually aliging the texcture so manually set it for now
                // plane.rotation.copy( rotation );
                // const rotationY = degToRad(61);
                // plane.rotation.y = rotationY;
                plane.rotateX(degToRad(270));
                plane.position.copy( this.sphereMesh.position );
                plane.position.y +=0.3;
                this.scene.add(plane);
                
                this.directionMarker = plane;

                this.hideHintArrow();

            });  
        }

        showHintArrow()
        {
            this.directionMarker.visible = true;
        }
        
        hideHintArrow()
        {
            this.directionMarker.visible = false;
        }

        upgradeAxe()
        {
            this.axeLevel++;
            this.switchAxe();
        }

        switchAxe()
        {
            this.glbController.glb.scene.traverse(( child ) => {
                if( child.name == "Axe_01_Common" )
                {
                    child.visible = this.axeLevel == 0;
                }
                if( child.name == "Axe_01_Legendary" )
                {
                    child.visible = this.axeLevel == 1;
                }
            });
        }
    
        setState( newState  )
        {
            let animRef = null;
            switch( newState )
            {
                case this.STATE_WALKING:
                    this.glbController.mixer.timeScale = 1;
                    animRef = this.glbController.getAnimIndexByName("02_walk");
                    this.glbController.playAnimByIndex( animRef );
                    break;
    
                case this.STATE_IDLE:
                    this.glbController.mixer.timeScale = 1;
                    animRef = this.glbController.getAnimIndexByName("01_idle");
                    this.glbController.playAnimByIndex( animRef );
                    break;

                case this.STATE_CHOPPING:
                    const speed = this.axeLevel == 0 ? this.chopSpeed0 : this.chopSpeed1; 
                    this.glbController.mixer.timeScale = speed;
                    animRef = this.glbController.getAnimIndexByName("03_chop");
                    this.glbController.playAnimByIndex( animRef );

                    const axeSFX = this.audioController.play("sfx_player_sword_swing_02");

                    break;
            }
    
            this.currentState = newState;
        }

        setHintVector( vec )
        {
            this.hintVector = vec ;
            //console.log("this.hintVector " , this.hintVector );
        }
        
        startChopping()
        {
            this.isChopping = true;
            this.setState( this.STATE_CHOPPING );
        }

        stopChopping()
        {
            this.isChopping = false;
        }
        
        setInput(x, y, rotation) {
            this.joystickInput = { x, y, rotation };
        }
        
        update(dt) {
            const { sphereBody, sphereMesh, joystickInput } = this;
            
            sphereBody.velocity.x = joystickInput.x * this.walkSpeed;
            sphereBody.velocity.z = -joystickInput.y * this.walkSpeed;
            
            // Calculate current movement speed for animation
            const currentSpeed = Math.sqrt(sphereBody.velocity.x ** 2 + sphereBody.velocity.z ** 2);
            const normalizedSpeed = currentSpeed / this.walkSpeed; // This gives 0-1 range based on max speed
            
            // Sync mesh with physics body
            sphereMesh.position.lerp(sphereBody.position, 0.25);
            
            if( this.directionMarker ) {
                this.directionMarker.position.copy(sphereBody.position);
                this.directionMarker.position.y +=0.5;

                if( this.hintVector ) {
                    faceTargetFlat(this.directionMarker, this.hintVector );
                } 
            } 
            
            if( !this.glbController ) return;

            // turn the player in the direction of joystick
            if (joystickInput.x !== 0 || joystickInput.y !== 0) {
                const angle = joystickInput.rotation;

                const q = new Quaternion();
                q.setFromAxisAngle(new Vector3(0, 1, 0), angle);
                sphereMesh.quaternion.slerp(q, 0.2);

                if( !this.isChopping && this.currentState != this.STATE_WALKING ) {
                    this.setState( this.STATE_WALKING );
                }
                
                // Update animation speed based on movement speed when walking
                if (this.currentState === this.STATE_WALKING && this.glbController) {
                    this.glbController.mixer.timeScale = Math.max(0.1, normalizedSpeed * 2); // Minimum 0.1 to avoid stopping
                }
            } else {
                if( !this.isChopping && this.currentState != this.STATE_IDLE ) {
                    this.setState( this.STATE_IDLE );
                }
            }

            if( this.glbController ) this.glbController.update( dt );
            if( this.logLauncherAnimator ) this.logLauncherAnimator.update( dt );
        }

        
        onAnimComplete( e )
        {
            switch( e.action._clip.name )
            {
                case "03_chop":
                    // respond to chop loop complete
                    this.dispatchEvent({ type: 'player_event', detail : "axe_chop_complete" });
                    const axeSFX = this.audioController.play("sfx_player_sword_swing_02");
                    break;
            }
        }

        currentSensorPosition = new Vector3(0, 0, 0);
        playLogCollectionAnim( triggeringBody )
        {
            // Ensure nearestTree is a Vector3
            this.currentSensorPosition = new Vector3(triggeringBody.position.x, triggeringBody.position.y, triggeringBody.position.z);
            
            // this.logStackController.addItem(); 
            
            this.SpawnFlyingLogToPlayer();
            // will be called on each log collected, and receives sensors wolrd body position
            // console.log("triggeringBody", triggeringBody.position );
        }

        // target vector is the lumbermill
        playLoseLogAnim( targetVector )
        {
            this.currentSensorPosition = targetVector.clone();
            this.SpawnFlyingLogFromPlayerToTarget(this.currentSensorPosition);
        }


        SpawnFlyingLogToPlayer(){
            const start = this.currentSensorPosition;
            const logCount =this.applicationModel.logCount;
            const end = this.sphereMesh.position.clone().add(new Vector3(0, logSpacing * logCount, -0.5));
            const rot = this.sphereMesh.rotation;
            this.logLauncherAnimator.launchItem( start, end, { type : "toPlayer" } , rot);
        }

        SpawnFlyingLogFromPlayerToTarget(targetposition) {
            const logCount =this.applicationModel.logCount;
            const start = this.sphereMesh.position.clone().add(new Vector3(0, logSpacing * logCount, -0.5));
            const end = targetposition.clone();   
            const rot = this.sphereMesh.rotation;
            this.logLauncherAnimator.launchItem( start, end, { type : "toSensor" } , rot);

            // remove from stack straght away
            this.logStackController.removeItem();
        }

        DropMultipleLogs( numLogsToLose ){

            const radius = 2.0; // Radius around player to drop logs
            const angleStep = (2 * Math.PI) / numLogsToLose; // Evenly distribute
            const startAngle = Math.random() * 2 * Math.PI; // Random starting angle    
            for (let i = 0; i < numLogsToLose; i++) {
                const angle = startAngle + i * angleStep;
                const targetPosition = new Vector3(
                    this.sphereMesh.position.x + radius * Math.cos(angle),
                    this.sphereMesh.position.y,
                    this.sphereMesh.position.z + radius * Math.sin(angle)
                );

                this.logLauncherAnimator.launchItem( 
                    this.sphereMesh.position, 
                    targetPosition, 
                    {  type : "skeleton" } , 
                    this.sphereMesh.rotation
                );

                // remove from stack straght away
                this.logStackController.removeItem();
            }        
        }

        onLogLaunchComplete( e ){

            switch( e.launchable.data.type )
            {
                case "toPlayer":
                     this.logStackController.addItem();
                     break;
            }
        }

    }

    function faceTargetFlat(object, target) {
        // Get world positions
        const objPos = new Vector3().copy(object.position);
        const targetPos = new Vector3().copy(target);

        // Ignore Y difference (force same height)
        targetPos.y = objPos.y;

        // Compute the direction vector
        const dir = new Vector3().subVectors(targetPos, objPos);

        // Calculate yaw angle (around Y axis)
        const angle = Math.atan2(dir.x, dir.z);

        // Apply only yaw rotation, keep pitch/roll at 0
        object.rotation.set(0, angle, 0);
        object.rotateX(degToRad(270));
    }
import { Body, Material,  Sphere, Vec3 } from "cannon-es";
import { SphereGeometry, Quaternion, Mesh, MeshStandardMaterial, Object3D, Euler, Vector3, EventDispatcher, TextureLoader, PlaneGeometry, MeshBasicMaterial, DoubleSide } from "three";
import { Hero_avatar } from '../../media/Hero_avatar.glb.js';
import { Log_Single } from "../../media/Log_Single.glb.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";
import { wood_icon } from '../../media/img_wood_icon.webp.js';
import { degToRad } from "three/src/math/MathUtils.js";

const logSpacing = 0.3;
export class Player extends EventDispatcher {
    carriedLogs = [];

    STATE_IDLE = "STATE_IDLE";
    STATE_WALKING = "STATE_WALKING";
    STATE_CHOPPING = "STATE_CHOPPING";

    isChopping = false;
    lastDropTime = 0; // Track last time logs were dropped
    dropCooldown = 3000; // 3 seconds in milliseconds
    
    constructor({ world, scene }) {
        super();
            this.world = world;
            this.scene = scene;

            this.axeLevel = 0;
            this.chopSpeed0 = 5;
            this.chopSpeed1 = 10;

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
                
            const loader = new GLTFLoader();
            loader.load(
                Hero_avatar, 
                (e) => {                 
                    scene.add(e.scene);   
                    console.log("e.scene:", e.scene );
                    this.sphereMesh.add( e.scene );
                    this.glbController = new GlbController({ glb : e } );
                    this.setState( this.STATE_IDLE );

                    // listen for animation complete ( loop only, 'finished' will nly fir on non looping anims )
                    this.boundOnAnimComplete = this.onAnimComplete.bind(this);
                    this.glbController.mixer.addEventListener('loop', this.boundOnAnimComplete )
                }, 
                undefined, 
                (e) => { console.error("error loading model", e); }
            );

            /// direction marker
            const tloader = new TextureLoader();
    
            const texture = tloader.load(wood_icon, () => {
                texture.needsUpdate = true;
                const geometry = new PlaneGeometry(3, 3); // Width and height
                const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent : false, wireframe: true   });
                const plane = new Mesh(geometry, material);
    
                // the model rotation is not visually aliging the texcture so manually set it for now
                // plane.rotation.copy( rotation );
                // const rotationY = degToRad(61);
                // plane.rotation.y = rotationY;
                plane.rotateX(degToRad(270));
                plane.position.copy( this.sphereMesh.position );
                plane.position.y +=0.1;
                this.scene.add(plane);
                
                this.directionMarker = plane;
            });  
        }

        upgradeAxe()
        {
            this.axeLevel++;
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
                    break;
            }
    
            this.currentState = newState;
        }

        setHintVector( vec )
        {
            this.hintVector = vec ;
            console.log("this.hintVector " , this.hintVector );
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
            
            // Sync mesh with physics body
            sphereMesh.position.copy(sphereBody.position);
            if( this.directionMarker )
            {
                this.directionMarker.position.copy(sphereBody.position);
                // up it a litle so it clears the ground
                this.directionMarker.position.y +=0.5;

                // console.log("this.hintVector " , this.hintVector );
                if( this.hintVector )
                    {
                        // Example usage in your render loop:
                        faceTargetFlat(this.directionMarker, this.hintVector );

                        //this.directionMarker.lookAt( this.hintVector );
                        //this.directionMarker.rotateX(degToRad(270));
                    } 
            } 
            
            if( !this.glbController ) return;

            // turn the player in the direction of joystick
            if (joystickInput.x !== 0 || joystickInput.y !== 0) {
                const angle = joystickInput.rotation;

                const q = new Quaternion();
                q.setFromAxisAngle(new Vector3(0, 1, 0), angle);
                sphereMesh.quaternion.slerp(q, 0.2); // Smooth turning

                if( !this.isChopping && this.currentState != this.STATE_WALKING ) this.setState( this.STATE_WALKING );
            } else {
                if( !this.isChopping && this.currentState != this.STATE_IDLE ) this.setState( this.STATE_IDLE );
            }

            if( this.glbController ) this.glbController.update( dt );
        }

        
        onAnimComplete( e )
        {
            switch( e.action._clip.name )
            {
                case "03_chop":
                    // respond to chop loop complete
                    this.dispatchEvent({ type: 'player_event', detail : "axe_chop_complete" });
                    break;
            }
        }

        currentSensorPosition = new Vector3(0, 0, 0);
        playLogCollectionAnim( triggeringBody )
        {
            // Ensure nearestTree is a Vector3
            this.currentSensorPosition = new Vector3(triggeringBody.position.x, triggeringBody.position.y, triggeringBody.position.z);
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


        SpawnFlyingLogToPlayer() {
            const start = this.currentSensorPosition;
            const logCount = this.carriedLogs.length + 1;
            const end = this.sphereMesh.position.clone().add(new Vector3(0, logSpacing * logCount, -0.5));
            const scene = this.scene;

            // Load the Log_Single GLB model and animate it
            const loader = new GLTFLoader();
            loader.load(
                Log_Single,
                (gltf) => {
                    const logMesh = gltf.scene;
                    logMesh.position.copy(start);
                    logMesh.rotation.copy(this.sphereMesh.rotation);
                    logMesh.scale.set(0.4, 1.1, 1.1); // Match player's rotation
                    scene.add(logMesh);

                    const duration = 0.25; // seconds
                    let elapsed = 0;
                    const peakHeight = 2.0;
                    let lastTime = performance.now();

                    const animate = () => {
                        const now = performance.now();
                        const dt = (now - lastTime) / 1000;
                        lastTime = now;
                        elapsed += dt;
                        let t = Math.min(elapsed / duration, 1);
                        const current = start.clone().lerp(end, t);
                        current.y += peakHeight * Math.sin(Math.PI * t);
                        logMesh.position.copy(current);
                        if (t < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            scene.remove(logMesh);
                            // After animation, spawn log on player's back
                            this.addLogToBack();
                        }
                    };
                    requestAnimationFrame(animate);
                },
                undefined,
                (error) => {
                    console.error('Error loading Log_Single GLB:', error);
                }
            );
        }

        DropMultipleLogs(){
            // Check if cooldown period has passed
            const currentTime = performance.now();
            if (currentTime - this.lastDropTime < this.dropCooldown) {
                console.log(`Drop logs on cooldown. ${((this.dropCooldown - (currentTime - this.lastDropTime)) / 1000).toFixed(1)}s remaining`);
                return; // Still in cooldown period
            }

            //for 0-5 logs, send flyinglogfromplayerto radius around player
            const logCount = 5;
            if (logCount === 0) return; // No logs to drop  

            // Update last drop time
            this.lastDropTime = currentTime;

            const radius = 2.0; // Radius around player to drop logs
            const angleStep = (2 * Math.PI) / logCount; // Evenly distribute
            const startAngle = Math.random() * 2 * Math.PI; // Random starting angle    
            for (let i = 0; i < logCount; i++) {
                const angle = startAngle + i * angleStep;
                const targetPosition = new Vector3(
                    this.sphereMesh.position.x + radius * Math.cos(angle),
                    this.sphereMesh.position.y,
                    this.sphereMesh.position.z + radius * Math.sin(angle)
                );
                this.SpawnFlyingLogFromPlayerToTarget(targetPosition);
            }        
        }

        SpawnFlyingLogFromPlayerToTarget(targetposition) {
            const logCount = this.carriedLogs.length + 1;
            const start = this.sphereMesh.position.clone().add(new Vector3(0, logSpacing * logCount, -0.5));
            const end = targetposition.clone();   
            const scene = this.scene;

            // Load the Log_Single GLB model and animate it
            const loader = new GLTFLoader();
            loader.load(
                Log_Single,
                (gltf) => {
                    const logMesh = gltf.scene;
                    logMesh.position.copy(start);
                    logMesh.rotation.copy(this.sphereMesh.rotation);
                    logMesh.scale.set(0.4, 1.1, 1.1);; // Match player's rotation
                    scene.add(logMesh);

                    const duration = 0.25; // seconds
                    let elapsed = 0;
                    const peakHeight = 2.0;
                    let lastTime = performance.now();

                    const animate = () => {
                        const now = performance.now();
                        const dt = (now - lastTime) / 1000;
                        lastTime = now;
                        elapsed += dt;
                        let t = Math.min(elapsed / duration, 1);
                        const current = start.clone().lerp(end, t);
                        current.y += peakHeight * Math.sin(Math.PI * t);
                        logMesh.position.copy(current);
                        if (t < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            scene.remove(logMesh);
                            // After animation, spawn log on player's back
                            this.removeLogFromBack();
                        }
                    };
                    requestAnimationFrame(animate);
                },
                undefined,
                (error) => {
                    console.error('Error loading Log_Single GLB:', error);
                }
            );
        }

        addLogToBack() {
            const loader = new GLTFLoader();
            loader.load(
                Log_Single,
                (gltf) => {
                    const logMesh = gltf.scene;
                    // Stack logs higher for each new log
                    const logCount = this.carriedLogs.length;
                    logMesh.position.set(0, 1 + logCount * logSpacing, -0.5); // Adjust Y and Z for stacking
                    logMesh.rotation.set(Math.PI / 2, 0, 0); // Optional: rotate to look more like a pile
                    logMesh.scale.set(0.4, 1.1, 1.1); // Match player's rotation
                    this.sphereMesh.add(logMesh);
                    this.carriedLogs.push(logMesh);
                },
                undefined,
                (error) => {
                    console.error('Error loading Log_Single GLB for back:', error);
                }
            );
        
         }

       removeLogFromBack() {
           if (this.carriedLogs.length > 0) {
               const logMesh = this.carriedLogs.pop();
               this.sphereMesh.remove(logMesh);
               logMesh.traverse((child) => {
                   if (child.isMesh) {
                       if (child.geometry) child.geometry.dispose();
                       if (child.material) {
                           if (Array.isArray(child.material)) {
                               child.material.forEach(mat => mat.dispose());
                           } else {
                               child.material.dispose();
                           }
                       }
                   }
               });
           }
       }
    }

    // function faceTargetFlat(object, target) {
    //     // Get direction vector in world space
    //     const dx = target.x - object.position.x;
    //     const dz = target.z - object.position.z;

    //     // Calculate rotation in yaw only
    //     const angle = Math.atan2(dx, dz);

    //     // Set rotation so plane stays flat (only Y rotation changes)
    //     object.rotation.set(0, angle, 0);
    // }

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
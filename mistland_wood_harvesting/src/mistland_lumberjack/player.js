import { Body, Material,  Sphere, Vec3 } from "cannon-es";
import { SphereGeometry, Quaternion, Mesh, MeshStandardMaterial, Object3D, Euler, Vector3, EventDispatcher } from "three";
import { Hero_avatar } from '../../media/Hero_avatar.glb.js';
import { Log_Single } from "../../media/Log_Single.glb.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";

const logSpacing = 0.25;
export class Player extends EventDispatcher {
    carriedLogs = [];

    STATE_IDLE = "STATE_IDLE";
    STATE_WALKING = "STATE_WALKING";
    STATE_CHOPPING = "STATE_CHOPPING";

    isChopping = false;
    
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

        closestTreePosition = new Vector3(0, 0, 0);
        playLogCollectionAnim( triggeringBody )
        {
            // Ensure nearestTree is a Vector3
            this.closestTreePosition = new Vector3(triggeringBody.position.x, triggeringBody.position.y, triggeringBody.position.z);
            this.SpawnFlyingLogToPlayer();
            // will be called on each log collected, and receives sensors wolrd body position
            // console.log("triggeringBody", triggeringBody.position );
        }

        // target vector is the lumbermill
        playLoseLogAnim( targetVector )
        {
            console.log("play lose log anim")
        }


        SpawnFlyingLogToPlayer() {
            const start = this.closestTreePosition;
            const logCount = this.carriedLogs.length;
            const end = this.sphereMesh.position.clone().add(new Vector3(0, logSpacing * logCount, 0));
            const scene = this.scene;

            // Load the Log_Single GLB model and animate it
            const loader = new GLTFLoader();
            loader.load(
                Log_Single,
                (gltf) => {
                    const logMesh = gltf.scene;
                    logMesh.position.copy(start);
                    logMesh.rotation.copy(this.sphereMesh.rotation);
                    logMesh.scale.set(0.4, 1, 1); // Match player's rotation
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
                    logMesh.scale.set(0.4, 1, 1); // Match player's rotation
                    this.sphereMesh.add(logMesh);
                    this.carriedLogs.push(logMesh);
                },
                undefined,
                (error) => {
                    console.error('Error loading Log_Single GLB for back:', error);
                }
            );
    }
    
    
}

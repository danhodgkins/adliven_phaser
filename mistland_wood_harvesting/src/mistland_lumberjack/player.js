import { Body, Material,  Sphere, Vec3 } from "cannon-es";
import { SphereGeometry, Quaternion, Mesh, MeshStandardMaterial, Object3D, Euler, Vector3 } from "three";
import { HeroAvatarGLB } from '../../media/Hero_avatar.glb.js';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import glb_controller from "./glb_controller.js";
import GlbController from "./glb_controller.js";

export class Player {

    STATE_IDLE = "STATE_IDLE";
    STATE_WALKING = "STATE_WALKING";
    STATE_CHOPPING = "STATE_CHOPPING";

    isChopping = false;
    
    constructor({ world, scene }) {
        this.world = world;
        this.scene = scene;
        
        this.joystickInput = { x: 0, y: 0 };
        
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
        
        // Three.js mesh
        // const sphereMesh = new Mesh(
            //     new SphereGeometry(radius, 32, 32),
            //     new MeshStandardMaterial({ color: 0x00ff00 })
            // );
            // scene.add(sphereMesh);
            // this.sphereMesh = sphereMesh;
            
            // create parent object so sensors etc dont throw null error until glb inited
            
            this.sphereMesh = new Object3D();
            scene.add(this.sphereMesh);
            
            const loader = new GLTFLoader();
            loader.load(
                HeroAvatarGLB, 
                (e) => {                 
                    scene.add(e.scene);   
                    console.log("e.scene:", e.scene );
                    this.sphereMesh.add( e.scene );
                    this.glbController = new GlbController({ glb : e } );
                    this.setState( this.STATE_IDLE );
                }, 
                undefined, 
                (e) => { console.error("error loading model", e); }
            );
        }
    
        setState( newState  )
        {
            let animRef = null;
            switch( newState )
            {
                case this.STATE_WALKING:
                    animRef = this.glbController.getAnimIndexByName("02_walk");
                    this.glbController.playAnimByIndex( animRef );
                    break;
    
                case this.STATE_IDLE:
                    animRef = this.glbController.getAnimIndexByName("01_idle");
                    this.glbController.playAnimByIndex( animRef );
                    break;

                case this.STATE_CHOPPING:
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
            
            if( !this.glbController ) return;
            
            const { sphereBody, sphereMesh, joystickInput } = this;

            const speed = 6;
            sphereBody.velocity.x = joystickInput.x * speed;
            sphereBody.velocity.z = -joystickInput.y * speed;

            // Sync mesh with physics body
            sphereMesh.position.copy(sphereBody.position);

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
}

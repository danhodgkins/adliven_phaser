import { Mesh, MeshBasicMaterial, Raycaster, SphereGeometry, Vector3 } from "three";
import CANNON from 'cannon';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Bunny01ThumbGLB } from '../../media/Bunny_01_thumb.glb.js';
import { MovingTarget } from "./moving_target.js";

export class FRLevelController {
    
    eventDispatcher;
    raycaster;
    mouseCoords;
    boundOnInput;
    camera;
    scene;
    world;
    ballsToUpdate;
    score = 0;

    constructor({ config, physicsWorld, camera, threeScene }) {
        this.config = config;
        this.world = physicsWorld;
        this.camera = camera;
        this.scene = threeScene;
        this.eventDispatcher = new EventTarget();
        this.raycaster = new Raycaster();
        this.mouseCoords = new Vector3();
        this.boundOnInput = this.onInput.bind(this);
        this.ballsToUpdate = [];
        window.addEventListener( 'pointerdown', this.boundOnInput );

        this.mt = new MovingTarget({ threeScene: this.scene, physicsWorld: this.world });

        // load zombunny
        // const loader = new GLTFLoader();
        // loader.load(
        //     Bunny01ThumbGLB, 
        //     (e) => {                 
        //         this.scene.add(e.scene); 
        //         const sphereShape = new CANNON.Sphere(1)
        //         const sphereBody = new CANNON.Body({ 
        //             position: new CANNON.Vec3(0,1.5, 0),
        //             mass:0
        //         })
        //         sphereBody.addShape(sphereShape)
        //         this.world.addBody(sphereBody)

        //         // Listen for collision events on bodyA
        //         sphereBody.addEventListener("collide", (event)=>{
        //             // if (event.body === bodyB) {
        //             //     console.log("bodyA collided with bodyB!");
        //             // } else {
        //             //     console.log("bodyA collided with another body.");
        //             // }
        //             this.score++;
        //             console.log("collided.", this.score, this.config.targetPoints);
        //             if( this.score >= this.config.targetPoints) {
        //                 this.eventDispatcher.dispatchEvent(new CustomEvent('levelComplete', { detail: { score: this.score } }));
        //             }
        //         });

        //     }, 
        //     undefined, 
        //     (e) => { console.error("error loading model", e); }
        // );

    }

    spawnTarget() {

    }

    destroy() {

        this.ballsToUpdate.forEach(element => {
            this.scene.remove(element.mesh);
            this.world.removeBody(element.body);
        });

        window.removeEventListener( 'pointerdown', this.boundOnInput );
        this.eventDispatcher= null;
        this.raycaster= null;
        this.mouseCoords= null;
        this.boundOnInput= null;      
        this.camera;
        this.scene= null;      
        this.world= null;      
        this.ballsToUpdate = null;  
    }

    update( dt ) {
        if( this.mt ) {
            this.mt.update(dt); 
        }

        this.ballsToUpdate.forEach(element => {
            element.mesh.position.set(
                element.body.position.x, 
                element.body.position.y, 
                element.body.position.z
            );
            element.mesh.quaternion.set(
                element.body.quaternion.x, 
                element.body.quaternion.y, 
                element.body.quaternion.z, 
                element.body.quaternion.w
            );               
            
            if( element.birthTime && Date.now() - element.birthTime > 5000 ){
                this.scene.remove(element.mesh);
                this.world.removeBody(element.body);
                this.ballsToUpdate.splice(this.ballsToUpdate.indexOf(element), 1);
            }
        });
    }

    
    onInput(event) {
        const raycaster = this.raycaster;
        const mouseCoords = this.mouseCoords;

        mouseCoords.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1
        );

        raycaster.setFromCamera( mouseCoords, this.camera );

            // init sphere
        const geometry = new SphereGeometry( 0.5 );
        const material = new MeshBasicMaterial( { color: tuneableGameParams.bulletColour } );
        const mesh = new Mesh( geometry, material );
        this.scene.add( mesh );

        // const pos = new Vector3();
        // pos.copy( raycaster.ray.direction );
        // pos.add( raycaster.ray.origin );
        // pos.copy( raycaster.ray.direction );
        // // pos.multiplyScalar( 24 );

        // Position at ray origin (camera near plane)
        const origin = raycaster.ray.origin.clone();
        mesh.position.copy(origin);

        const sphereShape = new CANNON.Sphere(0.8)
        const sphereBody = new CANNON.Body({ 
            // position: new CANNON.Vec3(pos.x,pos.y,pos.z),
            mass:tuneableGameParams.bulletMass
        })

        sphereBody.userData = { type: 'projectile' };

        sphereBody.addShape(sphereShape)
        sphereBody.position.set(origin.x, origin.y, origin.z); // correctly set Cannon body position
        this.world.addBody(sphereBody)

        // sphereBody.position.x = mesh.position.x = raycaster.ray.origin.x;
        // sphereBody.position.y = mesh.position.y = raycaster.ray.origin.x;
        // sphereBody.position.z = mesh.position.z = raycaster.ray.origin.x;

        const direction = raycaster.ray.direction.clone().normalize();

        // sphereBody.applyImpulse(
        //     new CANNON.Vec3(direction.x,direction.y,direction.z),
        //     new CANNON.Vec3(0, 0, 0)
        // );

        // Apply impulse in ray direction
        const impulse = new CANNON.Vec3(direction.x, direction.y, direction.z).scale(50);
        sphereBody.applyImpulse(impulse, sphereBody.position);

        this.ballsToUpdate.push({
            mesh: mesh,
            body: sphereBody,
            birthTime: Date.now()
        });
    }
}
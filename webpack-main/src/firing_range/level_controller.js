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
    movingTargets;
    movingTargetsToDestroy;
    uiController;
    timer;
    progressBar;

    constructor({ config, physicsWorld, camera, threeScene,  uiController, timer, progressBar }) {
        this.uiController = uiController;
        this.config = config;
        this.world = physicsWorld;
        this.camera = camera;
        this.scene = threeScene;
        this.eventDispatcher = new EventTarget();
        this.raycaster = new Raycaster();
        this.mouseCoords = new Vector3();
        this.boundOnTargetHit = this.onTargetHit.bind(this);
        this.boundOnInput = this.onInput.bind(this);
        this.timer = timer;
        this.progressBar = progressBar;
        this.ballsToUpdate = [];
        this.movingTargets = [];
        this.movingTargetsToDestroy = [];
        window.addEventListener( 'pointerdown', this.boundOnInput );

        this.uiController.onScoreUpdate( this.score );
        this.spawnTarget();
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
        const mt = new MovingTarget({ threeScene: this.scene, physicsWorld: this.world, col: this.config.boxColour });
        mt.eventDispatcher.addEventListener('targetHit', this.boundOnTargetHit );
        this.movingTargets.push( mt );
    }

    postStepDestroy() {
        this.movingTargetsToDestroy.forEach(element => {
            element.destroy();
            this.movingTargets.splice(this.movingTargets.indexOf(element), 1);
            this.movingTargetsToDestroy.splice(this.movingTargetsToDestroy.indexOf(element), 1);
        });
    }

    onTargetHit(e) {
        // add mt to list of targets to destroy
        const mv = e.detail.target;
        mv.eventDispatcher.removeEventListener('targetHit', this.boundOnTargetHit );
        this.movingTargetsToDestroy.push(mv);

        this.score++;
        this.uiController.onScoreUpdate( this.score );
        if( this.score >= this.config.targetPoints) {
            this.eventDispatcher.dispatchEvent(new CustomEvent('levelComplete', { detail: { score: this.score } }));
        } else {
            this.spawnTarget(); // spawn a new target
        }
    }

    destroy() {
        // destroty any targets that are set to be destroyed
        this.postStepDestroy();

        this.movingTargets.forEach(element => {
            element.eventDispatcher.removeEventListener('targetHit', this.boundOnTargetHit );
            element.destroy();
        });

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
        if( this.movingTargets && this.movingTargets.length > 0 ) {
            this.movingTargets.forEach(mt => {
                mt.update(dt);
            });
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
            
            if( element.birthTime && Date.now() - element.birthTime > 2000 ){
                this.scene.remove(element.mesh);
                this.world.removeBody(element.body);
                this.ballsToUpdate.splice(this.ballsToUpdate.indexOf(element), 1);
            }
        });

        this.postStepDestroy();

        const remaining = this.config.duration - this.timer.ms();
        // console.log("" , this.timer.ms() / this.config.duration)
        this.uiController.displayTime( remaining );
        this.progressBar.updateBar( this.timer.ms() / this.config.duration );
        if( remaining <= 0 )
        {
            this.eventDispatcher.dispatchEvent(new CustomEvent('levelFailed', { detail: { score: this.score } }));
        }
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

        // Position at ray origin (camera near plane)
        const origin = raycaster.ray.origin.clone();
        mesh.position.copy(origin);

        const sphereShape = new CANNON.Sphere(0.8)
        const sphereBody = new CANNON.Body({ 
            mass:tuneableGameParams.bulletMass
        })

        sphereBody.userData = { type: 'projectile' };

        sphereBody.addShape(sphereShape)
        sphereBody.position.set(origin.x, origin.y, origin.z); // correctly set Cannon body position
        this.world.addBody(sphereBody)

        const direction = raycaster.ray.direction.clone().normalize();

        // Apply impulse in ray direction
        const impulse = new CANNON.Vec3(direction.x, direction.y, direction.z).scale(100);
        sphereBody.applyImpulse(impulse, sphereBody.position);

        this.ballsToUpdate.push({
            mesh: mesh,
            body: sphereBody,
            birthTime: Date.now()
        });
    }
}
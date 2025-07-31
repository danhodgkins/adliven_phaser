import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import { MistlandLumberjackUIController } from "./ui_controller";
import { degToRad } from "three/src/math/MathUtils.js";
import { World, Body, Box, Vec3, Plane, Material } from 'cannon-es'
import { Player } from "./player";
import { PhysicsBounds } from "./physics_bounds";
import { FollowCamera } from "./follow_cam";

export class MistlandLumberjackApplication extends BaseScene{
    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);
        this.uiController = new MistlandLumberjackUIController( document.getElementById("ui-overlay") );
    }

    init(){
        const scene = new Scene();
        this.scene = scene;

        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);

        //const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputEncoding = SRGBColorSpace;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );

        this.renderer = renderer;
        // this.camera = camera;

        // this.camera.position.x = 0;
        // this.camera.position.y = 5;
        // this.camera.position.z = 10;

        // // this.camera.zoom = 2; // higher = closer
        // this.camera.updateProjectionMatrix();

        // Setup our world
        var world = new World();
        world.solver.iterations = 10;
        world.gravity.set(0, -10, 0); // m/s²
        this.physicsWorld = world;
        
        // input 
        // User input
        this.joystickInput = { x: 0, y: 0 }
        
        // Simulated joystick (you can replace this with nipplejs)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.joystickInput.y = -1
            if (e.key === 'ArrowDown') this.joystickInput.y = 1
            if (e.key === 'ArrowLeft') this.joystickInput.x = -1
            if (e.key === 'ArrowRight') this.joystickInput.x = 1
        })
        window.addEventListener('keyup', () => {
            console.log("keyup")
            this.joystickInput = { x: 0, y: 0 }
        })
        
        const boxes = [
            { 
                position: { x: 0, y: 0, z: -5 }, 
                size: { x: 1, y: 1, z: 3 },
                rotationY: Math.PI / 4, // 45 degrees 
            },
            { 
                position: { x: 3, y:0, z: -2 }, 
                size: { x: 1, y: 1, z: 3 } ,
                rotationY: 0, // no rotation
            },
            { 
                position: { x:-3, y:0, z: -10 }, 
                size: { x: 1, y: 1, z: 3 } ,
                rotationY: -Math.PI / 4, // no rotation
            }
        ];        
        const bounds = new PhysicsBounds({ boxes, world, scene });

        // player
        this.player = new Player({
            world: world,
            scene: scene
        });

        const followCam = new FollowCamera({
            target: this.player.sphereMesh,
            renderer,
            scene,
            zoom: 10,
            lerpFactor: 0.05,
            offset: new Vector3(0, 5, 5), // 20 units above the player
        });

        this.camera = followCam.getCamera();
        this.followCam = followCam;
    }

    destroyLevelAfterStep = false;
    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        this.player.setInput(this.joystickInput.x, this.joystickInput.y);
        this.player.update(dt);
        this.followCam.update();
        if( this.physicsWorld ) this.physicsWorld.step( this.fixedTimeStep, dt, this.maxSubSteps);
        this.renderer.render( this.scene, this.camera );
    }
}
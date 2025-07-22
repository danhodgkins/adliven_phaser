import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import CANNON from 'cannon';
import { degToRad } from "../scene/si_main_scene";
import { FRLevelController } from "./level_controller";
import { If } from "three/tsl";

export class FiringRangeApplication extends BaseScene{
    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);
    }

    init(){
        const scene = new Scene();
        this.scene = scene;

        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);

        const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputEncoding = SRGBColorSpace;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );

        this.renderer = renderer;
        this.camera = camera;

        this.camera.position.x = 0;
        this.camera.position.y = 5;
        this.camera.position.z = 10;

        // this.camera.zoom = 2; // higher = closer
        this.camera.updateProjectionMatrix();

        // Setup our world
        var world = new CANNON.World();
        world.gravity.set(0, -10, 0); // m/s²

        //init plane
        const material = new MeshBasicMaterial({ color: tuneableGameParams.floorColour , side: DoubleSide});
        const geometry = new PlaneGeometry(100,100);
        const plane = new Mesh(geometry, material);
        plane.rotateX(degToRad(270))
        scene.add(plane);
        
        // cannon planes are INFINTE so use a box if you want a floor
        const planeShape = new CANNON.Plane()
        const planeBody = new CANNON.Body({ mass: 0 })
        planeBody.addShape(planeShape)
        planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
        world.addBody(planeBody)

        this.physicsWorld = world
        this.nextLevel();
    }

    currentLevel=0;
    currentLevelController = null;

    nextLevel() {
        this.currentLevel++;
        const levelConfig = frLevels[this.currentLevel];

        const levelController = new FRLevelController({ 
            config: levelConfig, 
            physicsWorld: this.physicsWorld,
            camera: this.camera,
            threeScene: this.scene
        });

        this.currentLevelController = levelController;
        this.currentLevelController.eventDispatcher.addEventListener('levelComplete', this.onLevelComplete.bind(this));
    }

    onLevelComplete() {
        if( this.currentLevel +1 >= frLevels.length ) {
            console.log("All levels complete!");
            return;
        } else {
            this.nextLevel();
        }
    }

    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        this.renderer.render( this.scene, this.camera );
        if( this.currentLevelController ) {
            this.currentLevelController.update( dt );
            if( this.physicsWorld ) this.physicsWorld.step( this.fixedTimeStep, dt, this.maxSubSteps);
        }
    }
}
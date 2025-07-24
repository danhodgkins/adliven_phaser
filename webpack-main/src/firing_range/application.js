import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import CANNON from 'cannon';
import { degToRad } from "../scene/si_main_scene";
import { FRLevelController } from "./level_controller";
import { If } from "three/tsl";
import { UIController } from "./ui_controller";
import { Timer } from "timer-node";
import { PixiProgressBar } from "../pixi/progress_bar";

export class FiringRangeApplication extends BaseScene{
    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);
        this.uiController = new UIController( document.getElementById("ui-overlay") );
        this.uiController.showIntro();
        this.timer = new Timer({ label: 'timer' });
        // this.timerDisplay();

        this.boundOnLevelFailed = this.onLevelFailed.bind( this );
        this.boundOnLevelComplete = this.onLevelComplete.bind( this );

        const parent = document.getElementById("timerOutput");
        console.log("Pixi Application initialized with parent:", parent);
        const progressBar = new PixiProgressBar( { parentEl : parent });
        this.progressBar = progressBar;
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
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;
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

        // Handle window resize or rotation
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        });

    }

    currentLevel=0;
    currentLevelController = null;
    levelWon = false;

    nextLevel() {
        const levelConfig = frLevels[this.currentLevel];
        const levelController = new FRLevelController({ 
            config: levelConfig, 
            physicsWorld: this.physicsWorld,
            camera: this.camera,
            threeScene: this.scene,
            uiController : this.uiController,
            timer:this.timer,
            progressBar:this.progressBar
        });

        this.currentLevelController = levelController;
        this.currentLevelController.eventDispatcher.addEventListener('levelComplete', this.boundOnLevelComplete );
        this.currentLevelController.eventDispatcher.addEventListener('levelFailed', this.boundOnLevelFailed );

        this.uiController.onLevelUpdate( this.currentLevel );
        this.timer.clear();
        this.timer.start();
    }

    onLevelFailed(){
        console.log("level failed!");
        this.uiController.onLevelFailed( this.currentLevel );
        this.destroyLevelAfterStep = true;
        this.timer.stop();
        this.levelWon = false;

        // replay same level ( no incrment currentLevel value)
    }

    onLevelComplete() {
        console.log("level complete!");
        this.uiController.onLevelUp( this.currentLevel );
        this.destroyLevelAfterStep = true;
        this.timer.stop();
        this.levelWon = true;
    }

    destroyLevelAfterStep = false;
    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        this.renderer.render( this.scene, this.camera );
        if( this.currentLevelController ) {
            if( this.physicsWorld ) this.physicsWorld.step( this.fixedTimeStep, dt, this.maxSubSteps);
            this.currentLevelController.update( dt );
        }

        if( this.destroyLevelAfterStep ) {
            this.destroyLevelAfterStep = false;
            
            this.currentLevelController.eventDispatcher.removeEventListener('levelComplete', this.boundOnLevelComplete );
            this.currentLevelController.eventDispatcher.removeEventListener('levelFailed', this.boundOnLevelFailed );
            
            this.currentLevelController.destroy();
            this.currentLevelController = null;

            if( this.levelWon ) this.currentLevel++;
            
            if( this.currentLevel >= frLevels.length ) {
                // this.currentLevelController = null
                this.currentLevel = 0; // reset to first level
                console.log("All levels complete!");
                this.uiController.onGameOver();
                this.nextLevel();
                return;
            } else {
                this.nextLevel();
            }
        }
    }
}
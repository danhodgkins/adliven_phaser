import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import { MistlandLumberjackUIController } from "./ui_controller";
import { World, Body, Box, Vec3, Plane, Material } from 'cannon-es'
import { Player } from "./player";
import { PhysicsBounds } from "./physics_bounds";
import { FollowCamera } from "./follow_cam";
import TreeZone from "./tree_zone";
import LumberMillZone from "./lumbermill_zone";

export class MistlandLumberjackApplication extends BaseScene{
    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);
        this.applicationModel = new ApplicationModel();
        this.uiController = new MistlandLumberjackUIController( document.getElementById("ui-overlay"),this.applicationModel );
    }

    init(){
        const scene = new Scene();
        this.scene = scene;

        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);

        // renderer
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputEncoding = SRGBColorSpace;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );
        this.renderer = renderer;

        // input 
        this.joystickInput = { x: 0, y: 0 }
        
        // Simulated joystick (you can replace this with nipplejs)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.joystickInput.y = -1
            if (e.key === 'ArrowDown') this.joystickInput.y = 1
            if (e.key === 'ArrowLeft') this.joystickInput.x = -1
            if (e.key === 'ArrowRight') this.joystickInput.x = 1
        })
        window.addEventListener('keyup', () => {
            this.joystickInput = { x: 0, y: 0 }
        })

        // Setup physics world
        var world = new World();
        world.solver.iterations = 10;
        world.gravity.set(0, -10, 0); // m/s²
        this.physicsWorld = world;        
        
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
            zoom: 15,
            lerpFactor: 0.05,
            offset: new Vector3(0, 25, 25), // 20 units above the player
        });

        this.camera = followCam.getCamera();
        this.followCam = followCam;

        // trees 
        this.trees = [];
        const treeConfigs = [
            { position: new Vec3(5, 0.5, 5) },
            { position: new Vec3(5, 0.5, -5) },
            { position: new Vec3(5, 0.5, -10) },
            { position: new Vec3(5, 0.5, -15) },
        ];

        treeConfigs.forEach(element => {
            const tz = new TreeZone( {
            world,
            scene,
            position: element.position,
            radius: 1.5,
            playerBody: this.player.sphereBody,
            });
            tz.sensor.addEventListener('enter', this.onTreeZoneEnter.bind(this));
            tz.sensor.addEventListener('exit', this.onTreeZoneExit.bind(this));
            this.trees.push( tz );
        });

        // lumbermill zonenew 
        const lumberMillZone = new LumberMillZone({
            world,
            scene,
            position: new Vec3(-5, 0.5, 5),
            radius: 1.5,
            playerBody: this.player.sphereBody,
        });
        lumberMillZone.sensor.addEventListener('enter', this.onLumbermillZoneEnter.bind(this));
        lumberMillZone.sensor.addEventListener('exit', this.onLumbermillZoneExit.bind(this));
        this.lumberMillZone = lumberMillZone;
    }



    // respond to tree zone events
    intervalID = -1;
    boundOnChopWoodHandler = this.onChopWoodHandler.bind(this);
    onTreeZoneEnter( e ) {
        //console.log("Player entered tree zone!" , e.body);
        this.intervalID = setInterval(this.boundOnChopWoodHandler, 300); // Chop wood every second
    }
    onTreeZoneExit( e ) {
        console.log("Player exited tree zone!" , this.intervalID );
        if( this.intervalID !== -1) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    }

    onChopWoodHandler() {
        console.log("Chopping wood...", Date.now());
        this.applicationModel.logCount++;
        this.uiController.updateUI();
    }

    // respond to lumbermill zone events
    boundOnLumbermillTickHandler = this.onLumbermillTickHandler.bind(this);
    onLumbermillZoneEnter( e ) {
        //console.log("Player entered lumbermill zone!" , e.body);
        this.intervalID = setInterval(this.boundOnLumbermillTickHandler, 300); // Chop wood every second
    }

    onLumbermillZoneExit( e ) {
        //console.log("Player exited lumbermill zone!" , e.body);
        if( this.intervalID !== -1) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    }

    onLumbermillTickHandler() {
        console.log("depositing wood...", Date.now());
        if( this.applicationModel.logCount  > 0 ) {
            this.applicationModel.logCount--;
            this.applicationModel.gemCount++;

        }
        this.uiController.updateUI();
    }

    /// end sensors stuff

    destroyLevelAfterStep = false;
    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        this.player.setInput(this.joystickInput.x, this.joystickInput.y);
        this.player.update(dt);

        this.trees.forEach(element => {
            element.update();            
        });

        this.lumberMillZone.update();

        this.followCam.update();
        if( this.physicsWorld ) this.physicsWorld.step( this.fixedTimeStep, dt, this.maxSubSteps);
        this.renderer.render( this.scene, this.camera );
    }
}

class ApplicationModel{
    logCount = 0;
    gemCount = 0;
}
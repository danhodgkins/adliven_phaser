import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, EventDispatcher, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import { MistlandLumberjackUIController } from "./ui_controller";
import { World, Body, Box, Vec3, Plane, Material } from 'cannon-es'
import { Player } from "./player";
import { PhysicsBounds } from "./physics_bounds";
import { FollowCamera } from "./follow_cam";
import TreeZone from "./sensors/tree_zone";
import LumberMillZone from "./sensors/lumbermill_zone";
import nipplejs from 'nipplejs';
import SensorsController from "./sensors/sensors_controller";
import { ApplicationModel } from "./application_model";
import WorkshopController from "./workshop_controller";
import layoutData from "./data/layout.json"
import { layoutSceneHelper } from "../utils/layout";
import CannonDebugger from "cannon-es-debugger";

export class MistlandLumberjackApplication extends BaseScene{
    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);
        
        this.boundOnSensorEvent = this.onSensorEvent.bind( this );
        
        this.applicationModel = new ApplicationModel();
        this.boundOnModelEvent = this.onModelEvent.bind( this );
        this.applicationModel.addEventListener('model_event', this.boundOnModelEvent );
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

        // layout scene 
        layoutSceneHelper( { data:layoutData , scene })

        // input 
        
        var options = {           
            mode: "dynamic",   // 'dynamic', 'static' or 'semi'
            color: "blue"
        };
        
        this.joystickInput = { x: 0, y: 0, rotation: 0 };  
             
        var joystick = nipplejs.create(options);
        joystick.on('move', (evt, data) => {
            const rad = data.angle.radian;
            const dist = Math.min(data.distance / 50, 1); // Normalize to max speed
            this.joystickInput.x = Math.cos(rad) * dist;
            this.joystickInput.y = Math.sin(rad) * dist;

            // Inverted Y for correct travel direction if needed
            this.joystickInput.rotation = Math.atan2(this.joystickInput.x, -this.joystickInput.y);
        });

        joystick.on('end', (evt, data)=> {            
            this.joystickInput.x = 0;
            this.joystickInput.y = 0;
        });
        // end input 

        // Setup physics world
        var world = new World();
        world.solver.iterations = 10;
        world.gravity.set(0, -10, 0); // m/s²
        this.physicsWorld = world;     
        
        // Set up debug visualization
        const cannonDebugRenderer = CannonDebugger(scene, world, {
            color: 0x00ff00, // optional
        });
        this.cannonDebugRenderer = cannonDebugRenderer;
        
        // physics barriers
        const bounds = new PhysicsBounds({ world, scene, layoutData });

        // player
        this.player = new Player({
            world: world,
            scene: scene
        });

        
        // workshop
        this.workshop = new WorkshopController({ scene , world })

        const followCam = new FollowCamera({
            target: this.workshop.mesh,
            // target: this.player.sphereMesh,
            renderer,
            scene,
            zoom: 20,
            lerpFactor: 0.1,
            offset: new Vector3(0, 25, 25), // 20 units above the player
        });

        this.camera = followCam.getCamera();
        this.followCam = followCam;

        setTimeout( ()=>{ this.followCam.setNewTarget( this.player.sphereMesh ) } , 2000 );

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
                sensorType: "tree"
            });            
            this.trees.push( tz );
        });

        // lumbermill zonenew 
        const lumberMillZone = new LumberMillZone({
            world,
            scene,
            position: new Vec3(-5, 0.5, 5),
            radius: 1.5,
            playerBody: this.player.sphereBody,
            sensorType: "lumbermill"
        });
        this.lumberMillZone = lumberMillZone;

        this.sensorsController = new SensorsController({ 
            uiController : this.uiController,
            applicationModel : this.applicationModel,
            trees : this.trees,
            lumbermill : lumberMillZone
        })

        this.sensorsController.addEventListener( "sensor_event" , this.boundOnSensorEvent );

        // Handle window resize or rotation
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            followCam.camera.aspect = width / height;
            followCam.camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        });
    }

    destroyLevelAfterStep = false;
    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        this.player.setInput(this.joystickInput.x, this.joystickInput.y, this.joystickInput.rotation);
        this.player.update(dt);

        this.trees.forEach(element => {
            element.update();            
        });

        this.lumberMillZone.update();

        this.followCam.update();
        if( this.physicsWorld ) this.physicsWorld.step( this.fixedTimeStep, dt, this.maxSubSteps);
        // Update debug visualization
        //this.cannonDebugRenderer.update();
        this.renderer.render( this.scene, this.camera );
    }

    onSensorEvent( e )
    {
        // tree or lumbermill
        const sensorType = e.sensorType;
        const enter = e.enter;
        if( sensorType == "tree")
        {
            if( enter ) this.player.startChopping();
            else this.player.stopChopping();
        }
    }

    onModelEvent( e )
    {
        console.log("on model event ", e  );
        switch( e.detail )
        {
            case "unlock_axe":
                console.log("unlock axe");
                break;

            case "unlock_workshop":
                this.workshop.unlock();
                this.followCam.setNewTarget( this.workshop.mesh );
                break;
        }
    }
}

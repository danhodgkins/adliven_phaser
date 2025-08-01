import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, EventDispatcher, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import { MistlandLumberjackUIController } from "./ui_controller";
import { World, Body, Box, Vec3, Plane, Material } from 'cannon-es'
import { Player } from "./player";
import { PhysicsBounds } from "./physics_bounds";
import { FollowCamera } from "./follow_cam";
import TreeZone from "./tree_zone";
import LumberMillZone from "./lumbermill_zone";
import nipplejs from 'nipplejs';
import SensorsController from "./sensors_controller";
import { ApplicationModel } from "./application_model";

export class MistlandLumberjackApplication extends BaseScene{
    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);
        
        this.boundOnSensorEvent = this.onSensorEvent.bind( this );
        this.boundOnModelEvent = this.onModelEvent.bind( this );

        this.applicationModel = new ApplicationModel();
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
    }
}

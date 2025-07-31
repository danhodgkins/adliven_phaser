import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import CANNON from 'cannon';
import { MistlandLumberjackUIController } from "./ui_controller";
import { degToRad } from "three/src/math/MathUtils.js";

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

        this.physicsWorld = world;
    }

    destroyLevelAfterStep = false;
    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        this.renderer.render( this.scene, this.camera );
        if( this.physicsWorld ) this.physicsWorld.step( this.fixedTimeStep, dt, this.maxSubSteps);
    }
}
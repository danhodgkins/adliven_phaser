import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Scene, SRGBColorSpace } from "three/src/Three.Core.js";
import BaseScene from "./basescene";
import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import { degToRad } from "./si_main_scene";
import CANNON from 'cannon';

export default class PhysicsScene extends BaseScene{
    constructor({config}){
        super({config});
        this.config = config;
    }

    init(){
        const scene = new Scene();
        this.scene = scene;

        const aspect = window.innerWidth / window.innerHeight;
        const frustumHeight = 10;
        const frustumWidth = frustumHeight * aspect;

        const camera = new OrthographicCamera(
            -frustumWidth / 2, frustumWidth / 2,
            frustumHeight / 2, -frustumHeight / 2,
            0.1, 1000 
        );
        // const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputEncoding = SRGBColorSpace;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );

        this.renderer = renderer;
        this.camera = camera;

        this.camera.position.x = 5;
        this.camera.position.y = 3;
        this.camera.position.z = 5;

        // this.camera.zoom = 2; // higher = closer
        this.camera.updateProjectionMatrix();

        //init plane
        const material = new MeshBasicMaterial({ color: 0x00ff00 , side: DoubleSide});
        const geometry = new PlaneGeometry(10,10);
        const plane = new Mesh(geometry, material);
        plane.rotateX(degToRad(270))
        scene.add(plane);

        // init cube
        const cubegeometry = new BoxGeometry( 1, 1, 1 );
        const cubematerial = new MeshBasicMaterial( { color: 0x0000ff } );
        const cube = new Mesh( cubegeometry, cubematerial );
        scene.add( cube );

        this.cube = cube;

        camera.lookAt(plane.position);

        // Setup our world
        var world = new CANNON.World();
        world.gravity.set(0, -1, 0); // m/s²

        // Create a sphere
        var radius = 1; // m
        var sphereBody = new CANNON.Body({
            mass: 5, // kg
            position: new CANNON.Vec3(0, 1, 0), // m
            shape: new CANNON.Sphere(radius)
        });
        world.addBody(sphereBody);

        var fixedTimeStep = 1.0 / 60.0; // seconds
        var maxSubSteps = 3;

        const mesh = this.cube;

        // Start the simulation loop
        var lastTime;
        (function simloop(time){
        requestAnimationFrame(simloop);
        if(lastTime !== undefined){
            var dt = (time - lastTime) / 1000;
            world.step(fixedTimeStep, dt, maxSubSteps);
        }

        mesh.position.x = sphereBody.position.x;
        mesh.position.y = sphereBody.position.y;
        mesh.position.z = sphereBody.position.z;
        // mesh.quaternion.x = sphereBody.quaternion.x;
        // mesh.quaternion.y = sphereBody.quaternion.y;
        // mesh.quaternion.z = sphereBody.quaternion.z;
        // mesh.quaternion.w = sphereBody.quaternion.w;

        // console.log("Sphere z position: " + sphereBody.position.z);
        lastTime = time;
        })();


    }

    update() {
        this.renderer.render( this.scene, this.camera );
    }
}
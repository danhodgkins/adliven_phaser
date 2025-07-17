import { BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Scene, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import BaseScene from "./basescene";
import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
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

        // Setup our world
        var world = new CANNON.World();
        world.gravity.set(0, -10, 0); // m/s²

        //init plane
        const material = new MeshBasicMaterial({ color: 0x00ff00 , side: DoubleSide});
        const geometry = new PlaneGeometry(10,10);
        const plane = new Mesh(geometry, material);
        plane.rotateX(-Math.PI / 2)
        // plane.rotateX(degToRad(270))
        scene.add(plane);

        // const planeGeometry = new THREE.PlaneGeometry(25, 25)
        // const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial)
        // planeMesh.rotateX(-Math.PI / 2)
        // planeMesh.receiveShadow = true
        // scene.add(planeMesh)
        
        const planeShape = new CANNON.Plane()
        const planeBody = new CANNON.Body({ mass: 0 })
        planeBody.addShape(planeShape)
        planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
        world.addBody(planeBody)

        // init cube
        const cubegeometry = new BoxGeometry( 1, 1, 1 );
        const cubematerial = new MeshBasicMaterial( { color: 0x0000ff } );
        const cubeMesh = new Mesh( cubegeometry, cubematerial );
        scene.add( cubeMesh );
        cubeMesh.position.set(0, 14, 0);
        // cubeMesh.quaternion.set(1, 0, 0.5, 1);

        const axis = new Vector3(1, 0, 0); // X-axis
        const angle = Math.PI / 8; // 90 degrees in radians
        const quaternion = new Quaternion().setFromAxisAngle(axis, angle);
        cubeMesh.quaternion.multiplyQuaternions(quaternion, cubeMesh.quaternion);

        const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
        const cubeBody = new CANNON.Body({ 
            mass: 1, 
            quaternion: new CANNON.Quaternion(
                cubeMesh.quaternion.x, 
                cubeMesh.quaternion.y, 
                cubeMesh.quaternion.z, 
                cubeMesh.quaternion.w) 
            })
        cubeBody.addShape(cubeShape)

        console.log("cubeBody: " + cubeBody.quaternion);

        
        cubeBody.position.x = cubeMesh.position.x
        cubeBody.position.y = cubeMesh.position.y
        cubeBody.position.z = cubeMesh.position.z
        

        // cubeBody.quaternion.x = cubeMesh.position.z
        // cubeBody.quaternion.y = cubeMesh.position.z
        // cubeBody.quaternion.z = cubeMesh.position.z
        world.addBody(cubeBody)


        this.cube = cubeMesh;

        camera.lookAt(plane.position);



        // Create a sphere
        // var radius = 1; // m
        // var sphereBody = new CANNON.Body({
        //     mass: 5, // kg
        //     position: new CANNON.Vec3(0, 5, 0), // m
        //     shape: new CANNON.Sphere(radius)
        // });
        // world.addBody(sphereBody);


        var fixedTimeStep = 1.0 / 60.0; // seconds
        var maxSubSteps = 3;

        const mesh = this.cube;

        // Start the simulation loop
        var lastTime;

        const clock = new Clock()
        let delta;

        (function simloop(time){
        requestAnimationFrame(simloop);
        if(lastTime !== undefined){
            var dt = (time - lastTime) / 1000;
            world.step(fixedTimeStep, dt, maxSubSteps);
        }

        // delta = Math.min(clock.getDelta(), 0.1)
        // world.step(delta)

        

        cubeMesh.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z)
        cubeMesh.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w)

        // mesh.position.x = cubeBody.position.x;
        // mesh.position.y = cubeBody.position.y;
        // mesh.position.z = cubeBody.position.z;
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
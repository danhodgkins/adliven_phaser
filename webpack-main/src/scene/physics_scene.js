import { AmbientLight, BoxGeometry, Clock, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3 } from "three/src/Three.Core.js";
import BaseScene from "./basescene";
import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import CANNON from 'cannon';
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { Bunny01ThumbGLB } from '../../media/Bunny_01_thumb.glb.js';
import { time } from "three/tsl";
import { degToRad } from "./si_main_scene.js";

export default class PhysicsScene extends BaseScene{
    constructor({config}){
        super({config});
        this.config = config;
    }

    init(){
        const scene = new Scene();
        this.scene = scene;

        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);

        

        const aspect = window.innerWidth / window.innerHeight;
        const frustumHeight = 10;
        const frustumWidth = frustumHeight * aspect;

        // const camera = new OrthographicCamera(
        //     -frustumWidth / 2, frustumWidth / 2,
        //     frustumHeight / 2, -frustumHeight / 2,
        //     0.1, 1000 
        // );
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


        // load zombunny
        const loader = new GLTFLoader();
        loader.load(
            Bunny01ThumbGLB, 
            (e) => {                 
                scene.add(e.scene); 
                const sphereShape = new CANNON.Sphere(1)
                const sphereBody = new CANNON.Body({ 
                    position: new CANNON.Vec3(0,1.5, 0),
                    mass:0
                })
                sphereBody.addShape(sphereShape)
                world.addBody(sphereBody)
            }, 
            undefined, 
            (e) => { console.error("error loading model", e); }
        );
        
        // orbit controls
        const controls = new OrbitControls( camera, renderer.domElement );
        controls.target.set( 0, 2, 0 );
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.1;
        this.orbitControls = controls;
        controls.update();

        this.world = world;
        this.ballsToUpdate = [];

        let i=tuneableGameParams.numBoxesBoxes;
        let id = setInterval(() => {
            this.initCube();
            i--;
            if(i <= 0) clearInterval(id);
        }, tuneableGameParams.boxSpawnInterval );

        

        // input
        this.initInput();
        this.raycaster = new Raycaster();
        this.mouseCoords = new Vector3();
        let dateNow;

        var fixedTimeStep = 1.0 / 60.0; // seconds
        var maxSubSteps = 3;

        // Start the simulation loop
        var lastTime;

        this.simLoop = (time) => {
            requestAnimationFrame(this.simLoop);    
            if(lastTime !== undefined){
                var dt = (time - lastTime) / 1000;
                world.step(fixedTimeStep, dt, maxSubSteps);
            }

            //cubeMesh.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z)
            //cubeMesh.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w)


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
                
                dateNow = Date.now();
                if( element.birthTime && dateNow - element.birthTime > 5000 ){
                    this.scene.remove(element.mesh);
                    this.world.removeBody(element.body);
                    this.ballsToUpdate.splice(this.ballsToUpdate.indexOf(element), 1);
                }
            });


            lastTime = time;
        };
        requestAnimationFrame(this.simLoop);
    }

    update() {
        this.renderer.render( this.scene, this.camera );
        this.orbitControls.update();
    }

    initCube() {
     // init cube
        const cubegeometry = new BoxGeometry( 1, 1, 1 );
        const cubematerial = new MeshBasicMaterial( { color: tuneableGameParams.boxColour } );
        const cubeMesh = new Mesh( cubegeometry, cubematerial );
        this.scene.add( cubeMesh );
        cubeMesh.position.set(0, 10, 0);
        // cubeMesh.quaternion.set(1, 0, 0.5, 1);

        const axis = new Vector3(1, 1, 0); // X-axis
        const angle = Math.PI / 3; // 90 degrees in radians
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
        
        cubeBody.position.x = cubeMesh.position.x
        cubeBody.position.y = cubeMesh.position.y
        cubeBody.position.z = cubeMesh.position.z
        this.world.addBody(cubeBody)

        this.ballsToUpdate.push({
                mesh: cubeMesh,
                body: cubeBody
            });
    }

    initInput() {
        window.addEventListener( 'pointerdown', ( event )=> {

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

            // const pos = new Vector3();
            // pos.copy( raycaster.ray.direction );
            // pos.add( raycaster.ray.origin );
            // pos.copy( raycaster.ray.direction );
            // // pos.multiplyScalar( 24 );

            // Position at ray origin (camera near plane)
            const origin = raycaster.ray.origin.clone();
            mesh.position.copy(origin);

            const sphereShape = new CANNON.Sphere(0.8)
            const sphereBody = new CANNON.Body({ 
                // position: new CANNON.Vec3(pos.x,pos.y,pos.z),
                mass:tuneableGameParams.bulletMass
            })
            sphereBody.addShape(sphereShape)
            sphereBody.position.set(origin.x, origin.y, origin.z); // correctly set Cannon body position
            this.world.addBody(sphereBody)

            // sphereBody.position.x = mesh.position.x = raycaster.ray.origin.x;
            // sphereBody.position.y = mesh.position.y = raycaster.ray.origin.x;
            // sphereBody.position.z = mesh.position.z = raycaster.ray.origin.x;

            const direction = raycaster.ray.direction.clone().normalize();

            // sphereBody.applyImpulse(
            //     new CANNON.Vec3(direction.x,direction.y,direction.z),
            //     new CANNON.Vec3(0, 0, 0)
            // );

            // Apply impulse in ray direction
            const impulse = new CANNON.Vec3(direction.x, direction.y, direction.z).scale(50);
            sphereBody.applyImpulse(impulse, sphereBody.position);

            this.ballsToUpdate.push({
                mesh: mesh,
                body: sphereBody,
                birthTime: Date.now()
            });
        } );
    }
}
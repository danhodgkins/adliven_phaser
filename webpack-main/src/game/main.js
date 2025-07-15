
const config = {
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
   
};

const StartGame = (parent) => {

    return new Application({ parent });
    // return new Game({ ...config, parent });

}

export default StartGame;

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AmbientLight, BoxGeometry, Color, DirectionalLight, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { Bunny02EyePopGLB } from '../../media/Bunny_02_eyePop.glb.js';
import { Bunny03ZombieGLB } from '../../media/Bunny_03_zombie.glb.js';
// import { unwrapMP3 } from '../../media/unwrap.mp3.js';
// import {Howl, Howler} from 'howler';

// import Ammo from '../ammo/ammo.js';
import CANNON from 'cannon';
import SceneManager from '../scene/scenemanager.js';
import SceneSunshineIslandMain from '../scene/si_main_scene.js';
import SceneThreeEditor from '../scene/three_editor_scene.js';
import { logoPNG } from '../../media/logo.png.js';

export class Application {
    constructor({ parent }) {

        // logo 
        const img = document.createElement('img');

        // 2. Set the source (can be a URL or base64)
        img.src = logoPNG;
        img.alt = 'Example Image';
        //img.width = 300;
        // img.classList.add('headerRowItem');

        // 3. Add it to a DOM element (e.g., <div id="container">)
        const container = document.getElementById('logoCont');
        container.appendChild(img);

        
        this.sceneManager = new SceneManager([
            // new SceneThreeEditor({config: {id: 'main', parent: parent}})
            new SceneSunshineIslandMain({config: {id: 'main', parent: parent}})
        ]); 

        this.boundUpdate = this.update.bind(this);
        requestAnimationFrame(this.boundUpdate );

        this.sceneManager.setScene( 'main' )
    }

    update() {
        this.sceneManager.update();
        requestAnimationFrame(this.boundUpdate);
    }
}


// export class Game {
//     constructor({config, parent}) {

//         const scene = new Scene();
//         this.scene = scene;

//         const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

//         const renderer = new WebGLRenderer();
//         renderer.setSize( window.innerWidth, window.innerHeight );

//         const el = document.getElementById( parent );
//         el.appendChild( renderer.domElement );

        
//         const controls = new OrbitControls( camera, renderer.domElement );
//         const loader = new GLTFLoader();
//         loader.load(
//             Bunny03ZombieGLB, 
//             (e) => { console.log("loaded", e); scene.add(e.scene); }, 
//             undefined, 
//             (e) => { console.error("error loading model", e); }
//         );

//         console.log("new game", controls, loader);

//         const geometry = new BoxGeometry( 1, 1, 1 );
//         const material = new MeshBasicMaterial( { color: 0x00ff00 } );
//         const cube = new Mesh( geometry, material );
//         scene.add( cube );
//         this.cube = cube;

//         const color = 0xFFFFFF;
//         const intensity = 5;
//         const light = new AmbientLight(color, intensity);
//         scene.add(light);

//         camera.position.z = 5;

//         this.renderer = renderer;
//         this.camera = camera;
//         this.boundUpdate = this.update.bind(this);
//         renderer.setAnimationLoop( this.boundUpdate );

//         // const testSfx = new Howl({
//         //     src: [ unwrapMP3 ],
//         //     onload : ()=>{
//         //         console.log("testSfx loaded", testSfx);
//         //         //testSfx.play();
//         //     }
//         // });

//         // document.addEventListener('click', () => {

//         //     testSfx.play();
//         //     console.log("play sfx", testSfx);
//         // });

//         // Setup our world
//         var world = new CANNON.World();
//         world.gravity.set(0, -1, 0); // m/s²
//         // world.gravity.set(0, 0, -9.82); // m/s²

//         // Create a sphere
//         var radius = 1; // m
//         var sphereBody = new CANNON.Body({
//         mass: 5, // kg
//         position: new CANNON.Vec3(0, 0, 0), // m
//         shape: new CANNON.Sphere(radius)
//         });
//         world.addBody(sphereBody);

//         var fixedTimeStep = 1.0 / 60.0; // seconds
//         var maxSubSteps = 3;

//         const mesh = this.cube

//         // Start the simulation loop
//         var lastTime;
//         (function simloop(time){
//         requestAnimationFrame(simloop);
//         if(lastTime !== undefined){
//             var dt = (time - lastTime) / 1000;
//             world.step(fixedTimeStep, dt, maxSubSteps);
//         }

//         mesh.position.x = sphereBody.position.x;
//         mesh.position.y = sphereBody.position.y;
//         mesh.position.z = sphereBody.position.z;
//         // mesh.quaternion.x = sphereBody.quaternion.x;
//         // mesh.quaternion.y = sphereBody.quaternion.y;
//         // mesh.quaternion.z = sphereBody.quaternion.z;
//         // mesh.quaternion.w = sphereBody.quaternion.w;

//         // console.log("Sphere z position: " + sphereBody.position.z);
//         lastTime = time;
//         })();

//     }

//     update() {
//         this.cube.rotation.x += 0.01;
//         this.cube.rotation.y += 0.01;
//         this.renderer.render( this.scene, this.camera );
//     }


//     destroy() {
       
//     }
// }
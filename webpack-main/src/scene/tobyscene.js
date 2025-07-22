import BaseScene from "./basescene";
import { coffeePlantsGLB } from '../../media/coffee-plants.glb.js';
import { islandGbWEBP } from '../../media/island_gb.webp.js';
import {Scene ,DirectionalLight, AmbientLight, OrthographicCamera, WebGLRenderer, SRGBColorSpace, PlaneGeometry, MeshBasicMaterial, Mesh, BoxGeometry, AnimationMixer, LoopRepeat, TextureLoader, DoubleSide} from "three";
import { Bunny01ThumbGLB } from "../../media/Bunny_01_thumb.glb.js";
import { chickenCoopGLB } from '../../media/chicken-coop.glb.js';
import { char2GLB } from '../../media/char2.glb.js';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
export default class TobyScene extends BaseScene{

    height = 100;
    mixer = null;

    constructor({config}){
        super({config});
        this.config = config;
        console.log("height " , this.height );
    }

    GenerateLevel(){
        
    }

    init(){
        this.setupThreeJS();
        this.createBackground();
        this.loadCharacter();
        this.loadEnvironment();
    }

    setupThreeJS(){
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
        //move camera to a position
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputColorSpace = SRGBColorSpace;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );
        
        this.renderer = renderer;
        this.camera = camera;
        
        //create lights
        const directionalLight = new DirectionalLight(0xffffff, 3);
        directionalLight.position.set(0, 10, 10);
        scene.add(directionalLight);
        
        const ambientLight = new AmbientLight(0x404040, 0.5); // soft white light
        scene.add(ambientLight);
        
        // Optional: add the green cube for debugging
        // const geometry = new BoxGeometry( 1, 1, 1 );
        // const material = new MeshBasicMaterial( { color: 0x00ff00 } );
        // const cube = new Mesh( geometry, material );
        // scene.add(cube);
    }

    createBackground(){
        const loader = new TextureLoader();
        
        // Convert base64 data URL to a blob URL for TextureLoader
        const base64String = islandGbWEBP.split(',')[1];
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/webp' });
        const blobUrl = URL.createObjectURL(blob);
        
        loader.load(blobUrl, (texture) => {
            // Create a large background plane
            const backgroundGeometry = new PlaneGeometry(50, 30); // Large enough to fill screen
            const backgroundMaterial = new MeshBasicMaterial({ 
                map: texture,
                transparent: false
            });
            const backgroundPlane = new Mesh(backgroundGeometry, backgroundMaterial);
            
            // Position it far behind and copy camera rotation
            backgroundPlane.position.copy(this.camera.position);
            backgroundPlane.position.z -= 30; // Move it back from camera
            backgroundPlane.position.x -=20
            backgroundPlane.position.y -= 20;
            backgroundPlane.rotation.copy(this.camera.rotation);
            
            this.scene.add(backgroundPlane);
            
            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);
        });
    }

    loadCharacter(){
        const loader = new GLTFLoader();
        
        loader.load(
            char2GLB, 
            (e) => { 
                console.log("loaded", e); 
                this.scene.add(e.scene); 
                
                this.mixer = new AnimationMixer(e.scene);
                const idleAction = this.mixer.clipAction(e.animations.find(a => a.name.toLowerCase().includes('idle')));
                const walkAction = this.mixer.clipAction(e.animations.find(a => a.name.toLowerCase().includes('walk')));
                
                if (walkAction) {
                    walkAction.setLoop(LoopRepeat);
                    walkAction.play();
                }
            }, 
            undefined, 
            (e) => { console.error("error loading model", e); }
        );
    }

    loadEnvironment(){
        const environmentAssets = [
            {
                model: coffeePlantsGLB,
                name: "coffee plants",
                position: [-3, 0, 0],
                scale: [0.5, 0.5, 0.5]
            },
            {
                model: chickenCoopGLB,
                name: "chicken coop",
                position: [3, 0, -2],
                scale: [1, 1, 1]
            }
        ];

        environmentAssets.forEach(asset => {
            this.loadEnvironmentAsset(asset);
        });
    }

    loadEnvironmentAsset({model, name, position, scale}){
        const loader = new GLTFLoader();
        
        loader.load(
            model,
            (e) => {
                console.log(`loaded ${name}`, e);
                e.scene.position.set(...position);
                e.scene.scale.set(...scale);
                this.scene.add(e.scene);
            },
            undefined,
            (e) => { console.error(`error loading ${name}`, e); }
        );
    }

    update(){
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(0.016); // Assuming 60fps, so 1/60 ≈ 0.016
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

//     document.addEventListener('touchstart', (e) => {
//   if (e.touches.length === 1) {
    
//     isDragging = true;
//     lastTouch.x = e.touches[0].clientX;
//     lastTouch.y = e.touches[0].clientY;
//   }
// });

// document.addEventListener('touchmove', (e) => {
//   if (isDragging && e.touches.length === 1) {
//     const touch = e.touches[0];
//     const delta = getNormalizedDelta(touch - lastTouch);
//     tryMoveCube(delta);
//     //lastTouch.x = touch.clientX;
//     //lastTouch.y = touch.clientY;
//   }
// });

// document.addEventListener('touchend', () => {
//   isDragging = false;
// });

// let isMouseDragging = false;
// let lastMouse = { x: 0, y: 0 };

// function getNormalizedMouseDelta(event) {
//   return {
//     x: (event.clientX - lastMouse.x) / window.innerWidth * 10,
//     z: (event.clientY - lastMouse.y) / window.innerHeight * 10
//   };
// }

// document.addEventListener('mousedown', (e) => {
//   isMouseDragging = true;
//   lastMouse.x = e.clientX;
//   lastMouse.y = e.clientY;
// });

// document.addEventListener('mousemove', (e) => {
//   if (isMouseDragging) {
//     const delta = getNormalizedMouseDelta(e);
//     tryMoveCube(delta);
//     lastMouse.x = e.clientX;
//     lastMouse.y = e.clientY;
//   }
// });

// document.addEventListener('mouseup', () => {
//   isMouseDragging = false;
// });

    
}
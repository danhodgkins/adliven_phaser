import BaseScene from "./basescene";
import { coffeePlantsGLB } from '../../media/coffee-plants.glb.js';
import {Scene ,DirectionalLight, OrthographicCamera, WebGLRenderer, SRGBColorSpace, PlaneGeometry, MeshBasicMaterial, Mesh, BoxGeometry} from "three";
import { Bunny01ThumbGLB } from "../../media/Bunny_01_thumb.glb.js";
import { chickenCoopGLB } from '../../media/chicken-coop.glb.js';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
export default class TobyScene extends BaseScene{

    height = 100;

    constructor({config}){
        super({config});
        this.config = config;
        console.log("height " , this.height );
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

        //move camera to a position
        camera.position.set(0, 3, 10);
        camera.lookAt(0, 0, 0);
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputColorSpace = SRGBColorSpace;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );
        this.renderer = renderer;
        this.camera = camera;
        const loader = new GLTFLoader();
        //load coffee plants GLB
       loader.load(
                   chickenCoopGLB, 
                   (e) => { 
                       console.log("loaded", e); 
                       scene.add(e.scene); 
                   }, 
                   undefined, 
                   (e) => { console.error("error loading model", e); }
               );
        
        //create light
        const light = new DirectionalLight(0xffffff, 1);
        light.position.set(0, 10, 10);
        scene.add(light);
        const geometry = new BoxGeometry( 1, 1, 1 );
        const material = new MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new Mesh( geometry, material );
        //scene.add(cube);
    }

    update(){
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}
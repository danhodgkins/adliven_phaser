import { AmbientLight, BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, ObjectLoader, PerspectiveCamera, PlaneGeometry, Scene, TextureLoader, WebGLRenderer } from "three";
import BaseScene from "./basescene.js";
import { islandGbWEBP } from '../../media/island_gb.webp.js';
import data from "../../editor_exports/app.json"

export default class SceneThreeEditor extends BaseScene {
    constructor({config}) {
        super({config});
        this.config = config;
        console.log("SceneThreeEditor");
        
    }

    init(){
        
        // Assume your JSON is in a variable called `data`
        const loader = new ObjectLoader();

        // Load the main scene
        const scene = loader.parse(data.scene);

        // Optional: Load the camera
        const camera = loader.parse(data.camera);
        //const cameraData = loader.parse(data.camera);
        //console.log("cameraData ", cameraData);
        //const camera = new PerspectiveCamera( 50, 1.704668838219327, 0.01, 1000 );

        console.log("scene ", scene);

        

        const renderer = new WebGLRenderer();
        renderer.setSize( 1024, 1024 );
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );

        // Maintain the original camera aspect
        const targetAspect = camera.aspect;

        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        function resizeRendererToCameraAspect() {
            const windowAspect = window.innerWidth / window.innerHeight;

            let width, height;

            if (windowAspect > targetAspect) {
                // Too wide – limit by height
                height = window.innerHeight;
                width = height * targetAspect;
            } else {
                // Too tall – limit by width
                width = window.innerWidth;
                height = width / targetAspect;
            }

            renderer.setSize(width, height);
            renderer.domElement.style.left = `${(window.innerWidth - width) / 2}px`;
            renderer.domElement.style.top = `${(window.innerHeight - height) / 2}px`;
        }

        window.addEventListener('resize', resizeRendererToCameraAspect);
        resizeRendererToCameraAspect();

    }

    update() {
        this.renderer.render( this.scene, this.camera );
    }
}
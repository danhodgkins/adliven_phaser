import { AmbientLight, BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, TextureLoader, WebGLRenderer } from "three";
import BaseScene from "./basescene";
import { islandGbWEBP } from '../../media/island_gb.webp.js';

export default class SceneSunshineIslandMain extends BaseScene {
    constructor({config}) {
        super({config});
        this.config = config;
        console.log("SceneSunshineIslandMain");
        
    }

    init() {

        console.log("init");
        const scene = new Scene();
        this.scene = scene;
        const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );

        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);
        
        camera.position.y = 1;
        camera.position.z = 30;

        // camera.rotation.x = -10;
        camera.rotation.x = -26.5;
        
        this.renderer = renderer;
        this.camera = camera;
        
        const geometry = new BoxGeometry( 1, 1, 1 );
        const material = new MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new Mesh( geometry, material );
        scene.add( cube );
        this.cube = cube;

        const textureLoader = new TextureLoader();
        textureLoader.load(islandGbWEBP, (texture) => {
            // 4. Create material using the texture
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });

            // 5. Create plane and apply material
            const geometry = new PlaneGeometry(25,25);
            const plane = new Mesh(geometry, material);
            scene.add(plane);

            camera.lookAt(plane.position);
        });

    }

    update() {
        this.renderer.render( this.scene, this.camera );
    }
}
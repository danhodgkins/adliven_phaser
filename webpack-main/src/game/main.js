
const config = {
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
   
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BoxGeometry, Color, DirectionalLight, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';


export class Game {
    constructor({config, parent}) {

        const scene = new Scene();
        this.scene = scene;

        const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        const el = document.getElementById( parent );
        el.appendChild( renderer.domElement );

        
        const controls = new OrbitControls( camera, renderer.domElement );
        const loader = new GLTFLoader();

        console.log("new game", controls, loader);

        const geometry = new BoxGeometry( 1, 1, 1 );
        const material = new MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new Mesh( geometry, material );
        scene.add( cube );
        this.cube = cube;

        camera.position.z = 5;

        this.renderer = renderer;
        this.camera = camera;
        this.boundUpdate = this.update.bind(this);
        renderer.setAnimationLoop( this.boundUpdate );
    }

    update() {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
        this.renderer.render( this.scene, this.camera );
    }


    destroy() {
       
    }
}
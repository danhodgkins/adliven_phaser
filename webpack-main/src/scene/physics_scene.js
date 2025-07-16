import { DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Scene, SRGBColorSpace } from "three/src/Three.Core.js";
import BaseScene from "./basescene";
import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";

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

        //init plane
        const material = new MeshBasicMaterial({ color: 0x00ff00 , side: DoubleSide});
        const geometry = new PlaneGeometry(10,10);
        const plane = new Mesh(geometry, material);
        scene.add(plane);

        camera.lookAt(plane.position);
    }

    update() {
        this.renderer.render( this.scene, this.camera );
        // this.cube.rotation.x += 0.01;
        //this.cube.rotation.y += 0.01;
        //if( this.tween ) this.tween.update();
    }
}
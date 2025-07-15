import { AmbientLight, BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, ObjectLoader, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, TextureLoader, WebGLRenderer } from "three";
import BaseScene from "./basescene";
import { islandGbWEBP } from '../../media/island_gb.webp.js';
import { meiCamilleSadPNG } from '../../media/mei_camille_sad.png.js';
import { logoPNG } from '../../media/logo.png.js';

export default class SceneSunshineIslandMain extends BaseScene {

    STATE_INTRO = "STATE_INTRO";
    STATE_REVEAL_MAZE = "STATE_REVEAL_MAZE";
    STATE_GAMEPLAY = "STATE_GAMEPLAY";
    STATE_SUCCESS = "STATE_SUCCESS";
    STATE_FAIL = "STATE_SUCCESS";
    currentState = null;

    constructor({config}) {
        super({config});
        this.config = config;
        
    }

    setState( newState )
    {
        let el = document.getElementById( "ui-overlay" );
        switch( newState )
        {
            case this.STATE_INTRO:
                this.camera.position.x = 3;
                this.camera.position.y = 1;
                this.camera.position.z = 3;

                this.camera.zoom = 5; // higher = closer
                this.camera.updateProjectionMatrix();

                el.innerHTML = this.getUIString( newState );

                break;

            case this.STATE_REVEAL_MAZE:
                this.camera.zoom = 3; // higher = closer
                this.camera.updateProjectionMatrix();

                el.innerHTML = this.getUIString( newState );

                break;

            case this.STATE_GAMEPLAY:
                el.innerHTML = this.getUIString( newState );
                break;

            case this.STATE_SUCCESS:
                el.innerHTML = this.getUIString( newState );
                break;

            case this.STATE_FAIL:
                el.innerHTML = this.getUIString( newState );
                break;
        }

        this.currentState = newState;
    }


    init() {

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
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );

        el.addEventListener( "pointerup" , (e)=>{
            let nextState;
            switch( this.currentState )
            {
                case this.STATE_INTRO:
                nextState = this.STATE_REVEAL_MAZE;
                break;

                case this.STATE_REVEAL_MAZE:
                nextState = this.STATE_GAMEPLAY;
                break;

                case this.STATE_GAMEPLAY:
                nextState = this.STATE_SUCCESS;
                break;

                case this.STATE_SUCCESS:
                nextState = this.STATE_INTRO;
                break;
            }

            this.setState(nextState);
        })

        const color = 0xFFFFFF;
        const intensity = 5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);
        
        // camera.position.x = -7;
        // camera.position.y = 1;
        // camera.position.z = 3;
        
        this.renderer = renderer;
        this.camera = camera;
        
        const geometry = new BoxGeometry( 1, 1, 1 );
        const material = new MeshBasicMaterial( { color: 0x00ff00 } );
        const cube = new Mesh( geometry, material );
        cube.position.y = -10;
        scene.add( cube );
        this.cube = cube;

        const textureLoader = new TextureLoader();
        textureLoader.load(islandGbWEBP, (texture) => {
            // 4. Create material using the texture
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });

            // 5. Create plane and apply material
            const geometry = new PlaneGeometry(5,5);
            const plane = new Mesh(geometry, material);
            plane.rotateX(degToRad(270))
            scene.add(plane);

            camera.lookAt(plane.position);
        });

        textureLoader.load( meiCamilleSadPNG , (texture) => {
            // 4. Create material using the texture
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });

            // 5. Create plane and apply material
            const geometry = new PlaneGeometry(0.5,0.5);
            const mei_camille_sad = new Mesh(geometry, material);
            // plane.rotateX(degToRad(270))
            scene.add(mei_camille_sad);

        });



        this.setState( this.STATE_INTRO );

    }

    update() {
        this.renderer.render( this.scene, this.camera );
        // this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
    }

    getUIString( stateRef )
    {
        let str;
        switch( stateRef )
        {
            case this.STATE_INTRO:            
                str = inGameUIString("HELP THEM SURVIVE!")
                break;

            case this.STATE_REVEAL_MAZE:
                str = inGameUIString("DO THE MAZE!")
                break;

            case this.STATE_GAMEPLAY:
                str = inGameUIString("KEEP GOING!")
                break;

            case this.STATE_SUCCESS:
                str = successUIString();
                break;

            case this.STATE_FAIL:
                break;
        }

        return str;

    }

}

function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

function inGameUIString( stringToInject )
{
    return `
        <div id="headerRow">
        <div id="logoCont" class="headerRowItem">
        <img src = ${ logoPNG } />
        </div>
        <div class="spacer"></div>
        <button id="ctaButton">PLAY NOW</button>
        </div>
        <div class="spacer"></div>
        <div id="gameOutput"><h1>${stringToInject}</h1></div>
    `;
}

function successUIString()
{
    return `
        <img src = ${ logoPNG } />        
        <h1>YOU SAVED THEM!</h1>
        <button id="ctaButton">PLAY NOW</button>
       
    `;
}

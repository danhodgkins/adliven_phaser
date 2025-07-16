import { AmbientLight, BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, ObjectLoader, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, TextureLoader, WebGLRenderer } from "three";
import BaseScene from "./basescene";
import { islandGbWEBP } from '../../media/island_gb.webp.js';
import { meiCamilleSadPNG } from '../../media/mei_camille_sad.png.js';
import { logoPNG } from '../../media/logo.png.js';
import {Easing, Tween} from '@tweenjs/tween.js'
import { Application, Assets, Container, Sprite } from 'pixi.js';

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

    // update the UI as per current state, and reposition camera to reflect zoom states for game play
    setState( newState )
    {
        let el = document.getElementById( "ui-overlay" );
        switch( newState )
        {
            case this.STATE_INTRO:
                this.camera.position.x = 5;
                this.camera.position.y = 3;
                this.camera.position.z = 5;

                this.camera.zoom = 8; // higher = closer
                this.camera.updateProjectionMatrix();
                break;

            case this.STATE_REVEAL_MAZE:
                const tween = new Tween(this.camera);
                tween.to({zoom: 2}, 2000)
                tween.onUpdate(function (object) {
                    // this needs setting each frame or the zoom tween will not render
                    object.updateProjectionMatrix();
                })
                tween.onComplete( ()=>{ this.tween = null; });
                tween.easing( Easing.Sinusoidal.InOut)
                tween.start();
                this.tween = tween;
                break;

            case this.STATE_GAMEPLAY:
                break;

            case this.STATE_SUCCESS:
                break;

            case this.STATE_FAIL:
                break;
        }

        this.currentState = newState;
        el.innerHTML = this.getUIString();
    }

    async initPixi(){
        // Create a new application
        const app = new Application();

        let el = document.getElementById( "pixi-container" );
        // Initialize the application
        
        let overflowPreventHackMultiplier = 0.996;
        await app.init({ backgroundAlpha:0, width:window.innerWidth *overflowPreventHackMultiplier, height:window.innerHeight *overflowPreventHackMultiplier});

        // Append the application canvas to the document body
        el.appendChild(app.canvas);

        // Create and add a container to the stage
        const container = new Container();

        app.stage.addChild(container);

        // Load the bunny texture
        const texture = await Assets.load('https://pixijs.com/assets/bunny.png');

        // Create a 5x5 grid of bunnies in the container
        for (let i = 0; i < 25; i++) {
            const bunny = new Sprite(texture);

            bunny.x = (i % 5) * 40;
            bunny.y = Math.floor(i / 5) * 40;
            container.addChild(bunny);
        }

        // Move the container to the center
        container.x = app.screen.width / 2;
        container.y = app.screen.height / 2;

        // Center the bunny sprites in local container coordinates
        container.pivot.x = container.width / 2;
        container.pivot.y = container.height / 2;

        // Listen for animate update
        app.ticker.add((time) => {
            // Continuously rotate the container!
            // * use delta to create frame-independent transform *
            container.rotation -= 0.01 * time.deltaTime;
        });
    }

    // initialise the three scene, set INTRO state
    init() {

        this.initPixi();

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
            // to stop textures looking washed out
            texture.colorSpace = SRGBColorSpace;
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
            const geometry = new PlaneGeometry(10,10);
            const plane = new Mesh(geometry, material);
            plane.rotateX(degToRad(270))
            scene.add(plane);
            camera.lookAt(plane.position);
        });

        textureLoader.load( meiCamilleSadPNG , (texture) => {
            // to stop textures looking washed out
            texture.colorSpace = SRGBColorSpace;
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
            const geometry = new PlaneGeometry(0.5,0.5);
            const mei_camille_sad = new Mesh(geometry, material);
            mei_camille_sad.position.y = 0.2;
            scene.add(mei_camille_sad);

            const target = this.camera.position.clone();
            target.y = mei_camille_sad.position.y; // keep vertical alignment
            mei_camille_sad.lookAt(target);
        });

        this.setState( this.STATE_INTRO );
    }

    update() {
        this.renderer.render( this.scene, this.camera );
        // this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
        if( this.tween ) this.tween.update();
    }

    getUIString()
    {
        let stateRef = this.currentState;
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

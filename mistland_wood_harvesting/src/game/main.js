const StartGame = (parent) => {
    return new GameApplication({ parent });
}

export default StartGame;

import SceneManager from '../scene/scenemanager.js';
import { MistlandLumberjackApplication } from '../mistland_lumberjack/application.js';

import '@pixi/layout';
import { Application, Container, Graphics } from 'pixi.js';
// import '@pixi/layout/devtools';
// import { LayoutSystem } from '@pixi/layout';

export class GameApplication {
    constructor({ parent }) {

        // Create a new pixi application
        const app = new Application();
        let el = document.getElementById( "pixi-container" );
        // Initialize the application
        
        let overflowPreventHackMultiplier = 1;
        app.init({ 
            backgroundAlpha:0.0, 
            width:window.innerWidth *overflowPreventHackMultiplier, 
            height:window.innerHeight *overflowPreventHackMultiplier,
            resizeTo: el 
            // layout: {
            //     autoUpdate: true,
            //     // enableDebug: true,
            //     // throttle: 100,
            // },
        }).then( (e)=>{

            // can later be accessed via app.renderer.layout
            // const layoutSystem = app.renderer.layout;
            //app.renderer.addSystem(LayoutSystem, 'layout'); // ✅ Important!
            // app.renderer.layout.enableDebug(true);

            /////////////////PIXI JS SHIZ

            // Append the application canvas to the document body
            el.appendChild(app.canvas);    
            // app.stage.layout = {
                
            //     width: app.screen.width,
            //     height: app.screen.height,
            //     flexDirection: 'column',
            //     justifyContent: 'flex-start',
            //     // alignItems: 'center',
            // };    

            // window.addEventListener('keydown', (e) => {
            //     if (e.key === 'd') {
            //         addRecursiveLayoutDebug(app.stage); // or root container
            //     }
            // });

            // // Create and add a container to the stage
            // const container = new Container({
            //     layout: {
            //         width: '100%',
            //         height: '20%',
            //         justifyContent: 'flex-start',
            //         alignContent: 'flex-start',
            //     },
            // });    
            // app.stage.addChild(container);

            /////////////////END PIXI JS SHIZ


            this.sceneManager = new SceneManager([
                new MistlandLumberjackApplication({
                    config: {
                        id: 'main', 
                        parent: parent,
                        pixiApp : app
                    }
                })
            ]); 
    
            this.boundUpdate = this.update.bind(this);
            requestAnimationFrame(this.boundUpdate );
    
            this.sceneManager.setScene( 'main' )
        })

        
    }


    lastTime;
    
    update()  {
        const time = Date.now();
        let dt = 0;
        if( this.lastTime !== undefined){
            dt = (time - this.lastTime) / 1000;
        }

        this.sceneManager.update( dt);
        this.lastTime = time;
        requestAnimationFrame(this.boundUpdate);
    }
}

function addLayoutDebug(container, color = 0xff00ff) {
    const bounds = container.getBounds();


    const debugBox = new Graphics()
        .stroke({ width: 1, color: color, alpha: 1 })
        .rect(0, 0, bounds.width, bounds.height);

        // Must call this to *finalize* drawing in v8!
    debugBox.closePath();

    debugBox.x = bounds.x;
    debugBox.y = bounds.y;

    // Optional: make sure it's drawn above other elements
    debugBox.zIndex = 9999;

    // Add the debug box to the same parent as the container
    if (container.parent) {
        container.parent.addChild(debugBox);
    }
}

function addRecursiveLayoutDebug(container, color = 0xff00ff) {
    addLayoutDebug(container, color);
    for (const child of container.children) {
        if (child.layout) {
            addRecursiveLayoutDebug(child, color);
        }
    }
}


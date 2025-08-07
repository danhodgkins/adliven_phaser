const StartGame = (parent) => {
    return new GameApplication({ parent });
}

export default StartGame;

import SceneManager from '../scene/scenemanager.js';
import { MistlandLumberjackApplication } from '../mistland_lumberjack/application.js';
import { Application, Container, Graphics } from 'pixi.js';
import CTAScene from '../cta/cta_scene.js';

export class GameApplication {
    constructor({ parent }) {

        let el = document.getElementById( "pixi-container" );
        
        // Create a new pixi application
        const app = new Application({ background: '#1099bb', resizeTo: el,backgroundAlpha:0.0,  });
        el.appendChild(app.view);   

        this.sceneManager = new SceneManager([
            new MistlandLumberjackApplication({
                config: {
                    id: 'main', 
                    parent: parent,
                    pixiApp : app
                }
            }),
            new CTAScene({
                config: {
                    id: 'cta', 
                    parent: parent
                }
            })
        ], parent ); 

        this.boundUpdate = this.update.bind(this);
        requestAnimationFrame(this.boundUpdate );

        this.sceneManager.setScene( 'main' );        
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
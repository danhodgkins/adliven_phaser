const StartGame = (parent) => {
    return new Application({ parent });
}

export default StartGame;

import SceneManager from '../scene/scenemanager.js';
import { MistlandLumberjackApplication } from '../mistland_lumberjack/application.js';

export class Application {
    constructor({ parent }) {
        
        this.sceneManager = new SceneManager([
            new MistlandLumberjackApplication({config: {id: 'main', parent: parent}})
        ]); 

        this.boundUpdate = this.update.bind(this);
        requestAnimationFrame(this.boundUpdate );

        this.sceneManager.setScene( 'main' )
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

import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { title_gameplay } from '../../media/pngs_title_gameplay.png.js';

import '@pixi/layout';
import ProgressBarGems from './ui/progressbar_gems.js';

export class MistlandLumberjackUIController {

    constructor({ pixiApp, uiLayerElement, applicationModel}) {
        this.uiLayerElement = uiLayerElement;
        this.applicationModel = applicationModel;
        this.pixiApp = pixiApp;

        //this.uiLayerElement.innerHTML = this.splashUIString()
        this.updateUI();

        this.initPixiContainer();
        
    }

    update( dt )
    {
        if( this.progressBar ) this.progressBar.update( dt );
    }

    updateUI() {
        // Update UI elements based on application model state
        const logCountOutput = this.uiLayerElement.querySelector("#logCountOutput");
        if (logCountOutput) {
            logCountOutput.textContent = `Logs: ${this.applicationModel.logCount}`;
        }
                
        const gemCountOutput = this.uiLayerElement.querySelector("#gemCountOutput");
        if (logCountOutput) {
            gemCountOutput.textContent = `Gems: ${this.applicationModel.gemCount}`;
        }
    }

    async initPixiContainer()
    {
         // Create and add a container to the stage
        const headerContainer = new Container({
        });    

        this.pixiApp.stage.addChild(headerContainer);
        this.headerContainer = headerContainer;

        /// PIXI does not seem to play well with Base64d webps
        // both the below attempts failed with asset being a base64d webp
        // const bunnyImage = new Image();
        // bunnyImage.src = logoPNG;

        // // Create a bunny Sprite
        // const texture = Texture.from(bunnyImage);
        // const bunny = new Sprite(texture);
        // headerContainer.addChild(bunny);

        // logo 
        // const texture = await Assets.load(title_gameplay);
        // const sprite = new Sprite({ texture });       
        // headerContainer.addChild(sprite);

        const progressBar = new ProgressBarGems({ 
            pixiApp : this.pixiApp, 
            applicationModel : this.applicationModel
        })

        headerContainer.addChild(progressBar.progressBarContainer);
        this.progressBar = progressBar;
    }

    onResize()
    {
        this.pixiApp.resize();
        this.progressBar.onResize();
    }
    // splashUIString() {
    //     return `
    //         <div id="gameOutput">Welcome to Mistland Lumberjack!</div>
    //     `;
    // }
}
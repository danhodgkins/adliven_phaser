import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import { bar } from '../../../media/pngs_bar.png.js';
import { bar_fill } from '../../../media/pngs_bar_fill.png.js';
import { bar_sparkles } from '../../../media/pngs_bar_sparkles.png.js';
import { icon_gem } from '../../../media/pngs_icon_gem.png.js';

export default class ProgressBarGems{


    constructor( { pixiApp, applicationModel })
    {
        this.pixiApp = pixiApp;
        this.applicationModel = applicationModel;

        this.max = getParamsNumberByID("gemsNeeded");
        this.currentGems = 0;
        this.targetFillRatio = 0;
        this.currentFillRatio = 0;
        this.progressBarContainer = new Container({     

        });

        console.log("pixiApp.stage.width ", pixiApp.stage.width, window.innerWidth);
        
        this.initSprites();
    }

    async initSprites()
    {
        const barBGTexture = await Assets.load(bar);
        const barBGSprite = new Sprite({ texture : barBGTexture });
        this.progressBarContainer.addChild(barBGSprite);

        this.fillBarSpacer = 3;
        const barFillTexture = await Assets.load(bar_fill);
        const barFillSprite = new Sprite({ 
            x : this.fillBarSpacer,
            y : this.fillBarSpacer,
            texture : barFillTexture,
            anchor: {
                x: 1,  // Right-aligned
                y: 0   // Top-aligned
            }
        });

        this.barFillSprite = barFillSprite;
        this.progressBarContainer.addChild(barFillSprite);

        // mask 
        const mask = new Graphics();
        mask.roundRect(
            this.fillBarSpacer, 
            this.fillBarSpacer, 
            barBGTexture.width, 
            barBGTexture.height - this.fillBarSpacer , 
            20); // 10 = corner radius

        mask.fill(0x00ff00);
        this.progressBarContainer.addChild(mask);
        this.barFillSprite.mask = mask;

        // gem decoration
        const gemTexture = await Assets.load(icon_gem);
        const gemSprite = new Sprite({ 
            x : -30,
            y : -10, 
            texture : gemTexture,
            scale : {
                x:0.5,
                y:0.5
            }

        });
        this.progressBarContainer.addChild(gemSprite);
        this.onResize();
    }

    onResize()
    {
        const scale = isPortrait() ? { x : 0.5, y : 0.5} :  { x : 1, y : 1};
        this.progressBarContainer.scale.set( scale.x , scale.y );
        this.progressBarContainer.position.set(  window.innerWidth -  this.progressBarContainer.width  , 10 );
    }

    update(dt) {

        //const targetGemCount = this.applicationModel.gemCount;
        
        if (this.currentGems !== this.applicationModel.gemCount) {
            this.currentGems = this.applicationModel.gemCount;
            this.targetFillRatio = Math.min(this.currentGems / this.max, 1);
            console.log("updaete pb ", this.targetFillRatio )
        }

        // Smoothly interpolate fill ratio (lerp)
        const lerpSpeed = 5; // Higher is faster
        this.currentFillRatio += (this.targetFillRatio - this.currentFillRatio) * lerpSpeed * dt;

        if (this.barFillSprite && this.progressBarContainer) {
            const fullWidth = this.barFillSprite.width;

            // Because anchor.x = 1, x = 0 means the right edge is at the left of the container.
            // So we want to shift the sprite's x to the right as fill increases.
            this.barFillSprite.x = this.fillBarSpacer + fullWidth * this.currentFillRatio;
        }

        // if (this.barFillSprite && this.progressBarContainer) {
        //     const containerWidth = this.progressBarContainer.width;
        //     const fillWidth = containerWidth * this.currentFillRatio;

        //     // Compute how much of the fill should be visible
        //     const visibleWidth = containerWidth * this.currentFillRatio;

        //     // Since anchor.x = 1 (right-aligned), adjust x to shift left as progress decreases
        //     this.barFillSprite.x = containerWidth - visibleWidth;
        // }
    }

    // update( dt )
    // {
    //     if( this.currentGems != this.applicationModel.gemCount )
    //     {
    //         this.currentGems = this.applicationModel.gemCount;
    //         // animate this.barFillTextureSprite to reflect progress as a proportion of the  this.progressBarContainer width               
    //     }
    // }


}
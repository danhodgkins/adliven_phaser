import { Assets, Container, Graphics, Loader, Sprite } from 'pixi.js';
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
        this.progressBarContainer = new Container({ });        
        this.initSprites();
    }

    async initSprites()
    {
        const barBGTexture = await Assets.load(bar);
        const barBGSprite = Sprite.from(barBGTexture);

        this.progressBarContainer.addChild(barBGSprite);
        
        this.fillBarSpacer = 3;
        const barFillTexture = await Assets.load(bar_fill);
        const barFillSprite = Sprite.from(barFillTexture);
        barFillSprite.x = this.fillBarSpacer;
        barFillSprite.y = this.fillBarSpacer;
        barFillSprite.anchor = {
                x: 1,  // Right-aligned
                y: 0   // Top-aligned
            };
            
        
        this.barFillSprite = barFillSprite;
        this.progressBarContainer.addChild(barFillSprite);

        // Create a new Graphics object for the mask
        const graphics = new Graphics();
        // Set fill color (optional: add line style)
        graphics.beginFill(0xff9900); // orange
        // Draw rounded rectangle (x, y, width, height, radius)
        graphics.drawRoundedRect( this.fillBarSpacer, this.fillBarSpacer, barBGTexture.width, barBGTexture.height - this.fillBarSpacer, 20);
        // End fill
        graphics.endFill();

        // gem decoration
        const gemTexture = await Assets.load(icon_gem);
        const gemSprite = Sprite.from(gemTexture);
        gemSprite.x = -30;
        gemSprite.y = -10;
        gemSprite.scale = {
                x:0.5,
                y:0.5
            }
        
        this.progressBarContainer.addChild(graphics);
        this.barFillSprite.mask = graphics;

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

        if (this.currentGems !== this.applicationModel.gemCount) {
            this.currentGems = this.applicationModel.gemCount;
            this.targetFillRatio = Math.min(this.currentGems / this.max, 1);
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
    }
}
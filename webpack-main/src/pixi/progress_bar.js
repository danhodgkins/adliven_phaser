import { Application, Color, Graphics } from "pixi.js";

export class PixiProgressBar{
    constructor( { parentEl })
    {
        this.parentEl = parentEl;
        this.init();
    }

    async init(){
        // Create a new application
        const app = new Application();

        // Initialize the application
        await app.init({ 
            antialias: true, 
            width: 150, 
            height: 20,
            backgroundAlpha: 0,
            // backgroundColor: 0xffffff,
        });                   // Canvas height });

        // Append the application canvas to the document body
        this.parentEl.appendChild(app.canvas);

        const graphics = new Graphics();
        graphics.rect(0, 0, 150, 20);
        graphics.fill(0x000000);

        app.stage.addChild(graphics);

        const bar = new Graphics();
        bar.rect(0, 0, 140, 10);
        bar.position.set(5, 5);
        bar.fill(0x00ff00);
        app.stage.addChild(bar);
        this.bar = bar;
    }

    updateBar( progress )
    {
        const color = getProgressColor(progress);
        if( this.bar )
        {
            const bar = this.bar;
            bar.clear();
            bar.rect(0, 0, 140 * progress, 10).fill(color);
        }
    }
}

function getProgressColor(progress) {
  const r = Math.round(255 * progress);     // red increases
  const g = Math.round(255 * (1 - progress)); // green decreases
  return (r << 16) + (g << 8);
}
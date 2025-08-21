import BaseScene from "../scene/basescene";
import { play_splash } from '../../media/img_play_splash.webp.js';
import { splash } from '../../media/img_splash.webp.js';
import { title_splash } from '../../media/img_title_splash.webp.js';


import { icon_gem } from '../../media/pngs_icon_gem.png.js';

// import { warrior_atlas } from '../../media/spine_warrior_atlas.atlas.js';
//import { warrior_png } from '../../media/spine_warrior_png.png.js';
// import { warrio_jsonr } from '../../media/spine_warrio_jsonr.json.js';

import { warrior_png } from '../../media/spine_warrior_png.png.js';
import { warrior_png_atlas } from '../../media/spine_warrior_png_atlas.atlas.js';
import { warrior_png_json } from '../../media/spine_warrior_png_json.json.js';
import { archer } from '../../media/spine_archer.png.js';
import { archer_atlas } from '../../media/spine_archer_atlas.atlas.js';
import { archer_json } from '../../media/spine_archer_json.json.js';
import { bird } from '../../media/spine_bird.png.js';
import { bird_atlas } from '../../media/spine_bird_atlas.atlas.js';
import { bird_json } from '../../media/spine_bird_json.json.js';
import { bush1 } from '../../media/spine_bush1.png.js';
import { bush1_atlas } from '../../media/spine_bush1_atlas.atlas.js';
import { bush1_json } from '../../media/spine_bush1_json.json.js';
import { bush2 } from '../../media/spine_bush2.png.js';
import { bush2_atlas } from '../../media/spine_bush2_atlas.atlas.js';
import { bush2_json } from '../../media/spine_bush2_json.json.js';
import { dragon } from '../../media/spine_dragon.png.js';
import { dragon_atlas } from '../../media/spine_dragon_atlas.atlas.js';
import { dragon_json } from '../../media/spine_dragon_json.json.js';
import { wizard } from '../../media/spine_wizard.png.js';
import { wizard_atlas } from '../../media/spine_wizard_atlas.atlas.js';
import { wizard_json } from '../../media/spine_wizard_json.json.js';

import 'pixi-spine'; // Register the loader
import { TextureAtlas } from "@pixi-spine/base";
import { Spine, SkeletonJson, AtlasAttachmentLoader } from "@pixi-spine/runtime-4.1";
import { Assets } from 'pixi.js';

export default class CTAScene extends BaseScene{
    constructor( {  config  })
    {
        super({ config });
        this.pixiApp = config.pixiApp;
    }

    portraitInited = false;
    landscapeInited = false;

    clearSpineAnimations() {
        if (this.spineAnimations) {
            this.spineAnimations.forEach(animation => {
                if (animation.parent) {
                    animation.parent.removeChild(animation);
                }
                animation.destroy();
            });
            this.spineAnimations = [];
        }
    }

    async initSpine(spinejson, spineatlas, spinegraphic, posFactorX, posFactorY, scaleFactorX = 1, scaleFactorY = 1, zIndex = 0){
        
        // Decode base64 → text
        const jsonText  = atob(spinejson.split(",")[1]);
        const atlasText = atob(spineatlas.split(",")[1]);

        // Parse JSON
        const spineData = JSON.parse(jsonText);

        // Load texture from base64
        const texture = await Assets.load(spinegraphic);

        // Create atlas + parser
        const atlas = new TextureAtlas(atlasText, (line, callback) => {
            callback(texture.baseTexture);
        });

        const atlasLoader = new AtlasAttachmentLoader(atlas);
        const skeletonJson = new SkeletonJson(atlasLoader);

        const skeletonData = skeletonJson.readSkeletonData(spineData);

        // Create Spine object
        const spineAnimation = new Spine(skeletonData);
        
        // Calculate proportional scale based on screen size
        // Use a base reference resolution (e.g., 1920x1080 for landscape, 720x1280 for portrait)
        const baseWidth = isPortrait() ? 720 : 1920;
        const baseHeight = isPortrait() ? 1280 : 1080;
        
        const scaleX = (this.pixiApp.renderer.width / baseWidth) * scaleFactorX;
        const scaleY = (this.pixiApp.renderer.height / baseHeight) * scaleFactorY;
        
        // Use the smaller scale to maintain aspect ratio
        const uniformScale = Math.min(scaleX, scaleY);
        
        spineAnimation.scale.set(uniformScale);
        
        // Calculate responsive positioning that adapts to screen size
        // Position as a factor of screen dimensions, accounting for orientation and aspect ratio
        const screenWidth = this.pixiApp.renderer.width;
        const screenHeight = this.pixiApp.renderer.height;
        
        // Calculate position factors that work consistently across different screen sizes
        spineAnimation.x = screenWidth * posFactorX;
        spineAnimation.y = screenHeight * posFactorY;
        
        // Set z-index for depth ordering (higher values appear on top)
        spineAnimation.zIndex = zIndex;
        
        spineAnimation.state.setAnimation(0, "idle", true);

        // Store in array to handle multiple spine animations
        if (!this.spineAnimations) {
            this.spineAnimations = [];
        }
        this.spineAnimations.push(spineAnimation);
        this.pixiApp.stage.addChild(spineAnimation);
        
        // Enable sorting by zIndex (this needs to be called after adding children)
        this.pixiApp.stage.sortableChildren = true;
    }

    initPortrait()
    {
        // Clear existing spine animations before creating new ones
        this.clearSpineAnimations();
        
        // Create spine animations with portrait-specific position and scale factors
        // Position factors: 0.0 = left/top edge, 1.0 = right/bottom edge, 0.5 = center
        // Z-index: lower values = background, higher values = foreground
        
        // Background elements (z-index: 0-10)
        this.initSpine(bush1_json, bush1_atlas, bush1, 0.1, 1, 0.3, 0.3, 100); // Bush 1 - far background
        this.initSpine(bush2_json, bush2_atlas, bush2, .9, 1, 0.3, 0.3, 100); // Bush 2 - far background
        
        // Flying creatures (z-index: 20-30)
        this.initSpine(dragon_json, dragon_atlas, dragon, 0.8, 0.45, 0.5, 0.5, 20); // Dragon - mid background
        this.initSpine(bird_json, bird_atlas, bird, 0.2, 0.45, 0.5, 0.5, 25); // Bird - mid background
        
        // Ground characters (z-index: 40-50)
        this.initSpine(wizard_json, wizard_atlas, wizard, 0.25, 0.67, 0.5, 0.5, 40); // Wizard - foreground
        this.initSpine(warrior_png_json, warrior_png_atlas, warrior_png, 0.5, 0.65, 0.5, 0.5, 45); // Warrior - foreground
        this.initSpine(archer_json, archer_atlas, archer, 0.75, 0.65, 0.5, 0.5, 40); // Archer - front
        //this.initSpine(warrior_png_json, warrior_png_atlas, warrior_png, 2, 1.5, 0.8, 0.8);

        
        //return;

        const ctaOverlayLandscape = document.getElementById("ui-overlay-cta-landscape");
        ctaOverlayLandscape.style.display = 'none';

        const ctaOverlay = document.getElementById("ui-overlay-cta-portrait");
        ctaOverlay.style.display = 'flex';

        if( this.portraitInited ) return;

        const container = ctaOverlay.querySelector("#cta-bg-container-portrait");
        const img = new Image()
        img.src = splash; 

        // Style the image
        img.style.position = 'absolute';
        img.style.height = '100%';
        img.style.width = 'auto';
        img.style.transform = 'translateX(-50%) scale(1)';
        img.style.left = '50%';
        img.style.top = '0';   
        //this.img = img;   

        // Add image to container
        container.appendChild(img);

        // Create the button element
        const button = document.createElement('button');

        // Set styles for background image
        button.style.width = '150px';
        button.style.height = '60px';
        button.style.backgroundImage = `url("${play_splash}")`;
        button.style.backgroundSize = 'cover';
        button.style.backgroundPosition = 'center';
        button.style.border = 'none';
        button.style.backgroundColor = 'transparent';

        // Add click handler
        button.addEventListener('click', () => {
        alert('Button clicked!');
        });

        const ctaButtonContainer = ctaOverlay.querySelector("#cta-button-container-portrait");
        ctaButtonContainer.appendChild(button);

        // cta logo 
        const logoContainer = ctaOverlay.querySelector("#cta-logo-container-portrait");
        const logo = new Image()
        logo.src = title_splash;    
        // logo.style.width = '50%';
        // logo.style.height = '50%';
        logoContainer.appendChild(logo);

         this.portraitInited = true;
    }

    initLandscape()
    {
        // Clear existing spine animations before creating new ones
        this.clearSpineAnimations();
        
        // Create spine animations with landscape-specific position and scale factors
        // Position factors: 0.0 = left/top edge, 1.0 = right/bottom edge, 0.5 = center
        // Z-index: lower values = background, higher values = foreground
        
        // Background elements (z-index: 0-10)
        this.initSpine(bush1_json, bush1_atlas, bush1, 0.1, 1, 0.3, 0.3, 100); // Bush 1 - far background
        this.initSpine(bush2_json, bush2_atlas, bush2, .9, 1, 0.3, 0.3, 100); // Bush 2 - far background
        
        // Flying creatures (z-index: 20-30)
        this.initSpine(dragon_json, dragon_atlas, dragon, 0.4, 0.45, 0.5, 0.5, 20); // Dragon - mid background
        this.initSpine(bird_json, bird_atlas, bird, 0.15, 0.45, 0.5, 0.5, 25); // Bird - mid background
        
        // Ground characters (z-index: 40-50)
        this.initSpine(wizard_json, wizard_atlas, wizard, 0.2, 0.67, 0.5, 0.5, 40); // Wizard - foreground
        this.initSpine(warrior_png_json, warrior_png_atlas, warrior_png, 0.3, 0.65, 0.5, 0.5, 45); // Warrior - foreground
        this.initSpine(archer_json, archer_atlas, archer, 0.4, 0.67, 0.5, 0.5, 40); // Archer - front
        //return;
        const ctaOverlayPortrait = document.getElementById("ui-overlay-cta-portrait");
        ctaOverlayPortrait.style.display = 'none';

        const ctaOverlay = document.getElementById("ui-overlay-cta-landscape");
        ctaOverlay.style.display = 'flex';

        if( this.landscapeInited ) return;

        const container = ctaOverlay.querySelector("#cta-bg-container-landscape");
        const img = new Image()
        img.src = splash; 

        const containerHeight = container.clientHeight;
        const config = {
            landscapeZoom: 1.7,      // Zoom level in landscape
            landscapeOffsetX: "-10%",   // X offset in landscape (in pixels)
            landscapeOffsetY: "-30%"   // X offset in landscape (in pixels)
        };
        img.style.height = `${containerHeight * config.landscapeZoom}px`;
        img.style.width = 'auto';
        img.style.left = '0';
        img.style.top = '0';
        img.style.transform = `
        translateX(${config.landscapeOffsetX})
        translateY(${config.landscapeOffsetY})
        scale(${config.landscapeZoom})
        `;

        // Add image to container
        container.appendChild(img);

        // cta logo 
        const logoContainer = ctaOverlay.querySelector("#cta-logo-container-landscape");
        const logo = new Image()
        logo.src = title_splash;    
        // logo.style.width = '50%';
        // logo.style.height = '50%';
        logoContainer.appendChild(logo);

        // Create the button element
        const button = document.createElement('button');

        // Set styles for background image
        button.style.width = '150px';
        button.style.height = '60px';
        button.style.backgroundImage = `url("${play_splash}")`;
        button.style.backgroundSize = 'cover';
        button.style.backgroundPosition = 'center';
        button.style.border = 'none';
        button.style.backgroundColor = 'transparent';

        // Add click handler
        button.addEventListener('click', () => {
        alert('Button clicked!');
        });

        const ctaButtonContainer = ctaOverlay.querySelector("#cta-button-container-landscape");
        ctaButtonContainer.appendChild(button);

        this.landscapeInited = true;
    }

    onResize()
    {
        console.log("on resize " , isPortrait())
        if( isPortrait() )
        {
            this.initPortrait();
        } else {
            this.initLandscape();
        }
    }

    init()
    {
        // hide game ui overlay
        const uiOverlay = document.getElementById("ui-overlay");
        uiOverlay.style.display = 'none'; // Hides the element and removes it from the layout

        const pixiOverlay = document.getElementById("pixi-container");
        //pixiOverlay.style.display = 'none'; // Hides the element and removes it from the layout

        this.boundOnResize = this.onResize.bind( this );
        window.addEventListener('resize', this.boundOnResize );
        this.boundOnResize();
   }

   destroy() {
        // Clean up spine animations
        this.clearSpineAnimations();
        
        // Remove resize event listener
        if (this.boundOnResize) {
            window.removeEventListener('resize', this.boundOnResize);
        }
        
        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
   }
}
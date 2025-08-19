import BaseScene from "../scene/basescene";
import { play_splash } from '../../media/img_play_splash.webp.js';
import { splash } from '../../media/img_splash.webp.js';
import { title_splash } from '../../media/img_title_splash.webp.js';


import { icon_gem } from '../../media/pngs_icon_gem.png.js';

import { warrior_atlas } from '../../media/spine_warrior_atlas.atlas.js';
import { warrior_png } from '../../media/spine_warrior_png.png.js';
import { warrio_jsonr } from '../../media/spine_warrio_jsonr.json.js';

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

    async initSpine(){
    // Avoid creating multiple Spine instances (resize can call this repeatedly)
    if (this.spineAnimation) return;
        
        // Decode base64 → text
        const jsonText  = atob(warrio_jsonr.split(",")[1]);
        const atlasText = atob(warrior_atlas.split(",")[1]);

        // Parse JSON
        const spineData = JSON.parse(jsonText);

        // Load texture from base64
        const texture = await Assets.load(warrior_png);

        // Create atlas + parser
        const atlas = new TextureAtlas(atlasText, (line, callback) => {
            callback(texture.baseTexture);
        });

        const atlasLoader = new AtlasAttachmentLoader(atlas);
        const skeletonJson = new SkeletonJson(atlasLoader);

        const skeletonData = skeletonJson.readSkeletonData(spineData);

        // Create Spine object
        const spineAnimation = new Spine(skeletonData);
        spineAnimation.x = this.pixiApp.renderer.width / 2;
        spineAnimation.y = this.pixiApp.renderer.height / 1.25;
        spineAnimation.state.setAnimation(0, "idle", true);

    // keep a reference so we don't re-create on resize (avoids ghosting)
        this.spineAnimation = spineAnimation;
        this.pixiApp.stage.addChild(this.spineAnimation);
    }

    initPortrait()
    {
        this.initSpine();
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
        this.initSpine();
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
}
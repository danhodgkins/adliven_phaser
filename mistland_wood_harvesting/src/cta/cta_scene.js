import BaseScene from "../scene/basescene";
import { play_splash } from '../../media/img_play_splash.webp.js';
import { splash } from '../../media/img_splash.webp.js';
import { title_splash } from '../../media/img_title_splash.webp.js';

export default class CTAScene extends BaseScene{
    constructor( {  config })
    {
        super({config});
    }

    portraitInited = false;
    landscapeInited = false;

    initPortrait()
    {
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
        pixiOverlay.style.display = 'none'; // Hides the element and removes it from the layout

        this.boundOnResize = this.onResize.bind( this );
        window.addEventListener('resize', this.boundOnResize );
        this.boundOnResize();
   }
}
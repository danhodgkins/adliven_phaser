import BaseScene from "../scene/basescene";
import { play_splash } from '../../media/img_play_splash.webp.js';
import { splash } from '../../media/img_splash.webp.js';
import { title_splash } from '../../media/img_title_splash.webp.js';

export default class CTAScene extends BaseScene{
    constructor( {  config })
    {
        super({config});
    }

    init()
    {
        // hide ui overlay
        const uiOverlay = document.getElementById("ui-overlay");
        uiOverlay.style.display = 'none'; // Hides the element and removes it from the layout

        const ctaOverlay = document.getElementById("ui-overlay-cta");
        ctaOverlay.style.display = 'flex'; // Hides the element and removes it from the layout

        const container = ctaOverlay.querySelector("#cta-bg-container");
        const img = new Image()
        img.src = splash;    
        this.img = img;   

        const config = {
            src: 'your-image.jpg',   // Image source
            landscapeZoom: 1.6,      // Zoom level in landscape
            landscapeOffsetX: "-10%",   // X offset in landscape (in pixels)
            landscapeOffsetY: "-25%"   // X offset in landscape (in pixels)
        };

        // Style the image
        img.style.position = 'absolute';

        // Add image to container
        container.appendChild(img);

        // Responsive layout handler
        function updateImageLayout() {
            const isPortrait = window.innerHeight > window.innerWidth;

            if (isPortrait) {
                // Portrait: fit to height, center horizontally
                img.style.height = '100%';
                img.style.width = 'auto';
                img.style.transform = 'translateX(-50%) scale(1)';
                img.style.left = '50%';
                img.style.top = '0';
            } else {
                // Landscape: zoom and offset to left
                const containerHeight = container.clientHeight;

                img.style.height = `${containerHeight * config.landscapeZoom}px`;
                img.style.width = 'auto';
                img.style.left = '0';
                img.style.top = '0';
                img.style.transform = `
                translateX(${config.landscapeOffsetX})
                translateY(${config.landscapeOffsetY})
                scale(${config.landscapeZoom})
                `;
            }
        }

        // Initial setup
        img.onload = updateImageLayout;
        window.addEventListener('resize', updateImageLayout);        

        /// cta button 
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

        const ctaButtonContainer = ctaOverlay.querySelector("#cta-button-container");
        ctaButtonContainer.appendChild(button);

        // cta logo 
        const logoContainer = ctaOverlay.querySelector("#cta-logo-container");
        const logo = new Image()
        logo.src = title_splash;    
        // logo.style.width = '50%';
        // logo.style.height = '50%';
        logoContainer.appendChild(logo);
    }
}
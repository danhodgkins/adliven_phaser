import * as Phaser from './phaser/phaser-3.87.0-full.js';
// import * as Phaser from './phaser/phaser-3.87.0-core.js';
// import * as Phaser from './phaser/phaser-3.80.1.js';
import * as SpinePlugin from './spine/SpinePlugin';

import { mraidAdNetworks, networkPlugin } from './networkPlugin.js';

// import { Game } from './scenes/Game';
import { Preloader } from './scenes/Preloader';
import { config } from './config.js';
import { enable3d } from '@enable3d/phaser-extension';
import { Game3D } from './rj/scenes/Game3D.js';

const gameConfig = {
    type: Phaser.AUTO,
    parent: 'ad-container',
    width: 411,
    height: 731,
    // transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
        height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
    },
    scene: [
        Preloader,
        Game3D
    ],
    plugins: {
        scene: [
            { 
                key: 'SpinePlugin', 
                plugin: window['SpinePlugin'], 
                mapping: 'spine' 
            }
        ]
    }
};

function initializePhaserGame() {
    return new Phaser.Game(gameConfig);
}

function setupGameInitialization(adNetworkType) {
    const game = initializePhaserGame();
    console.log("game ", game);

    if (mraidAdNetworks.has(adNetworkType)) {
        networkPlugin.initMraid(() => game);
    }
    else {
        // vungle, google ads, facebook, tiktok
        return game;
    }
}

// enable3d(() => setupGameInitialization(config.adNetworkType) ).withPhysics()
enable3d(() => { 
    console.log("wtf");
    const game = setupGameInitialization(config.adNetworkType);
    
    // game.scene.scenes.forEach((scene) => {
    //     console.log(`Scene key: ${scene.scene.key}`);
    // });
} ).withPhysics('./assets/ammo/kripken')


import * as Phaser from '../phaser/phaser-3.87.0-core.js';

import { adStart, onCtaPressed, onAudioVolumeChange } from '../networkPlugin';
export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init() {
        console.log('%cSCENE::Game', 'color: #fff; background: #f0f;')
    }

    /**
     * This is required specially for Mintegral & MRAID networks. 
     * Do not remove if you are using those networks.
     */
    adNetworkSetup() {
        adStart();

        // This is required for MRAID networks, you can remove if you are not using MRAID
        onAudioVolumeChange(this.scene);
    }

    create() {
        this.adNetworkSetup();

        //  This is all just tests to prove the assets have loaded properly.
        const midX = this.scale.width / 2;
        const midY = this.scale.height / 2;

        this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);

        const suka = this.add.image(midX, midY, 'suka');

        if (this.add.spine) {
            this.add.spine(midX, midY + 300, 'set1.spineboy', 'idle', true).setScale(0.5);
        }

        this.add.bitmapText(midX, midY - 200, 'font1', 'Phaser 3\nBase64\nExample', 64).setOrigin(0.5);

        this.tweens.add({
            targets: suka,
            y: '+=100',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.input.on('pointerdown', () => {

            this.sound.play('sound_fx');

            onCtaPressed();

        });
    }
}

import * as Phaser from '../phaser/phaser-3.87.0-core.js';

import { Base64Manager } from '../utils/Base64Manager.js';
import { LoadBase64Audio } from '../utils/LoadBase64Audio.js';
import { LoadBase64BitmapFont } from '../utils/LoadBase64BitmapFont.js';
import { adReady } from '../networkPlugin';
import { iceicebabyPNG } from '../../media/fonts_iceicebaby.png.js';
import { iceicebabyXML } from '../../media/fonts_iceicebaby.xml.js';
import { soundFxMP3 } from '../../media/audio_sound_fx.mp3.js';
import { spaceyJPG } from '../../media/images_spacey.jpg.js';
import { sukasukaPNG } from '../../media/images_sukasuka.png.js';

export class Preloader extends Phaser.Scene
{
    constructor () 
    {
        super('Preload');
    }

    init ()
    {
        console.log('%cSCENE::Preloader', 'color: #fff; background: #f00;')
    }

    preload ()
    {
        //  Invoke the Base64Manager - pass in the current scene reference and a callback to invoke when it's done
        Base64Manager(this, () => this.base64LoaderComplete());

        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Loading...', { fontFamily: 'Arial', fontSize: 64, color: '#ffffff' }).setOrigin(0.5);

        //  Images load normally as base64 encoded strings
        this.load.image('bg', spaceyJPG);
        this.load.image('suka', sukasukaPNG);

        LoadBase64Audio(this, [
            { key: 'sound_fx', data: soundFxMP3 }
        ]);

        LoadBase64BitmapFont(this, {
            key: 'font1',
            xml: iceicebabyXML,
            png: iceicebabyPNG
        });
    }

    create ()
    {
        //  This may run before the Loader has completed, so don't use in-flight assets here
    }

    base64LoaderComplete ()
    {
        adReady();

        this.scene.start('Game');
    }
}

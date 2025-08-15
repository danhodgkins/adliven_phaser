export default class AudioController{
    constructor({ loadedAudioByRef })
    {
        this.loadedAudioByRef = loadedAudioByRef;

        window.addEventListener('blur', this.muteHowler);
        window.addEventListener('focus', this.unmuteHowler);

        // Optional: also handle visibility changes for cases like tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.muteHowler();
            } else {
                this.unmuteHowler();
            }
        });

    }

    play( ref, loop = false, volume = 1 )
    {
        const audio = this.loadedAudioByRef[ ref ];
        audio.loop( loop );
        audio.volume( volume );
        audio.play();
    }

    muteHowler() {
        if (typeof Howler !== 'undefined') {
            Howler.mute(true);
        }
    }

    unmuteHowler() {
        if (typeof Howler !== 'undefined') {
            Howler.mute(false);
        }
    }
}
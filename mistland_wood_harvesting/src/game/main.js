import { mus_town_slow } from '../../media/audio_mus_town_slow.wav.js';
import { sfx_bandit_attack_04 } from '../../media/audio_sfx_bandit_attack_04.wav.js';
import { sfx_player_sword_swing_02 } from '../../media/audio_sfx_player_sword_swing_02.wav.js';
import { sfx_quest_win } from '../../media/audio_sfx_quest_win.wav.js';
import { sfx_reward_xp_fly_01 } from '../../media/audio_sfx_reward_xp_fly_01.wav.js';
import { sfx_skeleton_alert_01 } from '../../media/audio_sfx_skeleton_alert_01.wav.js';
import { sfx_skillcheck_success_01 } from '../../media/audio_sfx_skillcheck_success_01.wav.js';

const StartGame = (parent) => {
    return new GameApplication({ parent });
}

export default StartGame;

import SceneManager from '../scene/scenemanager.js';
import { MistlandLumberjackApplication } from '../mistland_lumberjack/application.js';
import { Application, Container, Graphics } from 'pixi.js';
import CTAScene from '../cta/cta_scene.js';

export class GameApplication {
    constructor() {

        // postAssetLoadInit will happen after audio is loaded
        this.loadAudio();
        this.boundUpdate = this.update.bind(this);
        requestAnimationFrame(this.boundUpdate );
    }

    postAssetLoadInit()
    {
        const parent = 'game-container';
        let el = document.getElementById( "pixi-container" );
        
        // Create a new pixi application
        const app = new Application({ 
            background: '#1099bb', 
            resizeTo: el,backgroundAlpha:0.0
        });
        el.appendChild(app.view);  

        this.sceneManager = new SceneManager([
            new MistlandLumberjackApplication({
                config: {
                    id: 'main', 
                    parent: parent,
                    pixiApp : app,
                    loadedAudioByRef : this.loadedAudioByRef
                }
            }),
            new CTAScene({
                config: {
                    id: 'cta', 
                    parent: parent,
                    loadedAudioByRef : this.loadedAudioByRef
                }
            })
        ], 
        parent,
        this.loadedAudioByRef ); 

        this.boundUpdate = this.update.bind(this);
        requestAnimationFrame(this.boundUpdate );

        this.sceneManager.setScene( 'main' );    

        this.boundOnPointerdown = this.onPointerdown.bind(this);
        document.addEventListener("pointerdown",this.boundOnPointerdown);
    }

    // one off handler for dutecting user gesture to start audio ( otherwise it will autoplay on pointer UP, not DOWN )
    onPointerdown()
    {
        console.log("onPointerdown" );
        document.removeEventListener("pointerdown",this.boundOnPointerdown);
        const music = this.loadedAudioByRef[ "mus_town_slow" ];
        music.play();
        this.music = music;
    }

    music;
    lastTime;
    allAudioLoaded = false;
    
    update()  {
        const time = Date.now();
        let dt = 0;
        if( this.lastTime !== undefined){
            dt = (time - this.lastTime) / 1000;
        }

        if( this.sceneManager ) this.sceneManager.update( dt);
        else if( this.allAudioLoaded )
        {
            this.postAssetLoadInit();
        }

        //console.log("", this.sceneManager, this.allAudioLoaded );
        this.lastTime = time;
        requestAnimationFrame(this.boundUpdate);
    }

    audioConfigs;
    loadedAudioCtr = 0;

    loadAudio(){
        this.loadedAudioByRef ={};

        this.audioConfigs = [
            { ref : "mus_town_slow" , src : [ mus_town_slow ] },
            { ref : "sfx_bandit_attack_04" , src : [ sfx_bandit_attack_04 ] },
            { ref : "sfx_player_sword_swing_02" , src : [ sfx_player_sword_swing_02 ] },
            { ref : "sfx_quest_win" , src : [ sfx_quest_win ] },
            { ref : "sfx_reward_xp_fly_01" , src : [ sfx_reward_xp_fly_01 ] },
            { ref : "sfx_skeleton_alert_01" , src : [ sfx_skeleton_alert_01 ] },
            { ref : "sfx_skillcheck_success_01" , src : [ sfx_skillcheck_success_01 ] },
        ];


        //const audio = this.manifest.audio;
        this.audioConfigs.forEach(element => {
            console.log("element ", element )
            this.loadedAudioByRef[ element.ref ] = new Howl({
                // src: [ this.baseURL + element.path],
                src: element.src,
                onload : ()=>{
                    this.onAudioLoaded();
                }
              });              
        }); 

    }

    loadedAudioCtr = 0;
    onAudioLoaded()
    {
        this.loadedAudioCtr++;
        if( this.loadedAudioCtr == this.audioConfigs.length )
        {
            this.allAudioLoaded = true;
        }
    }
}
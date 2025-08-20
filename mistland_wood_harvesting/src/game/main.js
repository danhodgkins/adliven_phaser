import { mus_town_slow } from '../../media/mp3_mus_town_slow.mp3.js';
import { sfx_bandit_attack_04 } from '../../media/mp3_sfx_bandit_attack_04.mp3.js';
import { sfx_player_sword_swing_02 } from '../../media/mp3_sfx_player_sword_swing_02.mp3.js';
import { sfx_quest_win } from '../../media/mp3_sfx_quest_win.mp3.js';
import { sfx_reward_xp_fly_01 } from '../../media/mp3_sfx_reward_xp_fly_01.mp3.js';
import { sfx_skeleton_alert_01 } from '../../media/mp3_sfx_skeleton_alert_01.mp3.js';
import { sfx_skillcheck_success_01 } from '../../media/mp3_sfx_skillcheck_success_01.mp3.js';

const StartGame = (parent) => {
    return new GameApplication({ parent });
}

export default StartGame;

import SceneManager from '../scene/scenemanager.js';
import { MistlandLumberjackApplication } from '../mistland_lumberjack/application.js';
import { Application, Container, Graphics } from 'pixi.js';
import CTAScene from '../cta/cta_scene.js';
import AudioController from '../mistland_lumberjack/audio_controller.js';

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
            background: '#000000', 
            resizeTo: el,backgroundAlpha:0.0
        });
        el.appendChild(app.view);  

        this.audioController = new AudioController({ loadedAudioByRef : this.loadedAudioByRef });

        this.sceneManager = new SceneManager([
            new MistlandLumberjackApplication({
                config: {
                    id: 'main', 
                    parent: parent,
                    pixiApp : app,
                    audioController : this.audioController
                }
            }),
            new CTAScene({
                config: {
                    id: 'cta', 
                    parent: parent,
                    audioController : this.audioController,
                    pixiApp : app
                }
            })
        ], 
        parent ); 

        // override the defalut behaviour ( hopefully allows sound to start on pointerdown rather than up. needs testing)
        HowlerGlobal.mobileAutoEnable = false;

        this.boundUpdate = this.update.bind(this);
        requestAnimationFrame(this.boundUpdate );

        this.sceneManager.setScene( 'main' );    
        //this.sceneManager.setScene( 'cta' );    

        this.boundOnPointerdown = this.onPointerdown.bind(this);
        document.addEventListener("pointerdown",this.boundOnPointerdown);
    }

    // one off handler for dutecting user gesture to start audio ( otherwise it will autoplay on pointer UP, not DOWN )
    onPointerdown()
    {
        document.removeEventListener("pointerdown",this.boundOnPointerdown);

        if( !params.playMusic.value ) return;
        this.audioController.play("mus_town_slow", true , getParamsNumberByID("musicVolume") * 0.01);
    }

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
        
    music;
    audioConfigs;
    loadedAudioCtr = 0;

    loadAudio(){
        this.loadedAudioByRef ={};

        this.audioConfigs = [
            { ref : "mus_town_slow" , src : [ mus_town_slow ] },
            { ref : "sfx_bandit_attack_04" , src : [ sfx_bandit_attack_04 ], group : "sfx" },
            { ref : "sfx_player_sword_swing_02" , src : [ sfx_player_sword_swing_02 ], group : "sfx" },
            { ref : "sfx_quest_win" , src : [ sfx_quest_win ], group : "sfx" },
            { ref : "sfx_reward_xp_fly_01" , src : [ sfx_reward_xp_fly_01 ], group : "sfx" },
            { ref : "sfx_skeleton_alert_01" , src : [ sfx_skeleton_alert_01 ], group : "sfx" },
            { ref : "sfx_skillcheck_success_01" , src : [ sfx_skillcheck_success_01 ], group : "sfx" },
        ];


        //const audio = this.manifest.audio;
        this.audioConfigs.forEach(element => {
            console.log("element ", element )
            // for now we can mute based on index.html params
            let volume = 1;
            if( element.group == "sfx")
            {
                if( !params.playSfx.value ) volume = 0;
            }

            this.loadedAudioByRef[ element.ref ] = new Howl({
                // src: [ this.baseURL + element.path],
                src: element.src,
                onload : ()=>{
                    this.onAudioLoaded();
                },
                volume : volume
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
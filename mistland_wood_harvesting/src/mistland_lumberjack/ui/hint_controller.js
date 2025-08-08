import { Assets, Container, Sprite } from 'pixi.js';
import { hand } from '../../../media/pngs_hand.png.js';
import { nav_area } from '../../../media/pngs_nav_area.png.js';
import { nav_touch } from '../../../media/pngs_nav_touch.png.js';
import { Easing, Tween } from '@tweenjs/tween.js';

export default class HintManager{
    constructor({ playerController, pixiApp, applicationModel, joystick })
    {
        this.joystick = joystick;
        this.pixiApp = pixiApp;
        this.initSprites();

        this.noInputTimeoutDuration = 10000;
        this.boundOnNoInputTimeout = this.onNoInputTimeout.bind( this );
        this.boundOnJoystickEnd = this.onJoystickEnd.bind( this );
        joystick.on('move end', this.boundOnJoystickEnd );

        this.boundOnJoystickStart = this.cancelJoystickPrompt.bind( this );
        joystick.on('start', this.boundOnJoystickStart );

        this.noInputTimeoutID = setInterval( this.boundOnNoInputTimeout, this.noInputTimeoutDuration );
    }

    destroy()
    {
        if( this.noInputTimeoutID > -1 ) clearInterval( this.noInputTimeoutID );
        this.cancelJoystickPrompt();
        this.fadeInTween = null;
        this.translateUpTween = null;
        this.fadeOutTween = null;
    }

    onNoInputTimeout()
    {
        this.startHandAnim();
    }

    noInputTimeoutID = -1;
    onJoystickEnd()
    {
        // each time start event is detected, reset the timout
        if( this.noInputTimeoutID > -1 ) 
        {
            clearInterval( this.noInputTimeoutID );
            this.noInputTimeoutID = setInterval( this.boundOnNoInputTimeout, this.noInputTimeoutDuration );
        }
    }

    cancelJoystickPrompt()
    {
        if( this.fadeInTween ) this.fadeInTween.stop();
        if( this.translateUpTween ) this.translateUpTween.stop();
        if( this.fadeOutTween ) this.fadeOutTween.stop();
        this.handContainer.alpha= 0;
    }

    async initSprites()
    {
        const handContainer = new Container();
        const handTexture = await Assets.load(hand);
        const handSprite = Sprite.from(handTexture);

        const navBGTexture = await Assets.load( nav_area );
        const navFGTexture = await Assets.load( nav_touch );
        const navBGSprite = Sprite.from(navBGTexture);
        const navFGSprite = Sprite.from(navFGTexture);
        handContainer.addChild(navBGSprite);
        navBGSprite.addChild(navFGSprite);
        handContainer.addChild(handSprite);

        navBGSprite.anchor = { x : 0.5, y : 0.5 };
        navFGSprite.anchor = { x : 0.5, y : 0.5 };

        this.navBG = navBGSprite;
        this.handContainer = handContainer;        
        this.pixiApp.stage.addChild(handContainer);

        this.handContainer.alpha= 0;

        this.onResize();

        
    }

    startHandAnim()
    {
        console.log("start anim ")
        this.handContainer.alpha= 1;
        this.navBG.alpha = 0;
        const params = { opacity: 0 };
        this.fadeInTween = new Tween( params )
        .to({ opacity: 1 }, 1500 )
        .easing(Easing.Sinusoidal.Out).onUpdate(()=>{
            this.navBG.alpha = params.opacity;
            
        }).onComplete( ()=>{
            
        }).delay( 1000 ).start();

        this.handContainer.y = window.innerHeight;

        this.translateUpTween = new Tween( this.handContainer.position ).to( { y :  this.handContainer.y - 150 })
        .start();

        params.opacity=1;
        this.fadeOutTween = new Tween( params )
        .to({ opacity: 0 }, 1500 )
        .easing(Easing.Sinusoidal.Out).onUpdate(()=>{
            this.handContainer.alpha = params.opacity;
        }).onComplete( ()=>{
            this.fadeInTween = null;
            this.translateUpTween = null;
            this.fadeOutTween = null;
            
        }).delay( 5000 ).start();
    }

    fadeOutHandAnim()
    {

    }

    onResize()
    {
        
        this.handContainer.x = window.innerWidth * 0.5;
        // this.handContainer.y =  window.innerHeight - 300; 
        

    }

    update( dt )
    {   
        //console.log("update " , this.pixiApp.stage );
        if( this.fadeInTween ) this.fadeInTween.update();
        if( this.translateUpTween ) this.translateUpTween.update();
        if( this.fadeOutTween ) this.fadeOutTween.update();
    }
}
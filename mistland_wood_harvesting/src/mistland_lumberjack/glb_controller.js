import { AnimationMixer, LoopOnce, LoopRepeat } from "three";

export default class GlbController{
    constructor({ glb, applicationModel }){
    
        this.applicationModel = applicationModel;
        this.glb = glb;
        this.mixer = new AnimationMixer( glb.scene );       
        this.glbAnimationsList = glb.animations;
        console.log("this.glbAnimationsList ", this.glbAnimationsList )		
    }


    getAnimIndexByName( name )
    {
        let index = -1;
        for( let i=0; i<this.glbAnimationsList.length; i++)
        {
            if( this.glbAnimationsList[i].name == name ) index = i;
        }
        return index;
    }

    update( dt )
    {
        if( this.mixer != null ){
            //this.mixer.update( dt.delta * 0.001 );
            this.mixer.update( dt );
        }
    }

    playAnimByIndex( index , loopAmt, noFade  ){	
        //console.log("playAnimByIndex ", index , loopAmt)		
        if( this.activeAction  ) 
        {
            this.activeAction.fadeOut( 0.2 );
            //this.activeAction.stop();
        }
        const action =  this.mixer.clipAction( this.glbAnimationsList[index] );		
        action.clampWhenFinished = true;
        
        if( loopAmt == 1 )
        {
            action.setLoop( LoopOnce, 1 );
            // action.setLoop( THREE.LoopOnce, 1 );
        }if( loopAmt == -1 )
        {
            action.setLoop( LoopRepeat );
        }
        else 
        {
            action.setLoop( LoopRepeat,  loopAmt );
        }			
        
        if( noFade ) action.reset().setEffectiveTimeScale( 1 ).play();
        else action.reset().setEffectiveTimeScale( 1 ).setEffectiveWeight( 1 ).fadeIn( 0.2 ).play();
        this.activeAction = action;
    }
}
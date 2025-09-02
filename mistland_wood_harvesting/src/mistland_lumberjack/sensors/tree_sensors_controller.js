import { EventDispatcher } from "three";

export default class TreeSensorsController extends EventDispatcher{
    constructor( { applicationModel, trees, player })
    {
        super();

        this.player = player;
        this.applicationModel = applicationModel;
        this.boundOnZoneEnter = this.onZoneEnter.bind(this);
        this.boundOnZoneExit = this.onZoneExit.bind(this);

        this.boundOnPLayerEvent = this.onPlayerEvent.bind(this);
        this.player.addEventListener('player_event', this.boundOnPLayerEvent );

        this.boundOnModelEvent = this.onModelEvent.bind( this );
        this.applicationModel.addEventListener('model_event', this.boundOnModelEvent );

        trees.forEach(element => {
            element.sensor.addEventListener('enter', this.boundOnZoneEnter );
            element.sensor.addEventListener('exit', this.boundOnZoneExit );
        });
        this.trees = trees;

        this.axeTargetTree = null;
        this.activeTrees = [];
    }


    onModelEvent( e )
    {
        console.log("onModelEvent = " );
        switch( e.detail )
        {
            case "log_collected":
                this.player.playLogCollectionAnim( this.axeTargetTree.sensor.body );
                this.axeTargetTree.decrementValue();

 
                if( this.axeTargetTree.logsAvailable == 0 )
                {
                    const tTree = this.axeTargetTree;
                    this.activeTrees.splice( this.activeTrees.indexOf( tTree ) , 1 );

                    // Permanently remove event listeners since tree is destroyed
                    tTree.sensor.removeEventListener('enter', this.boundOnZoneEnter );
                    tTree.sensor.removeEventListener('exit', this.boundOnZoneExit );
                    tTree.destroy( true );
                    this.axeTargetTree = null;

                    // if( this.activeTrees.length > 0 ){
                    //     this.axeTargetTree = this.activeTrees[0];   
                    // }

                    console.log("tree delpeted and destroyd = " ,this.activeTrees);
                } 
                else {
                    if( this.applicationModel.logCount < getParamsNumberByID("backpackSize") )
                    {
                        this.player.startChopping();
                    }
                }

                

                // this.axeTargetTree = null;

                // is player in ranghe of any other trees?
                if( !this.axeTargetTree ) {
                    if( this.activeTrees.length > 0 ){
                        this.axeTargetTree = this.activeTrees[0];   
                        
                        if( this.applicationModel.logCount < getParamsNumberByID("backpackSize") )
                        {
                            this.player.startChopping();
                        }
                    }
                    else 
                    {
                        console.log("wtf no zones left");
                        this.player.stopChopping();
                    }
               } 



                //  else 
                // {
                //     if( this.applicationModel.logCount < getParamsNumberByID("backpackSize") )
                //     {
                //         this.player.startChopping();
                //     }
                // }

                
                break;
        }
    }
            

    onPlayerEvent( e ){
        switch( e.detail )
        {
            case "axe_chop_complete":
                this.applicationModel.onLogCollected();
                // const targetTree = this.sensorsController.currentTreeSensor.parentController;
                // if( 
                //     this.applicationModel.logCount >= getParamsNumberByID("backpackSize") ||
                //     targetTree.logsAvailable <= 0
                // ) this.player.stopChopping();
                
                // if( targetTree.logsAvailable <= 0 )
                // {
                //     this.sensorsController.removeTree( targetTree );
                //     //this.trees.splice( this.trees.indexOf( targetTree , 1 ));
                //     targetTree.destroy( true , ( tree )=>{
                //         this.trees.splice( this.trees.indexOf( tree ), 1 );
                //     });
                // }
                break;
        }
    }

    onZoneEnter( e ) {
        
        const enteredTree = getTreeByID( e.sensor.parentController.id , this.trees);
        enteredTree.targetValueIndicator.show();
        
        this.activeTrees.push( enteredTree );
       
        // this.dispatchEvent({ 
        //     type:"sensor_event" , 
        //     sensorType : e.sensor.sensorType,
        //     enter: true
        // });
        
        
        console.log("onZoneEnter = " , this.axeTargetTree )
        if( !this.axeTargetTree ) 
        {
            this.axeTargetTree = enteredTree;
            if( this.applicationModel.logCount < getParamsNumberByID("backpackSize") || this.axeTargetTree.logsAvailable > 0 )
            {
                this.player.startChopping();
            }
        }
        //console.log("e = " , enteredTree , this.currentTree.id )



        
    }

    onZoneExit( e ) {
        const exitedTree = getTreeByID( e.sensor.parentController.id , this.trees);
        exitedTree.targetValueIndicator.hide();

        this.activeTrees.splice( this.activeTrees.indexOf( exitedTree ) , 1 );
        
        console.log("onZoneExit = " ,this.activeTrees);
        // if( this.activeTrees.length > 0 ){
        //     this.currentTree = this.activeTrees[0];
        // } else {
        //     this.currentTree = null;
        // }
    }
}

function getTreeByID( id , trees)
{
    let treeToReturn = null;
    trees.forEach(element => {
        if( element.id == id ){
            treeToReturn = element;
        }
    });

    return treeToReturn;
};
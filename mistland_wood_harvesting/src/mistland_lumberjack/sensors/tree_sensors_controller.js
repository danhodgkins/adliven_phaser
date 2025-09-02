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

        this.boundOnChopDelayComplete = this.onChopDelayComplete.bind(this);

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
                } 

                this.axeTargetTree = null;                
                break;
        }
    }

    chopDelayTimeout = -1;
    slowChopDelay = 200;
    fastChopDelay = 25;
    onChopDelayComplete()
    {
        this.chopDelayTimeout = -1;
        this.applicationModel.onLogCollected();
    }

    onPlayerEvent( e ){
        switch( e.detail )
        {
            case "axe_chop_complete":
                if( this.activeTrees.length > 0 ){
                    this.axeTargetTree = this.activeTrees[0];   

                    if( this.applicationModel.logCount < getParamsNumberByID("backpackSize") )
                    {
                        const delay = this.player.axeLevel == 0 ? this.slowChopDelay : this.fastChopDelay; 
                        this.chopDelayTimeout = setTimeout( this.boundOnChopDelayComplete , delay );
                        this.player.startChopping();
                    }
                }
                else 
                {
                    console.log("no zones left");
                    this.player.stopChopping();
                }
                break;
        }
    }

    onZoneEnter( e ) {
        
        const enteredTree = getTreeByID( e.sensor.parentController.id , this.trees);
        enteredTree.targetValueIndicator.show();        
        this.activeTrees.push( enteredTree );
        
        if( !this.axeTargetTree ) 
        {
            this.axeTargetTree = enteredTree;
            if( this.applicationModel.logCount < getParamsNumberByID("backpackSize") || this.axeTargetTree.logsAvailable > 0 )
            {
                this.player.startChopping();
                const delay = this.player.axeLevel == 0 ? this.slowChopDelay : this.fastChopDelay; 
                this.chopDelayTimeout = setTimeout( this.boundOnChopDelayComplete , delay );
            }
        }        
    }

    onZoneExit( e ) {
        const exitedTree = getTreeByID( e.sensor.parentController.id , this.trees);
        exitedTree.targetValueIndicator.hide();
        this.activeTrees.splice( this.activeTrees.indexOf( exitedTree ) , 1 );
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
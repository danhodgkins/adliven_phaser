import { EventDispatcher } from "three";

export default class SensorsController extends EventDispatcher{

    intervalDuraion = 250;
    intervalID = -1;

    constructor( { applicationModel, trees, lumbermill, workshop })
    {
        super();
        this.applicationModel = applicationModel;
        this.boundOnZoneEnter = this.onZoneEnter.bind(this);
        this.boundOnZoneExit = this.onZoneExit.bind(this);

        trees.forEach(element => {
            element.sensor.addEventListener('enter', this.boundOnZoneEnter );
            element.sensor.addEventListener('exit', this.boundOnZoneExit );
        });
        this.trees = trees;

        lumbermill.sensor.addEventListener('enter',  this.boundOnZoneEnter);
        lumbermill.sensor.addEventListener('exit',  this.boundOnZoneExit);

        workshop.sensor.addEventListener('enter',  this.boundOnZoneEnter);
        workshop.sensor.addEventListener('exit',  this.boundOnZoneExit);

        this.boundOnChopWoodTick = this.onChopWoodTick.bind(this);
        this.boundOnLumbermillTick = this.onLumbermillTick.bind(this);
        this.boundOnWorkshopTick = this.onWorkshopTick.bind(this);

        this.currentTreeSensor = null;

        this.activeTrees = [];
    }

    // Call this method only when a tree is permanently destroyed/removed from the game
    // NOT when player temporarily exits the sensor area
    removeTree( targetTree )
    {
        // Remove from active trees list
        for (let index = 0; index < this.activeTrees.length; index++) {
            const element = this.activeTrees[index];
            if( targetTree.id == element.id )
            {
                this.activeTrees.splice( index , 1 );
                break;
            }
        }

        // Permanently remove event listeners since tree is destroyed
        targetTree.sensor.removeEventListener('enter', this.boundOnZoneEnter );
        targetTree.sensor.removeEventListener('exit', this.boundOnZoneExit );

        // If there are still active trees, switch to the first one
        if( this.activeTrees.length > 0 ){
            this.currentTreeSensor = this.activeTrees[0].sensor;

            this.dispatchEvent({ 
                type:"sensor_event" , 
                sensorType : this.currentTreeSensor.sensorType,
                enter: true
            });
        } else {
            // No active trees left, dispatch exit event
            this.dispatchEvent({ 
                type:"sensor_event" , 
                sensorType : "tree",
                enter: false
            });
        }
    }

    onZoneEnter( e ) {
        console.log("e = " , e.sensor.sensorType)
        switch( e.sensor.sensorType )
        {
            case "skeleton":

                break;

            case "workshop":
                this.intervalID = setInterval(this.boundOnWorkshopTick, this.intervalDuraion); // Chop wood every second
                break;

            case "tree":
                this.currentTreeSensor = e.sensor;
                this.activeTrees.push( e.sensor.parentController );
                break;

            case "lumbermill":
                this.intervalID = setInterval(this.boundOnLumbermillTick, this.intervalDuraion); // Chop wood every second
                break;
        }

        

        this.dispatchEvent({ 
            type:"sensor_event" , 
            sensorType : e.sensor.sensorType,
            enter: true
        });
    }

    onZoneExit( e ) {
        if( this.intervalID !== -1) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
            // lets not nullify this as the "current" may have been updated with a different overlapping tree sensor
            // which would thenm throw an error on axe chop complete
            //this.currentTreeSensor = null;
        }

        console.log("onZoneExit ",  e.sensor.sensorType)
        if( e.sensor.sensorType != "tree" )
        {
            this.dispatchEvent({ 
                type:"sensor_event" , 
                sensorType : e.sensor.sensorType,
                enter: false
            });

            return;
        }

        // For trees: only remove from activeTrees temporarily, don't remove event listeners
        // This allows the tree to be re-entered later
        for (let index = 0; index < this.activeTrees.length; index++) {
            const element = this.activeTrees[index];
            if( e.parentController.id == element.id )
            {
                // Only remove from active list, don't remove event listeners
                // Event listeners should only be removed when tree is permanently destroyed
                this.activeTrees.splice( index , 1 );
                break; // Exit loop once found
            }
        }

        if( this.activeTrees.length > 0 ){
            this.currentTreeSensor = this.activeTrees[0].sensor;

            this.dispatchEvent({ 
                type:"sensor_event" , 
                sensorType : this.currentTreeSensor.sensorType,
                enter: true
            });

            //this.onZoneEnter( this.activeTrees[0] )
        }  else {
             this.dispatchEvent({ 
                type:"sensor_event" , 
                sensorType : e.sensor.sensorType,
                enter: false
            });
            // this.currentTreeSensor = null;
        }
    }

    disable()
    {
        if( this.intervalID !== -1) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
            this.currentTreeSensor = null;
        }
    }

    onChopWoodTick() {
        // this.applicationModel.onLogCollected();
        // this.uiController.updateUI();
    }

    onLumbermillTick() {
        this.applicationModel.handleLumbermillTick();
    }

    onWorkshopTick(){
        this.applicationModel.handleWorkshopTick();
    }
}
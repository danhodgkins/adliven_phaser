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

    removeTree( targetTree )
    {
        for (let index = 0; index < this.activeTrees.length; index++) {
            const element = this.activeTrees[index];
            if( targetTree.id == element.id )
            {
                element.sensor.removeEventListener('enter', this.boundOnZoneEnter );
                element.sensor.removeEventListener('exit', this.boundOnZoneExit );
                this.activeTrees.splice( index , 1 );
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
            // this.currentTreeSensor = null;
            //this.onZoneExit( this.activeSensors[0].parentController )
        }

        return;


        this.trees.forEach(element => {
            if( element.id == targetTree.id ){

                
                element.sensor.removeEventListener('enter', this.boundOnZoneEnter );
                element.sensor.removeEventListener('exit', this.boundOnZoneExit );
                console.log("this.activeTrees.splice ", this.activeTrees.indexOf( targetTree ) )
                this.activeTrees.splice( this.activeTrees.indexOf(targetTree), 1 );


                // if( this.activeTrees.length > 0 ){
                //     //this.currentTreeSensor = this.activeSensors[0];
                //     this.onZoneEnter( this.activeTrees[0] )
                // }  else {
                //     //this.onZoneExit( this.activeSensors[0].parentController )
                // }

                // if( this.activeSensors.length > 0 ){
                //     this.currentTreeSensor = this.activeSensors[0];
                //     console.log( "dispatch overlap sensor  , " , this.currentTreeSensor.sensorType )
                //     this.dispatchEvent({ 
                //         type:"sensor_event" , 
                //         sensorType : this.currentTreeSensor.sensorType,
                //         enter: true
                //     });
                // } 
                // else {
                //     this.currentTreeSensor = null;
                //     //inform eveyrone sensor is gone so player exited
                //     this.dispatchEvent({ 
                //         type:"sensor_event" , 
                //         //sensorType : e.sensor.sensorType,
                //         enter: false
                //     });
                // }


            }
        });

        if( this.activeTrees.length > 0 ){
            //this.currentTreeSensor = this.activeSensors[0];
            this.onZoneEnter( this.activeTrees[0] )
        }  else {
            //this.onZoneExit( this.activeSensors[0].parentController )
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

        for (let index = 0; index < this.activeTrees.length; index++) {
            const element = this.activeTrees[index];
            if( e.parentController.id == element.id )
            {
                //element.sensor.removeEventListener('enter', this.boundOnZoneEnter );
                //element.sensor.removeEventListener('exit', this.boundOnZoneExit );
                this.activeTrees.splice( index , 1 );
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

        return;

        this.activeTrees.splice( this.activeSensors.indexOf( e.sensor ), 1 );

        
        if( this.activeSensors.length > 0 ){
            //this.onZoneEnter( this.activeSensors[0].parentController )
        } else {
            this.dispatchEvent({ 
                type:"sensor_event" , 
                sensorType : e.sensor.sensorType,
                enter: false
            });
            this.currentTreeSensor = null;
        }

        // if( this.activeSensors.length > 0 ){
        //     this.currentTreeSensor = this.activeSensors[0];
        //     console.log( "dispatch overlap sensor  , " , this.currentTreeSensor.sensorType )
        //     this.dispatchEvent({ 
        //         type:"sensor_event" , 
        //         sensorType : this.currentTreeSensor.sensorType,
        //         enter: true
        //     });
        // } 
        // else this.currentTreeSensor = null;

        // this.currentTreeSensor = null;

        //console.log( "onZoneExit , " , this.activeSensors.length )

        
        // this.dispatchEvent({ 
        //     type:"sensor_event" , 
        //     sensorType : e.sensor.sensorType,
        //     enter: false
        // });
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
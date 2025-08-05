import { EventDispatcher } from "three";

export default class SensorsController extends EventDispatcher{

    intervalDuraion = 250;
    intervalID = -1;

    constructor( { applicationModel, trees, lumbermill })
    {
        super();
        this.applicationModel = applicationModel;
        this.boundOnZoneEnter = this.onZoneEnter.bind(this);
        this.boundOnZoneExit = this.onZoneExit.bind(this);
        trees.forEach(element => {
            element.sensor.addEventListener('enter', this.boundOnZoneEnter );
            element.sensor.addEventListener('exit', this.boundOnZoneExit );
        });

        lumbermill.sensor.addEventListener('enter',  this.boundOnZoneEnter);
        lumbermill.sensor.addEventListener('exit',  this.boundOnZoneExit);

        this.boundOnChopWoodTick = this.onChopWoodTick.bind(this);
        this.boundOnLumbermillTick = this.onLumbermillTick.bind(this);

        this.currentTreeSensor = null;
    }

    onZoneEnter( e ) {
        console.log("e = " , e.sensor.sensorType)
        switch( e.sensor.sensorType )
        {
            case "tree":
                this.currentTreeSensor = e.sensor;
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
            this.currentTreeSensor = null;
        }

        this.dispatchEvent({ 
            type:"sensor_event" , 
            sensorType : e.sensor.sensorType,
            enter: false
        });
    }

    onChopWoodTick() {
        // this.applicationModel.onLogCollected();
        // this.uiController.updateUI();
    }

    onLumbermillTick() {
        this.applicationModel.handleLumbermillTick();
    }
}
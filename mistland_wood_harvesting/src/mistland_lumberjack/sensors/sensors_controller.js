import { EventDispatcher } from "three";

export default class SensorsController extends EventDispatcher{

    intervalDuraion = 150;
    intervalID = -1;

    constructor( { uiController, applicationModel, trees, lumbermill })
    {
        super();

        this.uiController = uiController;
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
    }

    onZoneEnter( e ) {
        console.log("e = " , e.sensor.sensorType)
        switch( e.sensor.sensorType )
        {
            case "tree":
                this.intervalID = setInterval(this.boundOnChopWoodTick, this.intervalDuraion); // Chop wood every second
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
        this.uiController.updateUI();
    }
}
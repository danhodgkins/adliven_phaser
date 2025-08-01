export default class SensorsController{

    intervalDuraion = 150;
    intervalID = -1;

    constructor( { uiController, applicationModel, trees, lumbermill })
    {
        this.uiController = uiController;
        this.applicationModel = applicationModel;
        trees.forEach(element => {
            element.sensor.addEventListener('enter', this.onZoneEnter.bind(this));
            element.sensor.addEventListener('exit', this.onZoneExit.bind(this));
        });

        lumbermill.sensor.addEventListener('enter', this.onZoneEnter.bind(this));
        lumbermill.sensor.addEventListener('exit', this.onZoneExit.bind(this));

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
    }

    onZoneExit( e ) {
        if( this.intervalID !== -1) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    }

    onChopWoodTick() {
        this.applicationModel.onLogCollected();
        this.uiController.updateUI();
    }

    onLumbermillTick() {
        this.applicationModel.handleLumbermillTick();
        this.uiController.updateUI();
    }
}
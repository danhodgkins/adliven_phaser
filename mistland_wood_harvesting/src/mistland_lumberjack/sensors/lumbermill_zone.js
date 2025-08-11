import TargetValueIndicator from "../ui/target_value_indicator";
import { SensorZone } from "./sensor";
import { bubble_wood } from '../../../media/img_bubble_wood.webp.js';

export default class LumberMillZone {
    constructor({ world, scene, position, radius = 1.5, playerBody, sensorType  }) {
        this.world = world;
        this.scene = scene;
        this.radius = radius;

        const model = this.scene.getObjectByName("Lumbermill");
        this.model = model;

        const sensor = new SensorZone({
            world, 
            scene,
            position:  model.position,
            radius: this.radius,
            playerBody: playerBody, 
            color: 0xfff,
            sensorType ,
            visible:false
        });

        this.sensor = sensor;

        this.targetValueIndicator = new TargetValueIndicator({ 
            scene,
            textureRef:bubble_wood,
            target: model.position,
            yOffset: 6,
            defaultText : getParamsNumberByID("gemsNeeded")
        })
    }

    updateTargetIndicatorText( newVal )
    {
        this.targetValueIndicator.updateText( newVal );
    }

    update() {
        this.sensor.update();
        this.targetValueIndicator.update();
    }
}
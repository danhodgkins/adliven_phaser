import { SensorZone } from "./sensor";

export default class LumberMillZone {
    constructor({ world, scene, position, radius = 1.5, playerBody, sensorType  }) {
        this.world = world;
        this.scene = scene;
        this.radius = radius;

        const model = this.scene.getObjectByName("Lumbermill");

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
    }

    update() {
        this.sensor.update();
    }
}
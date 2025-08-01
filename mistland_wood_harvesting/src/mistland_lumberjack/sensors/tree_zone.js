import { SensorZone } from "./sensor";

export default class TreeZone {
    constructor({ world, scene, position, radius = 1.5, playerBody, sensorType }) {
        this.world = world;
        this.scene = scene;
        this.radius = radius;
        // this.sensorType = sensorType;

        const sensor = new SensorZone({
            world, 
            scene,
            position: position || new Vec3(0, 0, 0),
            radius: this.radius,
            playerBody: playerBody, 
            color: 0xff00ff,
            sensorType : sensorType
        });

        this.sensor = sensor;
    }

    update() {
        this.sensor.update();
    }
}
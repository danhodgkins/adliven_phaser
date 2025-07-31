import { SensorZone } from "./sensor";

export default class LumberMillZone {
    constructor({ world, scene, position, radius = 1.5, playerBody }) {
        this.world = world;
        this.scene = scene;
        this.radius = radius;
        

        const sensor = new SensorZone({
            world, 
            scene,
            position: position || new Vec3(0, 0, 0),
            radius: this.radius,
            playerBody: playerBody, 
            color: 0xfff,
        });

        this.sensor = sensor;
    }

    update() {
        this.sensor.update();
    }
}
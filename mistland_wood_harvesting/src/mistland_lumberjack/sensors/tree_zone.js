import { Body, Sphere, Vec3 } from "cannon-es";
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
            position: position,
            // position: position || new Vec3(0, 0, 0),
            radius: this.radius,
            playerBody: playerBody, 
            color: 0xff00ff,
            sensorType : sensorType,
            visible : false
        });

        const sphereShape = new Sphere(radius * 0.75);
        const sphereBody = new Body({
            mass: 0, // > 0 makes it dynamic
            shape: sphereShape,
            position: new Vec3(position.x, 1.0, position.z),
        });
        world.addBody(sphereBody);


        this.sensor = sensor;
    }

    update() {
        this.sensor.update();
    }
}
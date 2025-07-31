import { SensorZone } from "./sensor";

export default class TreeZone {
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
        });

        // sensor.addEventListener('enter', () => {
        //     //console.log("Player entered sensor zone!");
        //     this.dispatchEvent({ type: 'enter', zone: this });
        // });

        // sensor.addEventListener('exit', () => {
        //     //console.log("Player exited sensor zone!");
        //     this.dispatchEvent({ type: 'exit', zone: this });
        // });

        this.sensor = sensor;
    }

    update() {
        this.sensor.update();
    }
}
import { Body, Material, Sphere, Vec3 } from "cannon-es";
import { SphereGeometry, Mesh, MeshStandardMaterial } from "three";

export class Player {
    constructor({ world, scene, camera }) {
        this.world = world;
        this.scene = scene;
        this.camera = camera;

        this.joystickInput = { x: 0, y: 0 };

        // Create physics material (optional)
        const defaultMaterial = new Material("default");

        // Movable sphere object
        const radius = 0.5;
        const sphereShape = new Sphere(radius);
        const sphereBody = new Body({
            mass: 1,
            material: defaultMaterial,
            position: new Vec3(0, radius, 0), // start above ground
        });
        sphereBody.addShape(sphereShape);
        world.addBody(sphereBody);
        this.sphereBody = sphereBody;

        // Three.js mesh
        const sphereMesh = new Mesh(
            new SphereGeometry(radius, 32, 32),
            new MeshStandardMaterial({ color: 0x00ff00 })
        );
        scene.add(sphereMesh);
        this.sphereMesh = sphereMesh;
    }

    setInput(x, y) {
        this.joystickInput = { x, y };
    }

    update(dt) {
        const { sphereBody, sphereMesh, joystickInput } = this;

        const speed = 5;
        sphereBody.velocity.x = joystickInput.x * speed;
        sphereBody.velocity.z = joystickInput.y * speed;

        // Sync mesh with physics body
        sphereMesh.position.copy(sphereBody.position);
        sphereMesh.quaternion.copy(sphereBody.quaternion);

        // Debug (optional)
        // console.log("Joystick X:", joystickInput.x, "Y:", joystickInput.y);
    }
}

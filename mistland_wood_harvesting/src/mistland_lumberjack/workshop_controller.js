import { Body, Box, Quaternion, Vec3 } from "cannon-es";
import { BoxGeometry, Mesh, MeshStandardMaterial } from "three";

export default class WorkshopController{
    constructor({ scene, world  })
    {
        this.scene = scene;
        this.world = world;

        const size = { x:4,y:0.6,z:4};
        const halfExtents = new Vec3(size.x / 2, size.y / 2, size.z / 2);
        const boxShape = new Box(halfExtents);
        const rotationY = Math.PI / 4;
        const position = { x:-10,y:0,z:10};
        const boxBody = new Body({
            mass: 0,
            position: new Vec3(position.x, position.y, position.z),
        });

        // Apply Y-axis rotation
        const quat = new Quaternion();
        quat.setFromEuler(0, rotationY, 0); // rotation in radians
        boxBody.quaternion.copy(quat);

        boxBody.addShape(boxShape);
        this.world.addBody(boxBody);

        // Create visual mesh
        const boxGeometry = new BoxGeometry(size.x, size.y, size.z);
        const boxMaterial = new MeshStandardMaterial({ color: 0xff0000 });
        const boxMesh = new Mesh(boxGeometry, boxMaterial);

        boxMesh.position.set(position.x, position.y, position.z);
        boxMesh.rotation.y = rotationY; // Three.js uses Euler angles
        this.scene.add(boxMesh);
        
    }

    unlock()
    {
        console.log("unlock workshop");
    }
}
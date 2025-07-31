import { Box, Body, Vec3, Quaternion, Plane } from "cannon-es";
import { BoxGeometry, Mesh, MeshStandardMaterial, Euler, MeshBasicMaterial, DoubleSide, PlaneGeometry } from "three";
import { degToRad } from "three/src/math/MathUtils.js";

export class PhysicsBounds {
    constructor({ boxes, world, scene }) {
        this.world = world;
        this.scene = scene;
        this.boxMeshes = [];

        // cannon planes are INFINTE so use a box if you want a floor
        const planeShape = new Plane()
        const planeBody = new Body({ 
            mass: 0,
            collisionFilterGroup: 1, // This is the "plane" group
            collisionFilterMask: 4 | 2 //Collide with player (4) and collidables (2)
        })
        planeBody.addShape(planeShape)
        planeBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
        planeBody.position.set(0, -0.5, 0)
        world.addBody(planeBody)        
        this.physicsWorld = world;

        //init plane
        const material = new MeshBasicMaterial({ color: tuneableGameParams.floorColour , side: DoubleSide});
        const geometry = new PlaneGeometry(100,100);
        const plane = new Mesh(geometry, material);
        plane.rotateX(degToRad(270));
        plane.position.copy(planeBody.position)
        scene.add(plane);

        boxes.forEach(({ position, size, rotationY = 0 }) => {
            const halfExtents = new Vec3(size.x / 2, size.y / 2, size.z / 2);
            const boxShape = new Box(halfExtents);

            // Create static body with rotation
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

            this.boxMeshes.push(boxMesh);
        });
    }

    /**
     * Toggle visibility of all box meshes
     * @param {boolean} visible 
     */
    setVisibility(visible) {
        this.boxMeshes.forEach(mesh => mesh.visible = visible);
    }
}

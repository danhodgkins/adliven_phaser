import { Box, Body, Vec3, Quaternion, Plane } from "cannon-es";
import { BoxGeometry, Mesh, MeshStandardMaterial, Euler, MeshBasicMaterial, DoubleSide, PlaneGeometry } from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { getWorldFromLocalPhysicsTransforms } from "../utils/layout";

export class PhysicsBounds {
    constructor({ world, scene, layoutData }) {
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
        const material = new MeshBasicMaterial({ color: 0x327a59 , side: DoubleSide});
        const geometry = new PlaneGeometry(1000,1000);
        const plane = new Mesh(geometry, material);
        plane.rotateX(degToRad(270));
        plane.position.copy(planeBody.position)
        scene.add(plane);

        const convertedPhysicsTranforms = getWorldFromLocalPhysicsTransforms({ data: layoutData, scene });
        
        convertedPhysicsTranforms.forEach(({ position, scale, rotation = 0 }) => {
            
            const m = 1;
            // const halfExtents = new Vec3( m,  m, m);
            const halfExtents = new Vec3( ( -scale.x / 2 ) * m, ( scale.y / 2 ) * m, (scale.z / 2)*m);
            const boxShape = new Box(halfExtents);

            const cannonQuat = new Quaternion(
                rotation.x,
                rotation.y,
                rotation.z,
                rotation.w
            );
            
            // Create static body with rotation
            const boxBody = new Body({
                mass: 0,
                position: new Vec3(position.x, position.y, position.z),
                collisionFilterGroup: 2, // This is the "collidable" group
                collisionFilterMask: 4 | 1, // Collide with player (4) and planes (1)
                quaternion : cannonQuat
            });

            // Apply Y-axis rotation
            const quat = new Quaternion();
            //quat.setFromEuler(new Euler(rotation.x, rotation.y, rotation.z)); // rotation in radians
            // boxBody.quaternion.copy(rotation);

            boxBody.addShape(boxShape);
            this.world.addBody(boxBody);

            // no need to create visual mesh here, as the debugger shows them
            // Create visual mesh
            // const boxGeometry = new BoxGeometry(5, 5, 5);
            // const boxGeometry = new BoxGeometry(-scale.x * m, scale.y* m, scale.z* m);
            // const boxMaterial = new MeshStandardMaterial({ color: 0xff0000 });
            // const boxMesh = new Mesh(boxGeometry, boxMaterial);

            // boxMesh.position.set(position.x, position.y, position.z);
            // //boxMesh.rotation.set(new Euler(rotation.x, rotation.y, rotation.z));
            // this.scene.add(boxMesh);

            // this.boxMeshes.push(boxMesh);
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

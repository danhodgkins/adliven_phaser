import { Body, Sphere, Vec3 } from "cannon-es";
import { Mesh, MeshStandardMaterial, SphereGeometry, EventDispatcher } from "three";

export class Collidable extends EventDispatcher {
    constructor({
        world,
        scene,
        playerBody,            // ⬅️ Player Cannon body to detect collisions against
        radius = 1,
        position = new Vec3(0, 0, 0),
        color = 0x00ffff,
        collidableGroup = 2,   // This sphere's group
        playerGroup = 4,       // Player's group
    }) {
        super();

        this.radius = radius;
        this.isColliding = false;
        this.playerBody = playerBody;

        // Create static Cannon sphere body
        const shape = new Sphere(radius);
        this.body = new Body({
            mass: 0,
            position: new Vec3(position.x, position.y, position.z),
            collisionFilterGroup: collidableGroup,
            collisionFilterMask: playerGroup, // only collide with player
        });
        this.body.addShape(shape);
        world.addBody(this.body);

        // Create Three.js mesh
        const geometry = new SphereGeometry(radius, 32, 32);
        const material = new MeshStandardMaterial({ color });
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.copy(this.body.position);
        scene.add(this.mesh);

        this._setupCollisionEvents(world);
    }

    _setupCollisionEvents(world) {
        this.body.addEventListener('collide', (event) => {
            const otherBody = event.body;
            if (otherBody === this.playerBody && !this.isColliding) {
                this.isColliding = true;
                 console.log("collisionstart");
                this.dispatchEvent({ type: 'collisionstart', body: otherBody });
            }
        });

        world.addEventListener('postStep', () => {
            const stillColliding = world.contacts.some(contact =>
                (contact.bi === this.body && contact.bj === this.playerBody) ||
                (contact.bj === this.body && contact.bi === this.playerBody)
            );

            if (!stillColliding && this.isColliding) {
                this.isColliding = false;
                this.dispatchEvent({ type: 'collisionend', body: this.playerBody });
            }
        });
    }

    update() {
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        const scale = this.isColliding
            ? 1 + 0.1 * Math.sin(Date.now() * 0.01)
            : 1;

        this.mesh.scale.set(scale, scale, scale);
    }
}

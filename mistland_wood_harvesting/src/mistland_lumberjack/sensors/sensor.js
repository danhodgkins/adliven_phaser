import { Body, Sphere, Vec3 } from 'cannon-es';
import { Mesh, MeshBasicMaterial, SphereGeometry, EventDispatcher } from 'three';

export class SensorZone extends EventDispatcher {
    constructor({
        world,
        scene,
        position = new Vec3(0, 0, 0),
        radius = 1,
        color = 0x00ffcc,
        playerBody,
        sensorGroup = 8,
        playerGroup = 4,
        visible = true, 
        sensorType, 
        parentController
    }) {
        super();

        this.world = world;
        this.playerBody = playerBody;
        this.radius = radius;
        this.active = true;
        this.hasCollided = false;
        this.sensorType = sensorType; 
        this.parentController = parentController;
        
        // Create sensor body
        this.body = new Body({
            mass: 0,
            position: position.clone(),
            collisionResponse: false,            // No physics reaction
            collisionFilterGroup: sensorGroup,   // Belongs to sensor group
            collisionFilterMask: playerGroup     // Only detects player
        });

        const shape = new Sphere(radius);
        this.body.addShape(shape);
        world.addBody(this.body);

        // Visual representation (optional)
        const geometry = new SphereGeometry(radius, 16, 16);
        const material = new MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.4 });
        this.mesh = new Mesh(geometry, material);
        this.mesh.visible = visible;
        this.mesh.position.copy(position);
        scene.add(this.mesh);

        this._setupListeners();
    }

    _setupListeners() {
        this.body.addEventListener('collide', (e) => {
            if (!this.active || this.hasCollided) return;
            if (e.body === this.playerBody) {
                this.hasCollided = true;
                this.dispatchEvent({ type: 'enter', sensor: this, parentController : this.parentController });
            }
        });

        // Check contact list to emit 'exit' event
        this.world.addEventListener('postStep', () => {
            if (!this.active || !this.hasCollided) return;

            const touching = this.world.contacts.some(c =>
                (c.bi === this.body && c.bj === this.playerBody) ||
                (c.bj === this.body && c.bi === this.playerBody)
            );

            if (!touching) {
                this.hasCollided = false;
                this.dispatchEvent({ type: 'exit', sensor: this, parentController : this.parentController });
            }
        });
    }

    update() {
        // Keep mesh synced if needed (static sensor won't move by default)
        this.mesh.position.copy(this.body.position);
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }

    deactivate() {
        this.active = false;
    }

    activate() {
        this.active = true;
    }

    destroy() {
        this.world.removeBody(this.body);
        this.mesh.parent.remove(this.mesh);
    }
}

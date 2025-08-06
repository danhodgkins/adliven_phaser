import { Vector3, Euler, EventDispatcher } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";
import { Skeleton } from "../../media/Skeleton.glb.js";

export class SkeletonController extends EventDispatcher {
    constructor({ world, scene, position, rotation, player }) {
        super();
        this.world = world;
        this.scene = scene;
        this.position = position;
        this.rotation = rotation;
        this.player = player;

        this.initVisuals();
    }

    initVisuals() {
        const loader = new GLTFLoader();
        loader.load(Skeleton, (gltf) => {
            const zombieMesh = gltf.scene;
            zombieMesh.scale.set(1,1,1);
            zombieMesh.position.copy(this.position);
            zombieMesh.quaternion.setFromEuler(new Euler(0, Math.PI / 2, 0));
            this.scene.add(zombieMesh);
            this.mesh = zombieMesh;

            // Set up animation controller if needed
            this.glbController = new GlbController({ gltf });
        });
    }

    update(deltaTime) {
        if (this.mesh && this.player && this.player.sphereMesh) {
            // Get positions as Vector3
            const skeletonPos = this.mesh.position;
            const playerPos = this.player.sphereMesh.position;
            
            // Calculate distance to player
            const distance = skeletonPos.distanceTo(playerPos);
            
            // Move towards player if within 5 meter radius
            const followRadius = 10.0;
            const moveSpeed = 1.0; // Units per second
            const rotationSpeed = 2.0; // Radians per second
            
            if (distance <= followRadius && distance > 0.5) { // Don't move if too close (0.5m)
                // Calculate direction vector from skeleton to player
                const direction = new Vector3()
                    .subVectors(playerPos, skeletonPos)
                    .normalize();
                
                // Move towards player
                const movement = direction.multiplyScalar(moveSpeed * deltaTime);
                this.mesh.position.add(movement);
                
                // Smooth rotation to face the player
                const targetAngle = Math.atan2(direction.x, direction.z);
                const currentAngle = this.mesh.rotation.y;
                
                // Calculate the shortest angular distance
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // Apply smooth rotation
                const maxRotation = rotationSpeed * deltaTime;
                const rotationAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxRotation);
                this.mesh.rotation.y += rotationAmount;
                
            }

            if (distance < 0.5){
                //Attack Player
                this.player.DropMultipleLogs();
            }
            
            // Update animation controller if it exists
            if (this.glbController) {
                this.glbController.update(deltaTime);
            }
        }
    }

    
}
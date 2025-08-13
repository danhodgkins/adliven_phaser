import { Vector3, Euler, EventDispatcher } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import GlbController from "./glb_controller.js";
import { Skeleton } from "../../media/Skeleton.glb.js";
import { Body, Material, Sphere, Vec3 } from "cannon-es";

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

        // Create physics material (optional)
        const defaultMaterial = new Material("default");

        // Movable sphere object
        const radius = 1.5;
        const sphereShape = new Sphere(radius);
        const sphereBody = new Body({
            mass: 1,
            material: defaultMaterial,
            position: new Vec3(0, radius, 0), // start above ground
        });
        sphereBody.addShape(sphereShape);
        sphereBody.collisionFilterGroup = 2;        // skeleton group
        sphereBody.collisionFilterMask = 1 | 2 | 4; // floor + skeletons + player
        
        this.world.addBody(sphereBody);
        this.sphereBody = sphereBody;

        const loader = new GLTFLoader();
        loader.load(Skeleton, (gltf) => {
            const zombieMesh = gltf.scene;
            zombieMesh.scale.set(1,1,1);
            zombieMesh.position.copy(this.position);
            zombieMesh.quaternion.setFromEuler(new Euler(0, Math.PI / 2, 0));
            this.scene.add(zombieMesh);
            this.mesh = zombieMesh;

            // Set up animation controller if needed
            this.glbController = new GlbController({  glb : gltf });
            const animRef = this.glbController.getAnimIndexByName("02_skeleton_attack");
            this.glbController.playAnimByIndex( animRef );
            sphereBody.position.copy(this.mesh.position);
        });
    }

    update(dt) {                
                
            if( !this.mesh ) return;
            const { sphereBody, mesh } = this;

            const walkSpeed = 1;
            const skeletonPos = this.mesh.position;
            const playerPos = this.player.sphereMesh.position;

            const direction = new Vector3()
                .subVectors(playerPos, skeletonPos)
                .setY(0)
                .normalize();

            // we want only horizontal (XZ) movement:
            sphereBody.velocity.x = direction.x * walkSpeed;
            sphereBody.velocity.y = 0;
            sphereBody.velocity.z = direction.z * walkSpeed;

            sphereBody.position.y = skeletonPos.y;

            // Make mesh face the player
            const angle = Math.atan2(direction.x, direction.z); 
            mesh.rotation.y = angle;

            // Sync mesh with physics body
            // to fix the jitters - ease towards the physics object, 2nd param too low makes the hero slide 
            mesh.position.lerp(sphereBody.position, 0.25); // 0.5 is smoothing factor
            
            if( !this.glbController ) return;

            //     if( !this.isChopping && this.currentState != this.STATE_WALKING ) this.setState( this.STATE_WALKING );
            // } else {
            //     if( !this.isChopping && this.currentState != this.STATE_IDLE ) this.setState( this.STATE_IDLE );
            // }

            if( this.glbController ) this.glbController.update( dt );
        }

    // update(deltaTime) {
    //     if (this.mesh && this.player && this.player.sphereMesh) {
    //         // Get positions as Vector3
    //         const skeletonPos = this.mesh.position;
    //         const playerPos = this.player.sphereMesh.position;
            
    //         // Calculate distance to player
    //         const distance = skeletonPos.distanceTo(playerPos);
            
    //         // Move towards player if within 5 meter radius
    //         const followRadius = 10.0;
    //         const moveSpeed = 1.0; // Units per second
    //         const rotationSpeed = 2.0; // Radians per second
            
    //         if (distance <= followRadius && distance > 0.5) { // Don't move if too close (0.5m)
    //             // Calculate direction vector from skeleton to player
    //             const direction = new Vector3()
    //                 .subVectors(playerPos, skeletonPos)
    //                 .normalize();
                
    //             // Move towards player
    //             const movement = direction.multiplyScalar(moveSpeed * deltaTime);
    //             this.mesh.position.add(movement);
                
    //             // Smooth rotation to face the player
    //             const targetAngle = Math.atan2(direction.x, direction.z);
    //             const currentAngle = this.mesh.rotation.y;
                
    //             // Calculate the shortest angular distance
    //             let angleDiff = targetAngle - currentAngle;
    //             while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    //             while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
    //             // Apply smooth rotation
    //             const maxRotation = rotationSpeed * deltaTime;
    //             const rotationAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxRotation);
    //             this.mesh.rotation.y += rotationAmount;
                
    //         }

    //         if (distance < 0.5){
    //             //Attack Player
    //             this.player.DropMultipleLogs();
    //         }
            
    //         // Update animation controller if it exists
    //         if (this.glbController) {
    //             this.glbController.update(deltaTime);
    //         }
    //     }
    // }

    
}
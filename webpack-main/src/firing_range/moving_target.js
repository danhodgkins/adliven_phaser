import { BoxGeometry, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from "three";
import CANNON from 'cannon';

export class MovingTarget {
    constructor({ threeScene, physicsWorld, col }) {
        this.scene = threeScene;
        this.world = physicsWorld;
        this.col = col;
        this.boundOnCollision = this.onCollision.bind(this);
        this.eventDispatcher = new EventTarget();
        this.initCube();
    }

    destroy() {
        if( this.mesh && this.body ) {
            this.scene.remove(this.mesh);
            this.world.removeBody(this.body);
            this.mesh = null;
            this.body = null;
            this.scene = null;
            this.world = null;
            this.boundOnCollision = null;
            this.eventDispatcher = null;
        }
    }

    update(dt) {
        if( this.mesh && this.body) {
            // Update position and rotation of the mesh based on the physics body
            this.mesh.position.set(
                this.body.position.x, 
                this.body.position.y, 
                this.body.position.z
            );
            this.mesh.quaternion.set(
                this.body.quaternion.x, 
                this.body.quaternion.y, 
                this.body.quaternion.z, 
                this.body.quaternion.w
            );
        }
    }

    onCollision( e ) {
        if (e.body.userData?.type === 'projectile')
        {
            this.eventDispatcher.dispatchEvent(new CustomEvent('targetHit', { detail: { target: this } }));
        }
    }

    initCube() {
        // init cube
        const cubegeometry = new BoxGeometry( 1, 1, 1 );
        const cubematerial = new MeshBasicMaterial( { color: this.col } );
        const cubeMesh = new Mesh( cubegeometry, cubematerial );
        this.scene.add( cubeMesh );
        cubeMesh.position.set(0, 5, 0);
        // cubeMesh.quaternion.set(1, 0, 0.5, 1);

        const axis = new Vector3(1, 1, 0); // X-axis
        const angle = Math.PI / 3; // 90 degrees in radians
        const quaternion = new Quaternion().setFromAxisAngle(axis, angle);
        cubeMesh.quaternion.multiplyQuaternions(quaternion, cubeMesh.quaternion);

        const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
        const cubeBody = new CANNON.Body({ 
            mass: 10, 
            quaternion: new CANNON.Quaternion(
                cubeMesh.quaternion.x, 
                cubeMesh.quaternion.y, 
                cubeMesh.quaternion.z, 
                cubeMesh.quaternion.w) 
            
            })
        cubeBody.addShape(cubeShape)
        cubeBody.addEventListener("collide", this.boundOnCollision);
        
        cubeBody.position.x = cubeMesh.position.x
        cubeBody.position.y = cubeMesh.position.y
        cubeBody.position.z = cubeMesh.position.z
        this.world.addBody(cubeBody)

        this.mesh = cubeMesh;
        this.body = cubeBody;
    }
}
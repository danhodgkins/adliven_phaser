import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, Vector3 } from 'three';

export class FollowCamera {
    constructor({ targetTransformVector , renderer, zoom = 10, lerpFactor = 0.1, offset = new Vector3(0, 5, 0), mode = 'orthographic' }) {
        this.targetTransformVector = targetTransformVector;
        this.renderer = renderer;
        this.zoom = zoom;
        this.lerpFactor = lerpFactor;
        this.offset = offset;
        this.mode = mode; // 'orthographic' or 'isometric'

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new OrthographicCamera(
            -aspect * zoom,
             aspect * zoom,
             zoom,
            -zoom,
             0.1,
             1000
        );

        // const geometry = new BoxGeometry(10, 10, 10);
        // const material = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });
        // const box = new Mesh(geometry, material);
        // this.camera.add( box );
        // // box.position.set(0, 0, -20); // relative to camera
        // // box.material.wireframe = true
        // this.box = box;

        // Initial position and orientation
        const initialPos = new Vector3().addVectors( this.targetTransformVector , this.offset);
        // const initialPos = new Vector3().addVectors(this.target.position, this.offset);
        this.camera.position.copy(initialPos);
        
        //this.camera.lookAt(initialPos.clone().sub(this.offset)); // Look straight down or toward fixed point
        // this.camera.lookAt( new Vector3(0,0,0) ); // always face the player
        this.camera.lookAt(this.targetTransformVector ); // always face the player

        this.boundHandleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundHandleResize );
        this.handleResize();
    }

    setNewTarget( targetMesh ){
        this.targetTransformVector = targetMesh;
    }

    handleResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -aspect * this.zoom;
        this.camera.right = aspect * this.zoom;
        this.camera.top = this.zoom;
        this.camera.bottom = -this.zoom;
        this.camera.updateProjectionMatrix();
    }

    update() {
        if (!this.targetTransformVector ) return;

        // // this.box.rotation.x += 0.01; // Rotate around X-axis
        // this.box.rotation.y += 0.01; // Rotate around Y-axis
        // // this.box.rotation.z += 0.01; // Rotate around Z-axis

        const desiredPos = new Vector3().addVectors(this.targetTransformVector, this.offset);
        
        if (this.mode === 'isometric') {
            // Isometric mode: follow on both X and Z axes with smooth lerping, keep Y position fixed
            const targetX = desiredPos.x;
            const targetZ = desiredPos.z;
            const currentX = this.camera.position.x;
            const currentZ = this.camera.position.z;
            
            // Lerp both X and Z positions for smooth following with delay
            this.camera.position.x += (targetX - currentX) * this.lerpFactor;
            this.camera.position.z += (targetZ - currentZ) * this.lerpFactor;
        } else {
            // Orthographic mode: only follow on Z-axis with smooth lerping, keep X and Y position fixed
            const targetZ = desiredPos.z;
            const currentZ = this.camera.position.z;
            
            // Lerp only the Z position for smooth following with delay
            this.camera.position.z += (targetZ - currentZ) * this.lerpFactor;
        }
        
        // Keep fixed orientation — don't look at target
        // Optionally, you can lock lookAt to a fixed point or direction:
        // this.camera.lookAt(this.camera.position.clone().sub(this.offset));
        // this.camera.lookAt(this.target.position);
    }

    getCamera() {
        return this.camera;
    }
}

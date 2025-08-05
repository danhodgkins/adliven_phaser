import { OrthographicCamera, Vector3 } from 'three';

export class FollowCamera {
    constructor({ targetTransformVector , renderer, zoom = 10, lerpFactor = 0.1, offset = new Vector3(0, 5, 0) }) {
        this.targetTransformVector = targetTransformVector;
        this.renderer = renderer;
        this.zoom = zoom;
        this.lerpFactor = lerpFactor;
        this.offset = offset;

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new OrthographicCamera(
            -aspect * zoom,
             aspect * zoom,
             zoom,
            -zoom,
             0.1,
             1000
        );

        // Initial position and orientation
        const initialPos = new Vector3().addVectors( this.targetTransformVector , this.offset);
        // const initialPos = new Vector3().addVectors(this.target.position, this.offset);
        this.camera.position.copy(initialPos);
        //this.camera.lookAt(initialPos.clone().sub(this.offset)); // Look straight down or toward fixed point
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

        const desiredPos = new Vector3().addVectors(this.targetTransformVector, this.offset);
        this.camera.position.lerp(desiredPos, this.lerpFactor);

        // Keep fixed orientation — don't look at target
        // Optionally, you can lock lookAt to a fixed point or direction:
        // this.camera.lookAt(this.camera.position.clone().sub(this.offset));
        // this.camera.lookAt(this.target.position);
    }

    getCamera() {
        return this.camera;
    }
}

import { DoubleSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, TextureLoader, Vector3 } from "three";
import { icon_gem } from '../../../media/img_icon_gem.webp.js';
import { Easing, Tween } from "@tweenjs/tween.js";

export class GemAnimator{
    constructor({ scene, camera })
    {
        this.scene = scene;
        this.camera = camera;
         /// direction marker
        const tloader = new TextureLoader();

        const texture = tloader.load(icon_gem, () => {
            texture.needsUpdate = true;
            this.texture = texture;
        });  

        this.tweens = [];
    }

    initGemPlane()
    {
            const geometry = new PlaneGeometry(1, 1); // Width and height
            const material = new MeshBasicMaterial({ map: this.texture, side: DoubleSide, transparent : true });
            const plane = new Mesh(geometry, material);
            this.scene.add(plane);
            return plane;
    }

    from3Dto2D( originVec )
    {
        const plane = this.initGemPlane();
        plane.position.copy( originVec );
        plane.lookAt( this.camera.position )

        const zDistance = 5; // how far from the camera in world units
        const targetPos = screenToWorld(window.innerWidth, 0, this.camera, zDistance);

        const params = { 
            x: plane.position.x, 
            y: plane.position.y, 
            z: plane.position.z,
            scale: 1 // start scale
        };

        const t = new Tween(params)
            .to({ 
                x: targetPos.x, 
                y: targetPos.y, 
                z: targetPos.z,
                scale: 0.2 // end scale (20% of original size)
            }, 1500)
            .easing( Easing.Quadratic.Out)
            .onUpdate(() => {
                plane.position.set(params.x, params.y, params.z);
                plane.scale.set(params.scale, params.scale, params.scale);
            }).onComplete((e)=>{
                this.tweens.splice( this.tweens.indexOf( t ),1);
                this.scene.remove(plane);
            })
            .start();
        this.tweens.push( t )

        
    }

    update( dt )
    {
        if( this.tweens.length > 0 ) 
            this.tweens.forEach(element => {
                element.update();
            }); 
    }
}

function screenToWorld(x, y, camera, zDistance = 0) {
    // Normalized Device Coordinates (-1 to +1)
    const ndc = new Vector3(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5 // in front of camera
    );

    // Convert from NDC to world space
    ndc.unproject(camera);

    // Direction from camera to point
    const dir = ndc.sub(camera.position).normalize();

    // Position at given distance from camera
    return camera.position.clone().add(dir.multiplyScalar(zDistance));
}
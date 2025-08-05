import { Body, Box, Quaternion, Vec3 } from "cannon-es";
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, TextureLoader } from "three";
import { lock } from '../../media/img_lock.png.js';
import { degToRad } from "three/src/math/MathUtils.js";
import { Easing, Tween } from "@tweenjs/tween.js";

export default class WorkshopController{
    constructor({ scene, world  })
    {
        this.scene = scene;
        this.world = world;

        const model = this.scene.getObjectByName("Gearshop");
        // model.visible = false;
        this.clonedScale = model.scale.clone();
        this.clonedPosition = model.position.clone();

        const parentObj = new Object3D();
        parentObj.position.copy( this.clonedPosition );
        this.scene.add( parentObj );
        parentObj.add( model );
        
        parentObj.scale.set(0, 0, 0);
        model.position.set(0, 0, 0);
        this.parentObj = parentObj;

        // console.log("this.clonedScale ", this.clonedScale);

        this.model = model;

        const loader = new TextureLoader();

        const texture = loader.load(lock, () => {
            texture.needsUpdate = true;
            const geometry = new PlaneGeometry(8, 8); // Width and height
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });
            const plane = new Mesh(geometry, material);

            // the model rotation is not visually aliging the texcture so manually set it for now
            // plane.rotation.copy( rotation );
            const rotationY = degToRad(61);
            plane.rotation.y = rotationY;
            plane.rotateX(degToRad(270));
            plane.position.copy( this.clonedPosition );
            this.scene.add(plane);
            this.texturedPlane = plane;
        });


        // const size = { x:10,y:0.6,z:10};
        // const halfExtents = new Vec3(size.x / 2, size.y / 2, size.z / 2);
        // const boxShape = new Box(halfExtents);
        // const rotationY = Math.PI / 4;
        // const position = new Vec3(model.position.x, model.position.y, model.position.z)
        // // const position = { x:-10,y:0,z:10};
        // const boxBody = new Body({
        //     mass: 0,
        //     position: new Vec3(position.x, position.y, position.z),
        // });

        // // Apply Y-axis rotation
        // const quat = new Quaternion();
        // quat.setFromEuler(0, rotationY, 0); // rotation in radians
        // boxBody.quaternion.copy(quat);

        // boxBody.addShape(boxShape);
        // this.world.addBody(boxBody);

        // // Create visual mesh
        // const boxGeometry = new BoxGeometry(size.x, size.y, size.z);
        // const boxMaterial = new MeshStandardMaterial({ color: 0xff0000 });
        // const boxMesh = new Mesh(boxGeometry, boxMaterial);

        // boxMesh.position.set(position.x, position.y, position.z);
        // boxMesh.rotation.y = rotationY; // Three.js uses Euler angles
        // this.scene.add(boxMesh);

        // this.mesh = boxMesh;
        
    }

    unlock()
    {
        
        this.texturedPlane.visible = false;
        // this.model.visible = true;

        this.scaleUpTween = new Tween( this.parentObj.scale )
        .to({
            x: 1, 
            y: 1, 
            z: 1 
        }, 500 )
        .easing(Easing.Elastic.Out).onComplete( ()=>{

            // const index = Math.floor(Math.random() * 3) + 1;
            // this.audioLib["pop_"+index].play();
        }).delay( 1000 ).start();
    }

    update(dt){
        if( this.scaleUpTween ) this.scaleUpTween.update()
    }
}
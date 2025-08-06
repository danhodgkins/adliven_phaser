import { Body, Box, Quaternion, Vec3 } from "cannon-es";
import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, TextureLoader } from "three";
import { lock } from '../../media/pngs_lock.png.js';
import { degToRad } from "three/src/math/MathUtils.js";
import { Easing, Tween } from "@tweenjs/tween.js";
import { SensorZone } from "./sensors/sensor.js";

export default class WorkshopController{
    constructor({ scene, world, playerBody, sensorType})
    {
        this.scene = scene;
        this.world = world;
        //this.playerBody = playerBody;

        const model = this.scene.getObjectByName("Gearshop");
        this.clonedScale = model.scale.clone();
        this.clonedPosition = model.position.clone();

        // create parent object for model ( as the models scale is inversed from the layout process ) to prevent weird animation when we scale it up in the unlock
        const parentObj = new Object3D();
        parentObj.position.copy( this.clonedPosition );
        this.scene.add( parentObj );
        parentObj.add( model );
        
        parentObj.scale.set(0, 0, 0);
        model.position.set(0, 0, 0);
        this.parentObj = parentObj;


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

        const sensor = new SensorZone({
            world, 
            scene,
            position: this.clonedPosition,
            // position: position || new Vec3(0, 0, 0),
            radius: 8,
            playerBody: playerBody, 
            color: 0xff00ff,
            sensorType : sensorType,
            visible : true
        })

        this.sensor = sensor;
    }

    reveal()
    {
        console.log("reveal");
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
        }).delay( 1000 ).start();
    }

    update(dt){
        if( this.scaleUpTween ) this.scaleUpTween.update();
        this.sensor.update();
    }
}
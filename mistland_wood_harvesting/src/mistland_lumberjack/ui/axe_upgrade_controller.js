import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, TextureLoader } from "three";
import { Axe } from '../../../media/Axe.glb.js';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Easing, Tween } from "@tweenjs/tween.js";
import { axe_upgrade } from '../../../media/img_axe_upgrade.webp.js';

export class AxeUpgradeController{ 

    timeoutID = -1;
    constructor( { camera } ){
        this.parentObj = new Object3D();
        this.parentObj.scale.set(0,0,0);
        this.enableRotationAnimation = false;

        const tloader = new TextureLoader();
        const texture = tloader.load(axe_upgrade, () => {
            texture.needsUpdate = true;
            
            const planeSize = 5;
            const geometry = new PlaneGeometry(planeSize,planeSize); // Width and height
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent : true   });
            const plane = new Mesh(geometry, material);
            plane.position.z -=3;
            plane.position.y +=1;
            this.parentObj.add(plane);
            this.bgPlane = plane;
        });  

        const loader = new GLTFLoader();
        loader.load(
            Axe, 
            (e) => {
                                 
                if( params.perspectiveCamera.value ){
                    e.scene.scale.set( 3,3,3);
                }else {
                    e.scene.scale.set( 6,6,6);
                }
                this.parentObj.add(e.scene);   
                this.axe = e.scene;
            }, 
            undefined, 
            (e) => { console.error("error loading model", e); }
        );

        camera.add( this.parentObj );
        this.parentObj.position.set(0, 0, -10); // relative to camera
    }

    hide()
    {
        this.tween = new Tween( this.parentObj.scale )
        .to({
            x: 0, 
            y: 0, 
            z: 0 
        }, 500 )
        .easing(Easing.Elastic.Out).onComplete( ()=>{
            this.timeoutID = -1;
            this.tween = null;
            this.enableRotationAnimation = false;
        }).start();
    }

    show( hideDelay )
    {
        this.enableRotationAnimation = true;
        this.tween = new Tween( this.parentObj.scale )
        .to({
            x: 1, 
            y: 1, 
            z: 1 
        }, 500 )
        .easing(Easing.Linear.Out).onComplete( ()=>{
            this.timeoutID = setTimeout( ()=>{
                this.hide();
            }, hideDelay );
        }).start();
    }

    update( dt ){
        if( !this.enableRotationAnimation ) return;
        if( this.axe ) this.axe.rotation.y += 0.03; // Rotate around Y-axis
        if( this.bgPlane ) this.bgPlane.rotation.z += 0.0006; // Rotate around Z-axis
        if( this.tween ) this.tween.update()
    }
}
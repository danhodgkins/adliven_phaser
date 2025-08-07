import { BoxGeometry, DoubleSide, Mesh, MeshBasicMaterial, Object3D } from "three";
import { Axe } from '../../media/Axe.glb.js';
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Easing, Tween } from "@tweenjs/tween.js";

export class AxeUpgradeController{ 

    timeoutID = -1;
    constructor( { camera, isPerspective = false } ){
        this.parentObj = new Object3D();
        this.parentObj.scale.set(0,0,0);

        const loader = new GLTFLoader();
        loader.load(
            Axe, 
            (e) => {
                                 
                if( isPerspective ){
                    e.scene.scale.set( 3,3,3);
                }else {
                    e.scene.scale.set( 10,10,10);
                }
                this.parentObj.add(e.scene);   
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
        }).start();
    }

    show( hideDelay )
    {
        this.tween = new Tween( this.parentObj.scale )
        .to({
            x: 1, 
            y: 1, 
            z: 1 
        }, 500 )
        .easing(Easing.Elastic.Out).onComplete( ()=>{
            this.timeoutID = setTimeout( ()=>{
                this.hide();
            }, hideDelay );
        }).start();
    }

    update( dt ){
        // this.box.rotation.x += 0.01; // Rotate around X-axis
        this.parentObj.rotation.y += 0.03; // Rotate around Y-axis
        // this.box.rotation.z += 0.01; // Rotate around Z-axis

        if( this.tween ) this.tween.update()
    }
}
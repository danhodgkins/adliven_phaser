import { Body, Sphere, Vec3 } from "cannon-es";
import { SensorZone } from "./sensor";
import TargetValueIndicator from "../ui/target_value_indicator";
import { bubble_wood } from '../../../media/img_bubble_wood.webp.js';
import { Easing, Tween } from "@tweenjs/tween.js";

export default class TreeZone {

    logsAvailable = 5;

    constructor({ world, scene, position, radius = 1.5, playerBody, sensorType, model , id }) {
        this.world = world;
        this.scene = scene;
        this.radius = radius;
        this.id = id;

        const sensor = new SensorZone({
            world, 
            scene,
            position: position,
            // position: position || new Vec3(0, 0, 0),
            radius: this.radius,
            playerBody: playerBody, 
            color: 0xff00ff,
            sensorType : sensorType,
            visible : false,
            parentController:this
        });
                
        this.boundOnPlayerEnter = this.onPlayerEnter.bind( this );
        this.boundOnPlayerExit = this.onPlayerExit.bind( this );
        sensor.addEventListener('enter', this.boundOnPlayerEnter );
        sensor.addEventListener('exit', this.boundOnPlayerExit );

        this.model = model;

        const sphereShape = new Sphere(radius * 0.75);
        const sphereBody = new Body({
            mass: 0, // > 0 makes it dynamic
            shape: sphereShape,
            position: new Vec3(position.x, 1.0, position.z),
        });
        world.addBody(sphereBody);
        this.body = sphereBody;

        this.targetValueIndicator = new TargetValueIndicator({ 
            scene,
            textureRef:bubble_wood,
            target: position,
            yOffset: 6,
            defaultText : this.logsAvailable,
            visibleOnInit : true
        })

        this.sensor = sensor;
    }

    decrementValue()
    {
        if( this.logsAvailable > 0 ) {
            this.logsAvailable--;
            this.targetValueIndicator.updateText( this.logsAvailable );
            
            // Trigger feedback animation
            this.playFeedbackAnimation();
        }
    }

    playFeedbackAnimation() {
        // Store original scale if not already stored
        if (!this.originalScale) {
            this.originalScale = {
                x: this.model.scale.x,
                y: this.model.scale.y,
                z: this.model.scale.z
            };
        }

        // Cancel any existing feedback tween
        if (this.feedbackTween) {
            this.feedbackTween.stop();
        }

        // Scale down to 0.9
        this.feedbackTween = new Tween(this.model.scale)
            .to({
                x: this.originalScale.x * 1.05,
                y: this.originalScale.y * 1.05,
                z: this.originalScale.z * 1.05
            }, 150) // Quick scale down
            .easing(Easing.Sinusoidal.Out)
            .onComplete(() => {
                // Scale back up to original size
                this.feedbackTween = new Tween(this.model.scale)
                    .to({
                        x: this.originalScale.x,
                        y: this.originalScale.y,
                        z: this.originalScale.z
                    }, 300) // Slightly longer scale back up
                    .easing(Easing.Elastic.Out)
                    .onComplete(() => {
                        this.feedbackTween = null;
                    })
                    .start();
            })
            .start();
    }

    onPlayerEnter()
    {
        this.targetValueIndicator.show();
    }

    onPlayerExit()
    {
        this.targetValueIndicator.hide();
    }

    updateTargetIndicatorText( newVal )
    {
        this.targetValueIndicator.updateText( newVal );
    }

    update() {
        this.sensor.update();
        this.targetValueIndicator.update();
        if( this.scaleDownTween ) this.scaleDownTween.update();
        if( this.feedbackTween ) this.feedbackTween.update(); // Update feedback tween
    }

    destroy( tween , completCallback)
    {
        this.world.removeBody(this.body);
        
        this.targetValueIndicator.hide();
        this.sensor.removeEventListener('enter', this.boundOnPlayerEnter );
        this.sensor.removeEventListener('exit', this.boundOnPlayerExit );

        console.log("destroy tree zone")

        // Stop feedback tween if running
        if (this.feedbackTween) {
            this.feedbackTween.stop();
            this.feedbackTween = null;
        }

        if( tween )
        {
            this.scaleDownTween = new Tween( this.model.scale )
            .to({
                x: 0, 
                y: 0, 
                z: 0 
            }, 850 )
            .easing(Easing.Elastic.In).onComplete( ()=>{
                this.scaleDownTween = null;
                completCallback();
            }).start();
        }
    }


}
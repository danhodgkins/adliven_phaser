import { DoubleSide, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, TextureLoader, Color, BackSide, FrontSide } from "three";
import { Box, Body, Vec3, Quaternion } from "cannon-es";
// import { lock } from '../../media/pngs_lock.png.js';
import { locked_area } from '../../../media/img_locked_area.webp.js';
import { degToRad } from "three/src/math/MathUtils.js";
import { Easing, Tween } from "@tweenjs/tween.js";
import { SensorZone } from "./sensor.js";
import TargetValueIndicator from "../ui/target_value_indicator.js";
import { bubble_gem } from '../../../media/img_bubble_gem.webp.js';
import { starburst } from '../../../media/img_starburst.webp.js';

export default class WorkshopController{
    constructor({ scene, world, playerBody, sensorType})
    {
        this.scene = scene;
        this.world = world;
        //this.playerBody = playerBody;

        const model = this.scene.getObjectByName("Gearshop");

        
        this.clonedScale = model.scale.clone();
        this.clonedPosition = model.position.clone();
        this.clonedRotation = model.quaternion.clone(); // Use quaternion instead of rotation
        
        // Get camera reference for billboard effect
        this.camera = scene.children.find(child => child.isCamera) || scene.getObjectByName("camera");
        
        // create parent object for model ( as the models scale is inversed from the layout process ) to prevent weird animation when we scale it up in the unlock
        const parentObj = new Object3D();
        parentObj.position.copy( this.clonedPosition );
        this.scene.add( parentObj );

        const whiteoutModel = model.clone();
        parentObj.add( model );
        parentObj.add( whiteoutModel );

        // get reference to models material so we can fade the transparecy
        model.traverse((child) => {
            if (child.isMesh) {
                
                this.materialToFadeIn = child.material;
                this.materialToFadeIn.transparent =true;
                this.materialToFadeIn.opacity =0;
            }
        });
        

       // replace material of clone for whiteout material
        whiteoutModel.traverse((child) => {
            if (child.isMesh) {
                const oldMat = child.material;
                const outlineMesh = child.clone();
                    outlineMesh.material = new MeshBasicMaterial({
                        color: new Color(1, 1, 0), // Yellow
                        side: FrontSide,
                        depthTest: true,
                        depthWrite: true,
                    });
                    outlineMesh.scale.multiplyScalar(1.05); // Make larger for outline
                    //outlineMesh.position.y += 0.001; // Move slightly forward to ensure it's in front
                    // Add outline to the same parent as the original mesh
                    child.parent.add(outlineMesh);
                    
                    // Create the main white material
                    child.material = new MeshBasicMaterial({
                        color: new Color(1, 1, 1), // Solid white
                        side: oldMat.side,
                        depthTest: false, // Disable depth testing to render on top
                        depthWrite: false, // Don't write to depth buffer
                    });
                    
                    // Move white mesh slightly forward to ensure it's in front
                    child.position.z += 0.001;
            }
            //this.addWorkshopCollider();
        });

        parentObj.scale.set(0, 0, 0);
        model.position.set(0, 0, 0);
        whiteoutModel.position.set(0, 0, 0);
        this.whiteoutModel = whiteoutModel;

        this.parentObj = parentObj;


        this.model = model;

        const loader = new TextureLoader();

        const texture = loader.load(locked_area, () => {
            texture.needsUpdate = true;
            const geometry = new PlaneGeometry(8, 8); // Width and height
            const material = new MeshBasicMaterial({ map: texture, side: DoubleSide, transparent : true  });
            const plane = new Mesh(geometry, material);

            // the model rotation is not visually aliging the texcture so manually set it for now
            // plane.rotation.copy( rotation );
            const rotationY = degToRad(61);
            plane.rotation.y = rotationY;
            plane.rotateX(degToRad(270));
            plane.position.copy( this.clonedPosition );
            plane.position.y +=0.5;
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
            visible : false
        })

        this.sensor = sensor;

        this.targetValueIndicator = new TargetValueIndicator({ 
            scene,
            textureRef:bubble_gem,
            target: parentObj.position,
            yOffset: 2,
            defaultText : getParamsNumberByID("gemsNeeded")
        })
    }

    updateTargetIndicatorText( newVal )
    {
        this.targetValueIndicator.updateText( newVal );
    }

    // stop sensor events firing after user has entered for final time
    disable()
    {
        this.sensor.deactivate();
        this.targetValueIndicator.hide();
    }

    reveal()
    {
        this.whiteoutModel.scale.set(0, 0, 0);
        console.log("reveal");

        // Create startburst effect
        this.createStartburstEffect();

        const params = { opacity: 0 };

        this.fadeInTween = new Tween( params )
        .to( { opacity: 1 }, 500 ).onUpdate(()=>{
            this.materialToFadeIn.opacity = params.opacity;
        }).onComplete( ()=>{
            console.log("fade in complete");
            // Remove startburst after fade in completes
            //this.removeStartburstEffect();
        }).start();
    }

    createStartburstEffect()
    {
        const loader = new TextureLoader();
        
        loader.load(starburst, (texture) => {
            texture.needsUpdate = true;
            
            const geometry = new PlaneGeometry(24, 24);
            const material = new MeshBasicMaterial({ 
                map: texture, 
                side: DoubleSide, 
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            const startburstQuad = new Mesh(geometry, material);
            
            // Fixed positioning calculation
            const buildingPos = this.clonedPosition.clone();
            if (this.camera) {
                const cameraPos = this.camera.position.clone();
                const direction = buildingPos.clone().sub(cameraPos).normalize();
                const distance = cameraPos.distanceTo(buildingPos);
                // Position 60% of the way from camera to building
                startburstQuad.position.copy(buildingPos.clone());
            } else {
                startburstQuad.position.copy(buildingPos);
                startburstQuad.position.z += 2;
            }
            
            startburstQuad.position.y = buildingPos.y + 1;
            
            this.scene.add(startburstQuad);
            this.startburstQuad = startburstQuad;

            console.log("Camera found:", this.camera);
            console.log("Building position:", buildingPos);
            console.log("Starburst position:", startburstQuad.position);
        });
    }

    removeStartburstEffect()
    {
        if (this.startburstQuad) {
            this.scene.remove(this.startburstQuad);
            this.startburstQuad = null;
        }
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
            // Add box collider after workshop is fully scaled up
            this.addWorkshopCollider();
        }).delay( 1000 ).start();
    }

    addWorkshopCollider()
    {
        // Get workshop model dimensions and position for collider
        const position = this.clonedPosition;
        const scale = this.clonedScale;
        
        const m = 1;
        // Create box collider with similar dimensions to the workshop
        const halfExtents = new Vec3( 
            Math.abs(scale.x / 2) * m, 
            Math.abs(scale.y / 2) * m, 
            Math.abs(scale.z / 2) * m
        );
        const boxShape = new Box(new Vec3(2.8,3.4,4.6));

        // Convert Three.js quaternion to Cannon.js quaternion
        const cannonQuat = new Quaternion(
            0,
            -0.342,
            0,
            0.940
        );

        // Create static body for workshop collision
        const boxBody = new Body({
            mass: 0,
            position: new Vec3(position.x, position.y, position.z),
            collisionFilterGroup: 2, // This is the "collidable" group
            collisionFilterMask: 4 | 1, // Collide with player (4) and planes (1)
            quaternion: cannonQuat
        });

        boxBody.addShape(boxShape);
        this.world.addBody(boxBody);
        
        // Store reference to remove later if needed
        this.workshopCollider = boxBody;
        
        console.log("Workshop collider added at position:", position);
    }

    update(dt){
        if( this.scaleUpTween ) this.scaleUpTween.update();
        if( this.fadeInTween ) this.fadeInTween.update();
        if( this.targetValueIndicator ) this.targetValueIndicator.update();
        this.sensor.update();
        
        // Make starburst spin on X-axis
        if (this.startburstQuad) {
            this.startburstQuad.rotation.z -= dt * 0.5; // Adjust speed by changing the multiplier
        }
    }
}
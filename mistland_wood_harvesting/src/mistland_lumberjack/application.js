import { WebGLRenderer,PlaneGeometry } from "three/src/Three.js";
import BaseScene from "../scene/basescene";
import { AmbientLight, BoxGeometry, Clock, DoubleSide, EventDispatcher, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry, SRGBColorSpace, Vector3, DirectionalLight, WebGLCubeRenderTarget, CubeCamera, Color, Float32BufferAttribute, MathUtils } from "three/src/Three.Core.js";
import { MistlandLumberjackUIController } from "./ui/ui_controller";
import { World, Body, Box, Vec3, Plane, Material } from 'cannon-es'
import { Player } from "./player";
import { SkeletonController } from "./Skeleton";
import { PhysicsBounds } from "./physics_bounds";
import { FollowCamera } from "./follow_cam";
import TreeZone from "./sensors/tree_zone";
import LumberMillZone from "./sensors/lumbermill_zone";
import nipplejs from 'nipplejs';
import SensorsController from "./sensors/sensors_controller";
import { ApplicationModel } from "./application_model";
import WorkshopController from "./sensors/workshop_controller.js";
import layoutData from "./data/layout.json"
import { layoutSceneHelper } from "../utils/layout";
import CannonDebugger from "cannon-es-debugger";
import { AxeUpgradeController } from "./ui/axe_upgrade_controller.js";
import HintManager from "./ui/hint_controller";
import { GemAnimator } from "./ui/gem_animator";
import TargetValueIndicator from "./ui/target_value_indicator";
import { bubble_wood } from '../../media/img_bubble_wood.webp.js';

export class MistlandLumberjackApplication extends BaseScene{

    skeletonControllers = [];
    timeoutID = -1;

    constructor({ config }) {
        super({config});
        console.log("Application initialized with parent:", config);

        this.audioController = config.audioController;
        this.pixiApp = config.pixiApp;
        
        this.boundOnSensorEvent = this.onSensorEvent.bind( this );
        
        this.applicationModel = new ApplicationModel();
        this.boundOnModelEvent = this.onModelEvent.bind( this );
        this.applicationModel.addEventListener('model_event', this.boundOnModelEvent );
        this.uiController = new MistlandLumberjackUIController({ 
                pixiApp : config.pixiApp, 
                uiLayerElement : document.getElementById("ui-overlay"),
                applicationModel : this.applicationModel 
            });

        // hide ctaOverlay
        const ctaOverlayPortrait = document.getElementById("ui-overlay-cta-portrait");
        ctaOverlayPortrait.style.display = 'none'; // Hides the element and removes it from the layout
    
        const ctaOverlayLandscape = document.getElementById("ui-overlay-cta-landscape");
        ctaOverlayLandscape.style.display = 'none'; // Hides the element and removes it from the layout
    
    }

    destroy()
    {
        super.destroy();
        this.uiController.destroy();
        this.joystick.destroy();
        this.hintManager.destroy();

        window.removeEventListener('resize', this.boundResizeListener );

        // being lazy as we dont have to replay the scene
        this.pixiApp.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true,
        });
    }

    init(){

        // debug test cta screen
        //setTimeout( ()=>{ this.onSceneComplete() } , 1000 );

        const scene = new Scene();
        this.scene = scene;
        
        const color = 0xFFFFFF; // LemonChiffon (faint yellow)
        const intensity = 1.5;
        const light = new AmbientLight(color, intensity);
        scene.add(light);

        // Add a directional light
        const dirLight = new DirectionalLight(0xFFFFFF, 4); // faint yellow
        dirLight.position.set(-20, 30, 10); // Lower and more horizontal for longer shadows
        dirLight.target.position.set(0, 0, 0); // Point at scene center
        scene.add(dirLight.target);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -40;
        dirLight.shadow.camera.right = 40;
        dirLight.shadow.camera.top = 40;
        dirLight.shadow.camera.bottom = -40;
        scene.add(dirLight);

        // renderer
        const renderer = new WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.outputEncoding = SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = 3;
        const el = document.getElementById( this.config.parent );
        el.appendChild( renderer.domElement );
        renderer.domElement.style.filter = 'saturate(1.2) contrast(1.1) brightness(1)';
        // Add CSS filters for enhanced visuals
        
        
        this.renderer = renderer;

        // Create gradient environment map for reflections
        this.setupEnvironmentMap(renderer, scene);

        // layout scene 
        this.boundOnLayoutComplete = this.onLayoutComplete.bind( this );
        layoutSceneHelper( { data:layoutData , scene, onCompleteCallback : this.boundOnLayoutComplete });

        // input 
        
        var options = {           
            mode: "dynamic",   // 'dynamic', 'static' or 'semi'
            color: "white",
            size : 200
            // zone: document.getElementById('zone_joystick'), // Your container
        };
        
        var joystick = nipplejs.create(options);
        this.joystick = joystick;

        this.joystickInput = { x: 0, y: 0, rotation: 0 };  
             
        joystick.on('move', (evt, data) => {
            const rad = data.angle.radian;
            const dist = Math.min(data.distance / 50, 1); // Normalize to max speed
            this.joystickInput.x = Math.cos(rad) * dist;
            this.joystickInput.y = Math.sin(rad) * dist;

            // Inverted Y for correct travel direction if needed
            this.joystickInput.rotation = Math.atan2(this.joystickInput.x, -this.joystickInput.y);
        });

        joystick.on('end', (evt, data)=> {            
            this.joystickInput.x = 0;
            this.joystickInput.y = 0;
        });
        // end input 

        // Setup physics world
        var world = new World();
        world.solver.iterations = 10;
        world.gravity.set(0, -10, 0); // m/s²
        this.world = world;     
        
        // Set up debug visualization
        const cannonDebugRenderer = CannonDebugger(scene, world, {
            color: 0x00ff00, // optional
        });
        this.cannonDebugRenderer = cannonDebugRenderer;
        
        // physics barriers
        const bounds = new PhysicsBounds({ world, scene, layoutData });

        // player
        this.player = new Player({
            world: world,
            scene: scene,
            audioController : this.audioController,
            applicationModel : this.applicationModel 
        });


        this.boundOnPlayerEvent = this.onPlayerEvent.bind(this);
        this.player.addEventListener('player_event', this.boundOnPlayerEvent );

        this.hintManager = new HintManager({ 
            playerController : this.player, 
            pixiApp : this.pixiApp ,
            joystick : this.joystick,
            applicationModel : this.applicationModel
        })
        
        if (params.perspectiveCamera.value) {
            // Create a simple perspective camera
            const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);            
            camera.position.set(0, 10, 6);
            camera.lookAt(new Vector3(0, 0, 0));
            camera.name="main_cam";
            this.camera = camera;

            // const width = window.innerWidth;
            // const height = window.innerHeight;
            // const aspect = width / height;
            // // Choose a base horizontal FOV (in degrees)
            // const horizontalFOV = 20; 

            // // Convert to vertical FOV based on aspect
            // const verticalFOV = 2 * Math.atan(Math.tan(MathUtils.degToRad(horizontalFOV) / 2) / aspect);
            // this.camera.fov = MathUtils.radToDeg(verticalFOV);
            // this.camera.aspect = aspect;

            
            // Camera offset for following player on Z-axis
            this.cameraZOffset = 12; // Distance behind player on Z-axis
            
            // Create a mock followCam object that follows player on Z-axis only
            this.followCam = {
                targetPosition: new Vector3(0, 0, 0),
                focusObject: null, // Track if we're focusing on a specific object
                isFollowingPlayer: false,
                
                setNewTarget: (targetPos) => {
                    this.followCam.targetPosition.copy(targetPos);
                    // Check if this is the player by comparing the target with player position
                    this.followCam.isFollowingPlayer = (this.player?.sphereMesh && 
                        targetPos.equals(this.player.sphereMesh.position));
                    this.followCam.focusObject = targetPos;
                },
                
                update: () => {
                    if (this.followCam.isFollowingPlayer && this.player?.sphereMesh) {
                        // When following player, move camera along Z-axis only with offset
                        const playerPos = this.player.sphereMesh.position;
                        
                        // Keep X and Y fixed, only update Z position with offset
                        const targetZ = playerPos.z + this.cameraZOffset;
                        
                        // Smooth Z-axis movement
                        this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
                        
                        // Smoothly look at the player using slerp
                        const tempCamera = this.camera.clone();
                        tempCamera.lookAt(playerPos);
                        this.camera.quaternion.slerp(tempCamera.quaternion, 0.05);
                    } else if (this.followCam.focusObject) {
                        // When focusing on a specific object, smoothly rotate towards it
                        const tempCamera = this.camera.clone();
                        tempCamera.lookAt(this.followCam.targetPosition);
                        
                        // Smooth rotation interpolation towards the target
                        this.camera.quaternion.slerp(tempCamera.quaternion, 0.05);
                    }
                },
                
                getCamera: () => this.camera
            };
        } 
        else {
            // workshop gets set as target after it has loaded, use 0,0,0 in the meantime
            const followCam = new FollowCamera({
                targetTransformVector: new Vector3(0,0,0),
                renderer,
                scene,
                zoom: 15,
                lerpFactor: 0.1,
                offset: new Vector3(0, 25, 25), // 20 units above the player
                mode: 'isometric' // Change to 'orthographic' for Z-only movement
            });
            
            this.camera = followCam.getCamera();
            this.followCam = followCam;

        }

        this.scene.add(this.camera);
        this.gemAnimator = new GemAnimator({ scene : this.scene, camera : this.camera });
        this.axeUpgradeController = new AxeUpgradeController({ camera : this.camera });

        this.timeoutID = setTimeout( ()=>{ 
            this.followCam.setNewTarget( this.player.sphereMesh.position );
        } , 2000 );

        // Handle window resize or rotation
        this.boundResizeListener = this.onResize.bind( this );

        // do initial fov calc
        this.boundResizeListener();

        // this timeout is to allow transitioning width / height to be calculated before FOV calculation is made
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.boundResizeListener(), 10);
        });

        this.renderer.render(this.scene, this.camera);
    }

    onResize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;

        // Choose a base horizontal FOV (in degrees)
        const horizontalFOV = isPortrait() ? 35 : 80; 

        // Convert to vertical FOV based on aspect
        const verticalFOV = 2 * Math.atan(Math.tan(MathUtils.degToRad(horizontalFOV) / 2) / aspect);
        this.camera.fov = MathUtils.radToDeg(verticalFOV);
        this.camera.aspect = aspect;
        
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        if( this.uiController ) this.uiController.onResize();       
        if( this.hintManager ) this.hintManager.onResize();
    }

    // skeletonsEnabled = false;
    setupEnvironmentMap(renderer, scene) {
        // Create a cube render target for the environment map
        const cubeRenderTarget = new WebGLCubeRenderTarget(256, {
            generateMipmaps: true,
            minFilter: 3, // LinearMipmapLinearFilter
            magFilter: 1  // LinearFilter
        });

        // Create a cube camera to capture the environment
        const cubeCamera = new CubeCamera(0.1, 1000, cubeRenderTarget);
        scene.add(cubeCamera);

        // Create a simple gradient environment scene
        const envScene = new Scene();
        
        // Create gradient background using scene.background with colors
        // Sky gradient: light blue to darker blue
        const skyColor = new Color(0xFFFFFF); // Sky blue
        const horizonColor = new Color(0x4682B4); // Steel blue
        const groundColor = new Color(0x8FBC8F); // Dark sea green
        
        // Create a simple sphere geometry for the environment
        const envGeometry = new SphereGeometry(500, 32, 16);
        const envMaterial = new MeshBasicMaterial({
            vertexColors: true,
            side: 2 // BackSide
        });

        // Add vertex colors for gradient effect
        const colors = [];
        const positions = envGeometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const normalizedY = (y + 500) / 1000; // Normalize to 0-1
            
            let color;
            if (normalizedY > 0.5) {
                // Upper hemisphere - sky gradient
                const factor = (normalizedY - 0.5) * 2;
                color = skyColor.clone().lerp(new Color(0x4169E1), factor); // Royal blue at top
            } else {
                // Lower hemisphere - ground gradient
                const factor = normalizedY * 2;
                color = groundColor.clone().lerp(horizonColor, factor);
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        envGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        
        const envSphere = new Mesh(envGeometry, envMaterial);
        envScene.add(envSphere);

        // Render the environment map
        cubeCamera.position.set(0, 0, 0);
        cubeCamera.update(renderer, envScene);

        // Set the environment map on the main scene
        scene.environment = cubeRenderTarget.texture;
        
        // Store references for potential cleanup
        this.cubeCamera = cubeCamera;
        this.cubeRenderTarget = cubeRenderTarget;
        this.envScene = envScene;
    }

    // await layout complete callback as we'll need the adjusted world transforms for the lumbermill, trees and workshop for sensors
    onLayoutComplete()
    {
        // grab all the trees and make zones using their positions 
        const matches = [];
        this.scene.traverse(child => {
            // the second condition ( child.parent == this.scene ) prevents spawing a zone if the Tree has a child called Tree in the model
            // I think thats whats happening anyhow.. child.parent logs as Group instaed of Scene and we dont want those
            if (child.name === "Tree" && child.parent == this.scene ) {
                matches.push(child);
            }
        });
        
        const treeConfigs = [];
        matches.forEach(element => {
            // we need to convert Threes Vector3 to Cannons Vec3
            const config = { position: new Vec3(element.position.x, element.position.y, element.position.z) }
            treeConfigs.push( config );
        });
        
        // trees 
        this.trees = [];

        treeConfigs.forEach(element => {
            const tz = new TreeZone( {
                world : this.world,
                scene : this.scene,
                position: element.position,
                radius: 3,
                playerBody: this.player.sphereBody,
                sensorType: "tree"
            });            
            this.trees.push( tz );
        });

        this.treesTargetValueIndicator = new TargetValueIndicator({ 
            scene : this.scene,
            textureRef:bubble_wood,
            target: new Vec3(-3.5, 0, -25),
            yOffset:4,
            defaultText : getParamsNumberByID("woodNeeded")
        })

        this.treeHintVector =  new Vec3(-3.5, 0, -25) ;
        this.player.setHintVector( this.treeHintVector );

        // lumbermill zonenew 
        const lumberMillZone = new LumberMillZone({
            world : this.world,
            scene : this.scene,
            position: new Vec3(-5, 0.5, 5),
            radius: 5,
            playerBody: this.player.sphereBody,
            sensorType: "lumbermill"
        });
        this.lumberMillZone = lumberMillZone;


        // workshop
        this.workshop = new WorkshopController({ 
            scene:this.scene , 
            world:this.world, 
            playerBody: this.player.sphereBody,
            sensorType: "workshop"
         })
        
        this.followCam.setNewTarget( this.workshop.parentObj.position );


        
        // init skeletons
        if(params.skeletons.value){

            this.boundOnSkeletonEvent = this.onSkeletonEvent.bind(this);
            
           
            const skeletonConfigs = [
                { position : new Vector3(0, 1, -8) },
                { position : new Vector3( 8, 1, -4) },
                { position : new Vector3(-8, 1, -4) },
            ]

            skeletonConfigs.forEach(element => {
                const sc = new SkeletonController({
                        world: this.world,
                        scene: this.scene,
                        position: element.position,
                        rotation: new Quaternion(0, 0, 0, 1), // Adjust as needed
                        player: this.player,
                        audioController: this.audioController
                    });
                    sc.addEventListener('skeleton_event', this.boundOnSkeletonEvent );
                    this.skeletonControllers.push( sc );
            });

            // this.Skeleton0 = new SkeletonController({
            //     world: this.world,
            //     scene: this.scene,
            //     position: new Vector3(0, 3, 0), // Adjust as needed
            //     rotation: new Quaternion(0, 0, 0, 1), // Adjust as needed
            //     player: this.player
            // });

            // this.Skeleton1 = new SkeletonController({
            //     world: this.world,
            //     scene: this.scene,   
            //     position: new Vector3(5, 0, 0), // Adjust as needed
            //     rotation: new Quaternion(0, 0, 0, 1), // Adjust
            //     player: this.player
            // });

            // this.skeleton2 = new SkeletonController({
            //     world: this.world,
            //     scene: this.scene,
            //     position: new Vector3(-5, 0, 0), // Adjust as needed
            //     rotation: new Quaternion(0, 0, 0, 1), // Adjust
            //     player: this.player
            // });
        }

        this.sensorsController = new SensorsController({ 
            applicationModel : this.applicationModel,
            trees : this.trees,
            lumbermill : lumberMillZone,
            workshop : this.workshop
        })

        this.sensorsController.addEventListener( "sensor_event" , this.boundOnSensorEvent );
    }

    destroyLevelAfterStep = false;
    fixedTimeStep = 1.0 / 60.0; // seconds
    maxSubSteps = 3;
    update( dt ) {
        // this.player.setInput(this.joystickInput.x, this.joystickInput.y, this.joystickInput.rotation);
        // this.player.update(dt);
        this.axeUpgradeController.update(dt);
        this.hintManager.update( dt );
        this.gemAnimator.update( dt );

        // Update skeletons
        // if( params.skeletons.value ) {
        //     if (this.Skeleton0) this.Skeleton0.update(dt);
        //     if (this.Skeleton1) this.Skeleton1.update(dt);
        //     if (this.skeleton2) this.skeleton2.update(dt);
        // }

        this.skeletonControllers.forEach(element => {
            element.update(dt);
        });

        if( this.trees ) {
            this.trees.forEach(element => {
                element.update();            
            });
        }
        
        if( this.treesTargetValueIndicator ) this.treesTargetValueIndicator.update();
        if( this.lumberMillZone ) this.lumberMillZone.update();
        if( this.workshop ) this.workshop.update( dt );
        if( this.uiController ) this.uiController.update( dt );

        this.followCam.update();
        if( this.world ) this.world.step( this.fixedTimeStep, dt, this.maxSubSteps);

        // update player AFTER world step to avoid jitters
        this.player.setInput(this.joystickInput.x, this.joystickInput.y, this.joystickInput.rotation);
        this.player.update(dt);

        // Update debug visualization
        //this.cannonDebugRenderer.update();
        this.renderer.render( this.scene, this.camera );
    }


    //////////////////////////////////////////////////////////////////////////////////// EVENT HANDLERS 
    onSensorEvent( e )
    {
        // tree or lumbermill
        const sensorType = e.sensorType;
        const enter = e.enter;
        if( sensorType == "tree")
        {
            if( enter ) this.player.startChopping();
            else this.player.stopChopping();
        }

        if( enter && sensorType == "workshop")
        {

            //screenToWorld(window.innerWidth, 0, this.camera, zDistance)

            // console.log("player entered workshop sensor gems: ",  this.applicationModel.gemCount , getParamsNumberByID("gemsNeeded"))
            // if( this.applicationModel.gemCount >= getParamsNumberByID("gemsNeeded") )
            // {
            //     this.workshop.reveal();
            //     this.workshop.disable();
            //     this.uiController.onWin();

            //     if( this.timeoutID > -1 ) clearTimeout( this.timeoutID );
            //     setTimeout( ()=>{ this.onSceneComplete() } , 3000 );

            //     const winSFX = this.loadedAudioByRef[ "sfx_quest_win" ];
            //     winSFX.play();
                
            // }
        }
    }

    onModelEvent( e )
    {
        //console.log("on model event ", e  );
        let gemSFX;
        switch( e.detail )
        {
            case "unlock_axe":
                console.log("unlock axe");
                this.player.upgradeAxe();
                this.axeUpgradeController.show( 4000 );

                const upgradeSFX = this.audioController.play("sfx_skillcheck_success_01");

                break;

            case "unlock_workshop":
                this.workshop.unlock();
                this.followCam.setNewTarget( this.workshop.parentObj.position );
                this.player.setHintVector( this.workshop.parentObj.position );

                if( this.timeoutID > -1 ) clearTimeout( this.timeoutID );
                this.timeoutID = setTimeout( ()=>{ this.followCam.setNewTarget( this.player.sphereMesh.position ) } , 2000 );
                
                const unlockSFX = this.audioController.play("sfx_skillcheck_success_01");
                
                break;
            case "log_collected":
                if(  this.sensorsController.currentTreeSensor ) this.player.playLogCollectionAnim( this.sensorsController.currentTreeSensor.body );
                this.uiController.updateUI();
                this.player.setHintVector( this.lumberMillZone.model.position );
                break;
            
            case "lumbermill_tick":
                this.player.playLoseLogAnim( this.lumberMillZone.model.position );
                this.uiController.updateUI();
                this.gemAnimator.from3Dto2D( this.lumberMillZone.model.position );
                
                this.player.setHintVector( this.treeHintVector );
                
                
                gemSFX = this.audioController.play("sfx_reward_xp_fly_01");

                this.lumberMillZone.updateTargetIndicatorText( Math.max( getParamsNumberByID("gemsNeeded") - this.applicationModel.gemCount , 0 ))

                break;

            case "workshop_tick":
                this.uiController.updateUI();
                this.gemAnimator.fromTopRightTo3D( this.workshop.parentObj.position );
                
                gemSFX = this.audioController.play( "sfx_reward_xp_fly_01" );

                this.workshop.updateTargetIndicatorText( Math.max( this.applicationModel.workshopGemsNeeded , 0 ))

                break;

            case "reveal_workshop":
                this.workshop.reveal();
                this.workshop.disable();
                this.uiController.onWin();

                // turn off tick interval
                this.sensorsController.disable();

                if( this.timeoutID > -1 ) clearTimeout( this.timeoutID );
                setTimeout( ()=>{ this.onSceneComplete() } , 5000 );

                const winSFX = this.audioController.play( "sfx_quest_win" );
                break;
        }
    }

    onPlayerEvent( e ){
        //console.log("on player event ", e  );
        switch( e.detail )
        {
            case "axe_chop_complete":
                this.applicationModel.onLogCollected();
                if( this.applicationModel.logCount >= getParamsNumberByID("backpackSize") ) this.player.stopChopping();
                this.uiController.updateUI();
                break;
        }
    }

    onSkeletonEvent( e ){
        //console.log("on skeleton event ", e  );
        const numLogsToLose = this.applicationModel.onSkeletonAttack();
        this.player.DropMultipleLogs( numLogsToLose );
    }
    //////////////////////////////////////////////////////////////////////////////////// END EVENT HANDLERS 
}

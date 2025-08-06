import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import { Barrell } from '../../media/Barrell.glb.js';
import { Bench } from '../../media/Bench.glb.js';
import { Bucket } from '../../media/Bucket.glb.js';
import { Bush } from '../../media/Bush.glb.js';
import { Crate } from '../../media/Crate.glb.js';
import { Crate_V2 } from '../../media/Crate_V2.glb.js';
import { Crystal_01 } from '../../media/Crystal_01.glb.js';
import { Crystal_02 } from '../../media/Crystal_02.glb.js';
import { Gate } from '../../media/Gate.glb.js';
import { Gearshop } from '../../media/Gearshop.glb.js';
import { Grass } from '../../media/Grass.glb.js';
import { Ground } from '../../media/Ground.glb.js';
import { Hero_avatar } from '../../media/Hero_avatar.glb.js';
import { Hill } from '../../media/Hill.glb.js';
import { House_blue } from '../../media/House_blue.glb.js';
import { House_red } from '../../media/House_red.glb.js';
import { Lumbermill } from '../../media/Lumbermill.glb.js';
import { Ladder } from '../../media/Ladder.glb.js';
import { Log_pile } from '../../media/Log_pile.glb.js';
import { Log_Single } from '../../media/Log_Single.glb.js';
import { rattle } from '../../media/rattle.mp3.js';
import { reveal } from '../../media/reveal.mp3.js';
import { Skeleton } from '../../media/Skeleton.glb.js';
import { Table } from '../../media/Table.glb.js';
import { Tower } from '../../media/Tower.glb.js';
import { Tower_V2 } from '../../media/Tower_V2.glb.js';
import { Tree } from '../../media/Tree.glb.js';
import { Tree_cluster } from '../../media/Tree_cluster.glb.js';
import { unwrap } from '../../media/unwrap.mp3.js';
import { Wall } from '../../media/Wall.glb.js';
import { Wall_V2 } from '../../media/Wall_V2.glb.js';
import { Windmill } from '../../media/Windmill.glb.js';
import { MathUtils, MeshBasicMaterial, MeshStandardMaterial, Object3D, Quaternion, Vector3, Color, BackSide, FrontSide } from 'three';
import { Group } from '@tweenjs/tween.js';

const modelMap = {
    Barrell : Barrell,
    Bench : Bench,
    Bucket : Bucket,
    Bush : Bush,
    Crate : Crate,
    Crate_V2 : Crate_V2,
    Crystal_01 : Crystal_01,
    Crystal_02 : Crystal_02,
    Gate : Gate,
    Gearshop : Gearshop,
    Grass : Grass,
    Ground : Ground,
    Hero_avatar : Hero_avatar,
    Hill : Hill,
    House_blue : House_blue,
    House_red : House_red,
    Lumbermill : Lumbermill,
    Ladder : Ladder,
    Log_pile : Log_pile,
    Log_Single : Log_Single,
    rattle : rattle,
    reveal : reveal,
    Skeleton : Skeleton,
    Table : Table,
    Tower : Tower,
    Tower_V2 : Tower_V2,
    Tree : Tree,
    Tree_cluster : Tree_cluster,
    unwrap : unwrap,
    Wall : Wall,
    Wall_V2 : Wall_V2,
    Windmill : Windmill
}

const zOffset = 40; // offset for the layout parent object
let completeCallback;
let assetCtr = 0;
let loadedCtr = 0;

export function layoutSceneHelper( { data, scene, onCompleteCallback } )
{
    completeCallback = onCompleteCallback;
    const loader = new GLTFLoader();

    const layoutParent = new Object3D();
    layoutParent.position.set( 0, 0, zOffset );
    layoutParent.scale.set( 1, 1, -1 );
    layoutParent.rotation.set(
            MathUtils.degToRad(0), 
            MathUtils.degToRad(90), 
            MathUtils.degToRad(0)
        );
    scene.add( layoutParent );

    data.Meshes.forEach(element => {
       
        let classToLoad = modelMap[element.Name];
        if( !classToLoad )
        {
            console.warn("No model found for json item", element.Name);
            return;
        } 

        assetCtr++;
        loader.load(
            classToLoad, 
            ( e )=>{
                onLoad( e , scene, layoutParent, element );
            },                   
            undefined, 
            (e) => { console.error("error loading model", e); }
        ); 

    });
}

function onLoad( e, scene, layoutParent,  element  )
{
    loadedCtr++;
    element.instances.forEach( instance => {
        const clone = e.scene.clone();
        layoutParent.add( clone );  

        clone.position.set( instance.position[0] , instance.position[1], instance.position[2])
        clone.rotation.set( 
            MathUtils.degToRad(instance.rotation[0]), 
            MathUtils.degToRad(instance.rotation[1]), 
            MathUtils.degToRad(instance.rotation[2])
        )
        if (instance.scale) {
            clone.scale.set(
                instance.scale[0],
                instance.scale[1],
                instance.scale[2]
            );
        }

        //set the mesh to cast shadows and use MeshStandardMaterial
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                console.log("Setting castShadow and receiveShadow for", element.Name, child.name);
                // Replace MeshBasicMaterial with MeshStandardMaterial for better quality
                //if (child.material && child.material.type === 'MeshBasicMaterial') {
                {
                const oldMat = child.material;
                    console.log("Replacing MeshBasicMaterial with MeshStandardMaterial for", element.Name, child.name);
                    if (element.Name === "Gearshop"){
                        // Create yellow outline by duplicating the mesh
                        const outlineMesh = child.clone();
                        outlineMesh.material = new MeshBasicMaterial({
                            color: new Color(1, 1, 0), // Yellow
                            side: FrontSide,
                            depthTest: true,
                            depthWrite: true,
                        });
                        outlineMesh.scale.multiplyScalar(1.05); // Make larger for outline
                        
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
                    }else {
                        child.material = new MeshStandardMaterial({
                        map: oldMat.map,
                        color: oldMat.color,
                        side: oldMat.side,
                        roughness: 0.3,
                        metalness: 0.1
                    });
                    }
                }
            }
        });

        // so we can grab a reference to it later e.g. Lumbermill, Workshop, Tree etc
        clone.name = element.Name;

        if( element.Name == "Tree")
        {
            // console.log( "pre world pos = " , instance.position );
        }

        // Step 2: Force world matrix update
        clone.updateMatrixWorld(true);

        // Step 3: Capture world transform
        const worldPos = new Vector3();
        const worldQuat = new Quaternion();
        const worldScale = new Vector3();

        clone.matrixWorld.decompose(worldPos, worldQuat, worldScale);

        // Step 4: Remove from current parent
        layoutParent.remove(clone);

        // Step 5: Reparent to grandparent (scene)
        scene.add(clone);

        // Step 6: Apply world transform back
        clone.position.copy(worldPos);
        clone.quaternion.copy(worldQuat);
        clone.scale.copy(worldScale);

        if( element.Name == "Tree")
        {
            //console.log( "post world pos = " , clone.position );
        }

        clone.updateMatrixWorld(true);
    });

    if( loadedCtr == assetCtr ) completeCallback();
}

export function getWorldFromLocalPhysicsTransforms( { data , scene } )
{
    const transforms = [];
    const layoutParent = new Object3D();
    layoutParent.position.set( 0, 0, zOffset );
    layoutParent.scale.set( 1, 1, -1 );
    layoutParent.rotation.set(
            MathUtils.degToRad(0), 
            MathUtils.degToRad(90), 
            MathUtils.degToRad(0)
        );
    scene.add( layoutParent );

    layoutParent.updateMatrixWorld(true);

    data.Meshes.forEach(element => { 
        if( element.Name == "PhysicsBarrier" )
        {
            element.instances.forEach( instance => {

                const clone = new Object3D();
                clone.position.set( instance.position[0] , instance.position[1], instance.position[2])
                clone.rotation.set( 
                    MathUtils.degToRad(instance.rotation[0]), 
                    MathUtils.degToRad(instance.rotation[1]), 
                    MathUtils.degToRad(instance.rotation[2])
                )
                if (instance.scale) {
                    clone.scale.set(
                        instance.scale[0],
                        instance.scale[1],
                        instance.scale[2]
                    );
                }
                
                layoutParent.add( clone );

                // Step 2: Force world matrix update
                clone.updateMatrixWorld(true);

                // Step 3: Capture world transform
                const worldPos = new Vector3();
                const worldQuat = new Quaternion();
                const worldScale = new Vector3();

                clone.matrixWorld.decompose(worldPos, worldQuat, worldScale);

                // Step 4: Remove from current parent
                layoutParent.remove(clone);

                // Step 5: Reparent to grandparent (scene)
                scene.add(clone);

                // Step 6: Apply world transform back
                clone.position.copy(worldPos);
                clone.quaternion.copy(worldQuat);
                clone.scale.copy(worldScale);

                clone.updateMatrixWorld(true);

                transforms.push({
                    position: worldPos.clone(),
                    rotation: worldQuat.clone(),
                    scale: worldScale.clone()
                });
            });
        }
    });

    return transforms;
       
}
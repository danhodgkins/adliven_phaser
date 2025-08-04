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
import { MathUtils, Object3D, Quaternion, Vector3 } from 'three';
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

export function layoutSceneHelper( { data, scene } )
{
    const loader = new GLTFLoader();

    const layoutParent = new Object3D();
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
    });
}

export function getWorldFromLocalPhysicsTransforms( { data , scene } )
{
    const transforms = [];
    const layoutParent = new Object3D();
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
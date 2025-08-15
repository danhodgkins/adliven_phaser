import { EventDispatcher } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default class StackableAnimator extends EventDispatcher
{
    constructor({ scene, launchableAsset, scale })
    {
        super();
        this.scene = scene;
        const loader = new GLTFLoader();
        loader.load(
            launchableAsset,
            (gltf) => {
                gltf.scene.scale.copy( scale );
                this.launchableMeshTemplate = gltf.scene;
            },
            undefined,
            (error) => {
                console.error(`Error loading ${ launchableAsset } GLB for back:`, error);
            }
        );

        this.activeLaunchables = [];
        this.boundOnLaunchableComplete = this.onLaunchableComplete.bind( this );
    }

    launchItem( origin, destination, data )
    {
        const newLaunchableMesh = this.launchableMeshTemplate.clone();
        const launchableItem = new LaunchableItem({ 
            origin, 
            destination, 
            data,
            mesh : newLaunchableMesh,
            onComplete : this.boundOnLaunchableComplete
         })

        this.scene.add( newLaunchableMesh );
        this.activeLaunchables.push( launchableItem );
    }

    onLaunchableComplete( launchableToDelete )
    {
        this.activeLaunchables.splice( this.activeLaunchables.indexOf( launchableToDelete ) , 1);
        this.dispatchEvent( { type: 'launch_complete', launchable: launchableToDelete }  );

        // remove mesh from scene
        const mesh = launchableToDelete.mesh;
        this.scene.remove( mesh );
        mesh.traverse((child) => {
            
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    }

    update( dt )
    {
        this.activeLaunchables.forEach(element => {
            element.update( dt );
        });
    }
}

class LaunchableItem{
    constructor({ origin, destination, data, mesh, onComplete })
    {
        this.onComplete = onComplete;
        this.mesh = mesh;
        this.origin = origin;
        this.destination = destination;
        this.data = data;
    }
    
    elapsed = 0;
    peakHeight = 2.0;
    duration = 0.5;
    update( dt )
    {
        this.elapsed += dt;
        let t = Math.min(this.elapsed / this.duration, 1);
        const current = this.origin.clone().lerp(this.destination, t);
        current.y += this.peakHeight * Math.sin(Math.PI * t);
        this.mesh.position.copy(current);
        if( t >= 1 )
        {
            this.onComplete( this );
        } 
    }
}
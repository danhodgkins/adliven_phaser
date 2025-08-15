import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default class StackController {
    constructor({ scene , stackableAsset, parent3DObject, scale})
    {
        this.parent = parent3DObject;
        this.stackedItems = [];
        this.ySpacing = 0.3;
        
        const loader = new GLTFLoader();
        loader.load(
            stackableAsset,
            (gltf) => {
                gltf.scene.scale.copy( scale );
                this.stackableMeshTemplate = gltf.scene;
            },
            undefined,
            (error) => {
                console.error(`Error loading ${ stackableAsset } GLB for back:`, error);
            }
        );
    }

    addItem()
    {
        const newStackable = this.stackableMeshTemplate.clone();
        newStackable.position.set(0, this.stackedItems.length * this.ySpacing, 0); // Adjust Y and Z for stacking
        this.parent.add( newStackable );
        this.stackedItems.push( newStackable );
    }

    removeItem()
    {
        if( this.stackedItems.length <= 0 ) return;

        const stackableToRemove = this.stackedItems.pop();
        this.parent.remove(stackableToRemove);

        stackableToRemove.traverse((child) => {
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
}
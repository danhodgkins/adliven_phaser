export default class BaseScene extends EventTarget{
    constructor({config}) {
        super();
        this.config = config;        
    }

    update() {
        // Override in subclasses
    }

    init()
    {
        
    }

    destroy(){

    }

    onSceneComplete(){
        const event = new CustomEvent("scene_complete", {detail: {
            sceneID: this.sceneID
        }});
        this.dispatchEvent( event );
    }
} 
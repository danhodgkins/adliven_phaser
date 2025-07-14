export default class BaseScene {
    constructor({config}) {
        this.config = config;        
    }

    update() {
        // Override in subclasses
    }
} 
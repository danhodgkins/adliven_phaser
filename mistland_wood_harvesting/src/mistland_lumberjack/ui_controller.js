export class MistlandLumberjackUIController {

    constructor(uiLayerElement) {
        this.uiLayerElement = uiLayerElement;
        this.uiLayerElement.innerHTML = this.splashUIString();
    }

    splashUIString() {
        return `
            <div id="gameOutput">Welcome to Mistland Lumberjack!</div>
        `;
    }
}
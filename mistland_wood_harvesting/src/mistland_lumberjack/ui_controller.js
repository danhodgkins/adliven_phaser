export class MistlandLumberjackUIController {

    constructor(uiLayerElement, applicationModel) {
        this.uiLayerElement = uiLayerElement;
        this.applicationModel = applicationModel;
        //this.uiLayerElement.innerHTML = this.splashUIString()
        this.updateUI();
    }

    updateUI() {
        // Update UI elements based on application model state
        const gameOutput = this.uiLayerElement.querySelector("#gameOutput");
        if (gameOutput) {
            gameOutput.textContent = `Logs: ${this.applicationModel.logCount}`;
        }
    }

    // splashUIString() {
    //     return `
    //         <div id="gameOutput">Welcome to Mistland Lumberjack!</div>
    //     `;
    // }
}
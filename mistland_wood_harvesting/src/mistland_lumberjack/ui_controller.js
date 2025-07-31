export class MistlandLumberjackUIController {

    constructor(uiLayerElement, applicationModel) {
        this.uiLayerElement = uiLayerElement;
        this.applicationModel = applicationModel;
        //this.uiLayerElement.innerHTML = this.splashUIString()
        this.updateUI();
    }

    updateUI() {
        // Update UI elements based on application model state
        const logCountOutput = this.uiLayerElement.querySelector("#logCountOutput");
        if (logCountOutput) {
            logCountOutput.textContent = `Logs: ${this.applicationModel.logCount}`;
        }
                
        const gemCountOutput = this.uiLayerElement.querySelector("#gemCountOutput");
        if (logCountOutput) {
            gemCountOutput.textContent = `Gems: ${this.applicationModel.gemCount}`;
        }
    }

    // splashUIString() {
    //     return `
    //         <div id="gameOutput">Welcome to Mistland Lumberjack!</div>
    //     `;
    // }
}
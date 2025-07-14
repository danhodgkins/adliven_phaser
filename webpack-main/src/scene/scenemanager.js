export default class SceneManager {
    constructor( scenes ) {
        this.scenes = scenes;
    }

    setScene(sceneID) {
        if( this.currentScene ) this.currentSceene.destroy();
        this.currentScene = this.getSceneByID( sceneID );
        this.currentScene.init();
    }

    update() {
        if( this.currentScene ) {
            this.currentScene.update();
        }
    }
    
    getSceneByID( id ) {
        for (const scene of this.scenes) {
            if( scene.config.id === id ) {
                return scene;
            }
        }
    }
}

export default class SceneManager {
    constructor( scenes, parentID ) {
        this.scenes = scenes;
        this.gameParentElement = document.getElementById( parentID );

        scenes.forEach(element => {
            element.addEventListener( "scene_complete", (e) => {

                // hard coded for now
                // const ctaScene = this.getSceneByID("cta");
                this.setScene( "cta" );
            },
            false,
            );
        });
    }

    setScene(sceneID) {
        if( this.currentScene ) this.currentScene.destroy();
        this.gameParentElement.innerHTML = "";

        this.currentScene = this.getSceneByID( sceneID );
        this.currentScene.init();
    }

    update( dt ) {
        if( this.currentScene ) {
            this.currentScene.update( dt );
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

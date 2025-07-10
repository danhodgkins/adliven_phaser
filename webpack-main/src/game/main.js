
const config = {
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
   
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;


export class Game {
    constructor(config) {
        console.log("new game")
    }

    destroy() {
       
    }
}
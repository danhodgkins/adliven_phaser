import BaseScene from "./basescene";

export default class TobyScene extends BaseScene{

    height = 100;

    constructor({config}){
        super({config});
        this.config = config;
        console.log("height " , this.height );
    }

    init(){

    }

    update(){

    }
}
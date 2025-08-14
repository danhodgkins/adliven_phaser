import { Container, Graphics, Text } from "pixi.js";

export default class WinPopup{

    popupWidth = 300;
    popupHeight = 300;
    textMargin = 20;

    constructor({ pixiApp })
    {
        console.log("wtf");
        const onWinPopupContainer = new Container({ });   

        // dynamic text field 
        const winMessage = texts[ params.locale.value ]["winPopup"];
        const tf = new Text(winMessage, {
            fontFamily: 'Arial',
            fontSize: 30,
            fontWeight:"normal",
            fill: 0xffffff,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: this.popupWidth - ( this.textMargin * 2 ) 
        });

        tf.pivot.set(tf.width / 2, tf.height / 2);

        // bg graphic
        const graphics = new Graphics();
        graphics.beginFill(0x000000, 0.2);
        
        const tHeight = tf.height + ( this.textMargin * 2 );
        graphics.drawRoundedRect( 0, 0, this.popupWidth , tHeight , 20);
        graphics.endFill();
        graphics.pivot.set(this.popupWidth / 2, tHeight / 2);
        onWinPopupContainer.addChild(graphics);
        onWinPopupContainer.addChild( tf );
        this.popupContainer = onWinPopupContainer;
        pixiApp.stage.addChild(onWinPopupContainer);

        //hide by default
        this.popupContainer.visible = false;
    }

    show()
    {
        this.popupContainer.visible = true;
    }

    onResize()
    {
        this.popupContainer.x = ( window.innerWidth * 0.5 );
        this.popupContainer.y = ( window.innerHeight * 0.5 );
    }
}
import { Container, Sprite, Text } from "pixi.js";
import { goodjob } from '../../../media/pngs_goodjob.png.js';

export default class WinPopup {

    popupWidth = 300;
    popupHeight = 300;
    textMargin = 20;

    constructor({ pixiApp }) {
        console.log("showing popup");
        const onWinPopupContainer = new Container();

        // Dynamic text field
        const winMessage = texts[params.locale.value]["winPopup"];
        const tf = new Text(winMessage, {
            fontFamily: 'Arial',
            fontSize: 30,
            fontWeight: "normal",
            fill: 0xfff8e4,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: this.popupWidth - this.textMargin * 2,
            dropShadow: true, // Enable drop shadow
            dropShadowColor: '#333333', // Shadow color
            dropShadowBlur: 2, // Blur radius
            dropShadowAngle: Math.PI / 4, // Shadow angle (in radians)
            dropShadowDistance: 3, // Distance of the shadow
        });

        // Use goodjob image as background
        const bgSprite = Sprite.from(goodjob);
        bgSprite.width = this.popupWidth;
        bgSprite.height = tf.height + this.textMargin * 2;

        // Center the background sprite
        bgSprite.anchor.set(0.5); // Use anchor for easier centering
        bgSprite.x = this.popupWidth / 2;
        bgSprite.y = this.popupHeight / 2;

        // Center the text relative to the background
        tf.anchor.set(0.5); // Use anchor for easier centering
        tf.x = bgSprite.x;
        tf.y = bgSprite.y;

        onWinPopupContainer.addChild(bgSprite);
        onWinPopupContainer.addChild(tf);

        // Center the container itself
        onWinPopupContainer.pivot.set(this.popupWidth / 2, this.popupHeight / 2);

        this.popupContainer = onWinPopupContainer;
        pixiApp.stage.addChild(onWinPopupContainer);

        // Hide by default
        this.popupContainer.visible = false;
    }

    show() {
        this.popupContainer.visible = true;
    }

    onResize() {
        // Center the container on the screen
        this.popupContainer.x = window.innerWidth / 2;
        this.popupContainer.y = window.innerHeight / 2;
    }
}
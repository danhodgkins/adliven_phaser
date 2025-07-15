import '../public/style.css'; // at the top
import StartGame from './game/main';

import { unwrapMP3 } from '../media/unwrap.mp3.js';
import {Howl, Howler} from 'howler';


document.addEventListener('DOMContentLoaded', () => {

    StartGame('game-container');

    const testSfx = new Howl({
        src: [ unwrapMP3 ],
        onload : ()=>{
            console.log("testSfx loaded", testSfx);
            //testSfx.play();
        }
    });

    // const ctaButton = document.getElementById('ctaButton');
    // ctaButton.addEventListener('click', () => {
    //     testSfx.play();
    // });
});
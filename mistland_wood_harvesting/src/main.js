import '../public/style.css'; // at the top
import StartGame from './game/main';

// import { unwrapMP3 } from '../media/unwrap.mp3.js';
import {Howl, Howler} from 'howler';


document.addEventListener('DOMContentLoaded', () => {

    StartGame();

    // const testSfx = new Howl({
    //     src: [ unwrapMP3 ],
    //     onload : ()=>{
    //         console.log("testSfx loaded", testSfx);
    //     }
    // });
});
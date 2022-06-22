import { $, $$, globals } from './globals.js'
import Waveform from './waveform.js';
import AudioPlayer from './audioplayer.js';
import Visualizer from './visualizer.js';
import EventManager from './event-manager.js';
import './scss/styles.scss';

const audio = new AudioPlayer('/assets/music.mp3');
const visualizer = new Visualizer(audio);
const eventManager = new EventManager(audio);

document.addEventListener("keydown", e => {
    // e.preventDefault()
    if(e.key === "Delete" || e.key === "Backspace"){
        Waveform.findSelected().forEach(object => {
            object.deleteClip();
        })
    }
    if(e.key == " "){
        if(audio.playing){
            audio.stop()
        }else{
            audio.play();
        }
    }
    console.log(e.key)
})







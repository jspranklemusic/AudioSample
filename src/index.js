import { $, $$, globals } from './globals.js'
import Waveform from './waveform.js';
import AudioPlayer from './audioplayer.js';
import Visualizer from './visualizer.js';
import EventManager from './event-manager.js';
import './scss/styles.scss';
import Module from '../wasm/main.js';
import Track from './track.js';
const getPath = ()=>{
    if(process.env.NODE_ENV == "production"){
        globals.wasmDir = "dist/wasm/";
    }else{
        globals.wasmDir = "../wasm/"
    }
    return globals.wasmDir + " ai"
}


Module.onRuntimeInitialized = ()=> {
    globals.wasmLoaded = true
    window.Module = Module;
};

const audio = new AudioPlayer('/assets/music.mp3');
const visualizer = new Visualizer(audio);
const eventManager = new EventManager(audio);

globals.audioPlayer = audio;

document.addEventListener("keydown", e => {
    // e.preventDefault()
    if(e.key === "Delete" || e.key === "Backspace"){
        Waveform.findSelected().forEach(object => {
            object.deleteClip();
        })
    }
    if(e.key == "-"){
        Track.zoomOut()
    }
    if(e.key == "="){
        Track.zoomIn()
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







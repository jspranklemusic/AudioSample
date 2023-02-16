import { $, $$, globals } from './globals.js'
import Waveform from './waveform.js';
import AudioPlayer from './audioplayer.js';
import Visualizer from './visualizer.js';
import EventManager from './event-manager.js';
import './scss/styles.scss';
import Module from '../wasm/main.js';
import Track from './track.js';
import CustomSelect from './components/custom-select.js';
import WasmBridge from './wasm-bridge.js';


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
    globals.Module = Module;
};

window.globals = globals;
window.WasmBridge = WasmBridge;

const audio = new AudioPlayer('/assets/music.mp3');
const visualizer = new Visualizer(audio);
export const eventManager = new EventManager(audio);
globals.audioPlayer = audio;
globals.eventManager = eventManager;

CustomSelect(".track-info-controls-description",["Master"],{id: "track-select"})

document.addEventListener("keydown", e => {

    // e.preventDefault()
    if(e.key === "Delete" || e.key === "Backspace"){
        Waveform.findSelected().forEach(object => {
            object.deleteClip();
        })
    }
    if(e.key == "-"){
        e.ctrlKey ? Waveform.zoomOut() : Track.zoomOut();
    }
    if(e.key == "="){
        e.ctrlKey ? Waveform.zoomIn() : Track.zoomIn();
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







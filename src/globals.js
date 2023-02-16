export function $(selector){ return document.querySelector(selector) };
export function $$(selector){ return document.querySelectorAll(selector) };
export const allowedAudioFileTypes = ["audio/mpeg","audio/ogg","audio/x-wav"];

export const wasmModules = {

}

export const globals = {
    tracks: {
        currentDragged: [],
    },
    state: {
        stopped: false
    },
    timeline: {
        currentTime: 0,
        grid: false
    },
    channelControl: {  
        width: 140
    },
    Module: {},
    loadingFiles:[],
    initialMouseDown: null,
    tasks: [],
    globalMousemoveFunctions: [],
    pixelsPerSecond: 3,
    cursorPerAnimationFrame: 20,
    allowAutoCursor: false,
    zoom: 2,
    timelineScrollXOffset: 0,
    zoomMax: 50,
    zoomMin: 0.1,
    clipZoom: 0.75,
    clipZoomMax: 3,
    clipZoomMin: 0.2,
    eventManager: {}

}

export function passArrayToWASM(array,instance){
    let myJSArray = new Float32Array(array);
    let myWasmArrayPtr = instance.exports.allocateF32Array(length);
    let myWasmArray = new Float32Array(instance.exports.memory.buffer, myWasmArrayPtr, length);
    myWasmArray.set(myJSArray);

}


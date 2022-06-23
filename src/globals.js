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
    initialMouseDown: null,
    globalMousemoveFunctions: [],
    pixelsPerSecond: 3,
    cursorPerAnimationFrame: 20,
    zoom: 1,
    zoomMax: 100,
    zoomMin: 0.2,
    clipZoom: 1,
    clipZoomMax: 5,
    clipZoomMin: 0.5
}


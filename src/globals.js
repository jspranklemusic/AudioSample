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
    pixelsPerSecond: 2.99684239303,
    cursorPerAnimationFrame: 1/20.0210728931,
    zoom: 2,
    zoomMax: 40,
    zoomMin: 0.2,
}


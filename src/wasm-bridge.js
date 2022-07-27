import { globals } from "./globals";

class WasmBridge {
    static drawToCanvas(canvasElement){
        canvasElement.id = "canvas";
        globals.Module.canvas = canvasElement;
        globals.Module.interactWithCanvas("canvas");
    }
    static emscriptenArray(len) {
        var ptr = globals.Module._malloc(len * 4);
        var arr = new Float32Array(globals.Module.HEAPF32.buffer, ptr, len);
        return [arr, ptr];
    }
    static addBuffer(bufferL,bufferR){
        globals.Module.getBuffer("canvas",bufferL);
    }
}

export default WasmBridge;
import Waveform from "./waveform.js";
import { $ } from "./globals.js";

class EventManager {
    constructor(audio){
        $("#tracks").onmousedown = e => audio.setCursor(e,"tracks");
        $("#timeline").onmousedown = e => audio.setCursor(e);
        // menu
        $("#load").onclick = ()=> audio.loadNew();
        $('#start').onclick = () => audio.play();
        $('#stop').onclick = () => audio.stop();
        $("#log-gain").onclick = () => audio.log();
        $("#fadeout").onclick = () => audio.fadeout();
        $("#fileinput").onchange = e => audio.processNew(e);
        // volume panning
        $("#volume").oninput = e => audio.setMasterVolume(e);
        $("#panning").oninput = e => audio.setMasterPanning(e);
        // compressor
        $("#compressor-threshold").oninput = e => audio.setMasterCompressor(e,"threshold");
        $("#compressor-ratio").oninput = e => audio.setMasterCompressor(e,"ratio");
        $("#compressor-attack").oninput = e => audio.setMasterCompressor(e,"attack");
        $("#compressor-release").oninput = e => audio.setMasterCompressor(e,"release");
        $("#compressor-knee").oninput = e => audio.setMasterCompressor(e,"knee");
        // eq
        $("#eq-lowshelf").oninput = e => audio.setMasterEQ(e,"lowshelf");
        $("#eq-low").oninput = e => audio.setMasterEQ(e,"low");
        $("#eq-mid").oninput = e => audio.setMasterEQ(e,"mid");
        $("#eq-high").oninput = e => audio.setMasterEQ(e,"high");
        $("#eq-highshelf").oninput = e => audio.setMasterEQ(e,"highshelf");
    }
}

export default EventManager;
import { $ } from './globals.js'
import Waveform from './waveform.js';
import AudioPlayer from './audioplayer.js';
import Visualizer from './visualizer.js';

const audio = new AudioPlayer('../music.mp3');
const visualizer = new Visualizer(audio);

// track
$("#tracks").ondragover = e => Waveform.dragPosition(e);
$("#tracks").onmousedown = e => Waveform.mousePosition(e);
// menu
$("#load").onclick = ()=> audio.loadNew();
$('#start').onclick = () => audio.play();
$('#stop').onclick = () => audio.stop();
$("#log-gain").onclick = () => audio.log();
$("#fadeout").onclick = () => audio.fadeout();
$("#fileinput").onchange = e => audio.processNew(e);
// volume panning
$("#volume").oninput = e => audio.setVolume(e);
$("#panning").oninput = e => audio.setPanning(e);
// compressor
$("#compressor-threshold").oninput = e => audio.setCompressor(e,"threshold");
$("#compressor-ratio").oninput = e => audio.setCompressor(e,"ratio");
$("#compressor-attack").oninput = e => audio.setCompressor(e,"attack");
$("#compressor-release").oninput = e => audio.setCompressor(e,"release");
$("#compressor-knee").oninput = e => audio.setCompressor(e,"knee");
// eq
$("#eq-lowshelf").oninput = e => audio.setEQ(e,"lowshelf");
$("#eq-low").oninput = e => audio.setEQ(e,"low");
$("#eq-mid").oninput = e => audio.setEQ(e,"mid");
$("#eq-high").oninput = e => audio.setEQ(e,"high");
$("#eq-highshelf").oninput = e => audio.setEQ(e,"highshelf");



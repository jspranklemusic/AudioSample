import { $, allowedAudioFileTypes, globals } from './globals.js'
import Waveform from './waveform.js';

class AudioPlayer{
    cursorPosition = 0;
    timelineInterval = null
    loadingQueue = []
    constructor(url) {
        // const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        this.context = context;
        this.context.suspend();
        this.rootNode = context.destination;
        this.reader = new FileReader();
        this.audioFiles = [];
        this.reader.addEventListener("load", e =>{
            this.onReaderComplete();
        })
        // analyser
            this.initializeAnalyser(context,context.destination);  
        // gain
            this.initializeGain(context,this.analyser);
        // compressor
            this.initializeCompressor(context,this.gainNode)
        // panning
            this.initializeStereoPan(context,this.compressorNode)
        // filter (eq)
            this.initializeEQ(context,this.stereoPanner);

        if(url){
            this.url = url;
        }
    }

    analyse(){
        const dataArray = new Uint8Array(this.bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        dataArray.forEach(byte => console.log(byte));
        return dataArray;
    }
    initializeStereoPan(context,node){
        this.stereoPanner = new StereoPannerNode(context);
        this.stereoPanner.connect(node);
        this.rootNode = this.stereoPanner;
    }
    initializeGain(context,node){
        this.gainNode = context.createGain();
        this.gainNode.gain.value = 0.5;
        this.gainNode.connect(node);
        this.rootNode = this.gainNode;
    }
    initializeAnalyser(context,node){
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.9;
        analyser.minDecibels = -140;
        analyser.maxDecibels = -0;
        this.bufferLength = analyser.frequencyBinCount;
        this.analyser = analyser;
        this.rootNode = analyser;
        this.analyser.connect(node);
    }
    initializeEQ(context,node){
        const lowshelf = new BiquadFilterNode(context, { type: "lowshelf", frequency: 100 } );
        const low = new BiquadFilterNode(context, { type: "peaking", frequency: 250 } );
        const mid = new BiquadFilterNode(context, { type: "peaking", frequency: 1000 } );
        const high = new BiquadFilterNode(context, { type: "peaking", frequency: 5000 } );
        const highshelf = new BiquadFilterNode(context, { type: "highshelf", frequency: 8000 } );
        lowshelf.connect(node);
        low.connect(lowshelf);
        mid.connect(low);
        high.connect(mid);
        highshelf.connect(high);
        this.filter = { lowshelf, low, mid, high, highshelf }; 
        this.rootNode = highshelf;
    }
    initializeCompressor(context,node){
        const compressor = new DynamicsCompressorNode(context);
        compressor.attack.value = $("#compressor-attack").value;
        compressor.release.value = $("#compressor-release").value;
        compressor.threshold.value = $("#compressor-threshold").value;
        compressor.ratio.value = $("#compressor-ratio").value;
        compressor.knee.value = $("#compressor-knee").value;
        compressor.connect(node);
        this.compressorNode = compressor;
        this.rootNode = compressor;
    }
    // load audio if none, play audio, set appropriate visualizations
    async play(){
        if(!this.audioFiles.length){
            await this.loadAudio(this.url);
        }
        this.audioFiles.forEach(file => {
            if(!file.source.started){
                file.source.started = true
                file.source.start(this.context.currentTime,0);
            }
        })
        globals.state.stopped = false;
        // move the cursor
        const moveCursor = (a,b,c)=> {
            if(!globals.state.stopped){
                requestAnimationFrame(moveCursor)
                this.cursorPosition += globals.cursorPerAnimationFrame;
                $("#cursor").style.transform = `translateX(${this.cursorPosition}px)`;
                let currentTime = this.context.currentTime
                let content = (Math.floor(currentTime*100)/100+"").replace(".",":");
                if(currentTime < 10){
                    content = "00:0"+content
                }
                $("#numbers").textContent = content;
            }
        }
        requestAnimationFrame(moveCursor);
        // set an interval for timeline
        this.context.resume();
        // start the context again

        console.log({
            context: this.context.currentTime,
            timeline: globals.timeline.currentTime
        })
    }
    // suspend the audio context
    stop(){
        globals.state.stopped = true;
        this.context.suspend();
        console.log({
            context: this.context.currentTime,
            timeline: globals.timeline.currentTime
        })
    }
    setVolume(e){
        if(e){
            this.gainNode.gain.value = parseFloat(e.target.value);
            $("#volume-display").textContent = e.target.value;
        }
    }
    setEQ(e,frequency){
        if(e){
            this.filter[frequency].gain.value = parseFloat(e.target.value);
            $("#"+frequency+"-display").textContent = e.target.value;
        }
    }
    setPanning(e){
        if(e){
            this.stereoPanner.pan.value = parseFloat(e.target.value);
            $("#panning-display").textContent = e.target.value;
        }
    }
    setCompressor(e,parameter){
        if(e){
            this.compressorNode[parameter].value = parseFloat(e.target.value);
            $("#"+parameter+"-display").textContent = e.target.value;
            console.log(this.compressorNode);
        }
    }
    fadeout(){
        var itvl = setInterval(()=>{
            this.gainNode.gain.value -= 0.01;
            if(this.gainNode.gain.value <= 0){
                clearInterval(itvl);
                this.stop();
            }
  
        },10);
    }
    fadein(){
        this.gainNode.gain.value = 0;
        var itvl = setInterval(()=>{
            this.gainNode.gain.value += 0.005;
            if(this.gainNode.gain.value >= 0.5){
                clearInterval(itvl);
            }
        },10);
    }
    log(){
      this.analyse();
    }
    loadNew(){
        $("#fileinput").click();
    }
    // to process, it sends file to file ready where it gets turned into array buffer
    processNew(e){
        if(e){
            this.loadingQueue = [...e.target.files]
        }
        const file = this.loadingQueue[0]
        if(!allowedAudioFileTypes.includes(file.type)){
            throw new Error("Must be a valid audio file.");
        }else{
            this.loadingQueue.shift();
            this.reader.readAsArrayBuffer(file);
        }
    }
    // when the reader is done, it checks for more files
    onReaderComplete(){
        this.loadToQueue(this.reader.result);
        if(this.loadingQueue.length > 0){
            this.processNew();
        }
    }

    async loadToQueue(buffer){
        const source = this.context.createBufferSource();
        source.buffer = await this.context.decodeAudioData(buffer);
        source.connect(this.rootNode);
        const waveform = new Waveform(this);
        waveform.drawWaveform(source.buffer);
        this.audioFiles.push({source, waveform});
    }

    async loadAudio(url){
        this.url = url;
        this.source = this.context.createBufferSource();
        this.source.connect(this.rootNode);
        this.audioBuffer = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(ArrayBuffer => this.context.decodeAudioData(ArrayBuffer));
        this.source.buffer = this.audioBuffer;
        const waveform = new Waveform(this);
        waveform.drawWaveform(this.source.buffer);
        this.audioFiles.push({source: this.source, waveform});
    }
}

export default AudioPlayer;
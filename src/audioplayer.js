import { $, allowedAudioFileTypes, globals } from './globals.js'
import Waveform from './waveform.js';

class AudioPlayer{
    cursorPosition = 0;
    timelineInterval = null
    loadingQueue = []
    tracks = [{}]
    cursorOffset = 0;
    constructor(url) {
        // const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        this.context = context;
        this.context.suspend();
        this.rootNode = context.destination;
        this.reader = new FileReader();
        this.audioFiles = [];
        this.reader.addEventListener("load", e =>{
            console.log(e);
            this.onReaderComplete();
        })
        // construct timeline marks
        let n = 0;
        const timeline = $("#timeline");
        for(let i = 0; i < timeline.offsetWidth; i += (globals.pixelsPerSecond*10)){
            const span = document.createElement("span");
            span.style =`
                display: block;
                position: absolute;
                left: ${i}px;
                font-size: 10px;
                height: 100%;
                padding-left: 2px;
                margin-left: -2px;
                border-left: 1px solid rgb(200,200,200);
                user-select: none;
            `
            
            timeline.appendChild(span);
            if(!(n%60)){
                span.style.fontWeight = "bold";
                span.style.borderLeft = "2px solid black"
                span.innerText = n/60+"m";
            }else{
                span.innerText = n%60+"s";
        
            }
            n += 10;
        
        }

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

    buildChannelEffectsChain(source){
        // build the nodes
            const stereoPanner = new StereoPannerNode(this.context);
            const gainNode = new GainNode(this.context)
            const lowshelf = new BiquadFilterNode(this.context, { type: "lowshelf", frequency: 100 } );
            const low = new BiquadFilterNode(this.context, { type: "peaking", frequency: 250 } );
            const mid = new BiquadFilterNode(this.context, { type: "peaking", frequency: 1000 } );
            const high = new BiquadFilterNode(this.context, { type: "peaking", frequency: 5000 } );
            const highshelf = new BiquadFilterNode(this.context, { type: "highshelf", frequency: 8000 } );
            const compressor = new DynamicsCompressorNode(this.context);
        // defaults
            compressor.ratio.value = 1;
            gainNode.gain.value = 0.5;
        // make connections
            source.connect(highshelf);
            highshelf.connect(high);
            high.connect(mid);
            mid.connect(low);
            low.connect(lowshelf);
            lowshelf.connect(compressor);
            compressor.connect(stereoPanner)
            stereoPanner.connect(gainNode);
            gainNode.connect(this.rootNode);
        // save references to nodes as variables
            source.tailNode = gainNode;
            source.headNode = highshelf;
            source.effects = {
                gainNode,
                stereoPanner,
                compressor,
                filters: {
                    lowshelf,
                    low,
                    mid,
                    high,
                    highshelf
                }
            }
        return source;
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
    jumpToPoint(){
     
        for(let i = 0; i < this.audioFiles.length; i++){
            let file = this.audioFiles[i];
            const data = {...file};
            file.source.disconnect();
            file.source = this.context.createBufferSource();
            file.source.effects = data.source.effects;
            file.source.headNode = data.source.headNode
            file.source.tailNode = data.source.tailNode;
            file.source.buffer = data.source.buffer;
            file.source.started = false;
            console.log(file.source)
            file.source.connect(data.source.headNode);
            this.audioFiles[i] = file;
        }
        if(this.playing){
            this.playing = false;
            this.play();
        }
    }
    // load audio if none, play audio, set appropriate visualizations
    async play(){
        if(this.playing) return;
        if(!this.audioFiles.length){
            await this.loadAudio(this.url);
        }
        this.audioFiles.forEach(file => {
            if(!file.source.started){
                file.source.started = true
                console.log(this.cursorOffset)
                file.source.start(this.context.currentTime,this.cursorPosition);
            }
        })
        globals.state.stopped = false;
        // move the cursor
        const moveCursor = (a)=> {
            if(!globals.state.stopped){
                requestAnimationFrame(moveCursor)
                const currentTime = this.context.currentTime + this.cursorOffset;
                this.cursorPosition = currentTime;
                $("#cursor").style.transform = `translateX(${(this.cursorPosition*globals.pixelsPerSecond)}px)`;
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
        this.playing = true;
    }
    // suspend the audio context
    stop(){
        if(!this.playing) return;
        globals.state.stopped = true;
        this.context.suspend();
        console.log({
            context: this.context.currentTime,
            timeline: globals.timeline.currentTime
        })
        this.playing = false;
    }
    setChannelVolume(node, e, labelSelector){
        const value = e.target.value
        console.log(value)
        node.gain.value = value;
        $(labelSelector).textContent = value;

    }
    setChannelPanning(node, e, labelSelector){
        const value = e.target.value;
        node.pan.value = value;
        $(labelSelector).textContent = value;
        
    }
    setMasterVolume(e){
        if(e){
            this.gainNode.gain.value = parseFloat(e.target.value);
            $("#volume-display").textContent = e.target.value;
        }
    }
    setMasterPanning(e){
        if(e){
            this.stereoPanner.pan.value = parseFloat(e.target.value);
            $("#panning-display").textContent = e.target.value;
        }
    }
    setMasterEQ(e,frequency){
        if(e){
            this.filter[frequency].gain.value = parseFloat(e.target.value);
            $("#"+frequency+"-display").textContent = e.target.value;
        }
    }
    setMasterCompressor(e,parameter){
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
        console.log(file)
        if(!allowedAudioFileTypes.includes(file.type)){
            throw new Error("Must be a valid audio file.");
        }else{
            this.loadingQueue.shift();
            this.nextFileName = file.name;
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
    setCursor(e){
        // the cursor offset should be the distance between context.currentTime and the new position;
        let newPosition = (e.clientX - 2)/globals.pixelsPerSecond;
        this.cursorOffset = (newPosition - this.context.currentTime);
        this.cursorPosition = newPosition;
        $("#cursor").style.transform = `translateX(${(this.cursorPosition*globals.pixelsPerSecond)}px)`;
        this.jumpToPoint();
    }

    // make a source, give it a base analyser, compressor, eq, panning, and gain.
    async loadToQueue(buffer){
        const source = this.context.createBufferSource();
        source.name = this.nextFileName || "";
        source.buffer = await this.context.decodeAudioData(buffer);
        source.player = this;
        this.buildChannelEffectsChain(source);
        const waveform = new Waveform(source);
        waveform.drawWaveform(source.buffer);
        this.audioFiles.push({source, waveform});
    }

    async loadAudio(url){
        this.url = url;
        this.source = this.context.createBufferSource();
        this.source.player = this;
        this.buildChannelEffectsChain(this.source);
        this.audioBuffer = await fetch(url)
            .then(res => res.arrayBuffer())
            .then(ArrayBuffer => this.context.decodeAudioData(ArrayBuffer));
        this.source.buffer = this.audioBuffer;
        const waveform = new Waveform(this.source);
        waveform.drawWaveform(this.source.buffer);
        this.audioFiles.push({source: this.source, waveform});
    }
}

export default AudioPlayer;

/*
    all audio nodes will now contain a reference to this audioplayer object
*/
import { $, allowedAudioFileTypes, globals} from './globals.js'
import Waveform from './waveform.js';
import Track, { trackTypes } from './track.js';
import Timeline from './timeline.js';

class AudioPlayer{
    tracks = [];
    cursorPosition = 0;
    timelineInterval = null;
    loadingQueue = [];
    cursorOffset = 0;
    timeline = null;

    constructor(url) {
        const context = new AudioContext();
        this.context = context;
        this.context.suspend();
        this.rootNode = context.destination;
        this.reader = new FileReader();
        this.timeline = new Timeline(this);  
        this.audioFiles = [];
        this.reader.addEventListener("load", e =>{
            console.log(e);
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
        // compressor.attack.value = $("#compressor-attack").value;
        // compressor.release.value = $("#compressor-release").value;
        // compressor.threshold.value = $("#compressor-threshold").value;
        // compressor.ratio.value = $("#compressor-ratio").value;
        // compressor.knee.value = $("#compressor-knee").value;
        compressor.connect(node);
        this.compressorNode = compressor;
        this.rootNode = compressor;
    }
    jumpToPoint(){
        for(let i = 0; i < this.audioFiles.length; i++){
            let waveform = this.audioFiles[i];
            if(waveform.track){
                const data = {...waveform};
                waveform.audioNode.disconnect();
                waveform.audioNode = this.context.createBufferSource();
                waveform.track = data.track;
                waveform.audioNode.buffer = data.audioNode.buffer;
                waveform.audioNode.started = false;
                waveform.audioNode.connect(waveform.track.headNode);
                this.audioFiles[i] = waveform;
            }
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
            if(!file.audioNode.started){
                file.audioNode.started = true
                file.audioNode.start(this.context.currentTime,this.cursorPosition/globals.zoom);
            }
        })
        globals.state.stopped = false;
        // move the cursor
        const repeatMoveCursor = ()=> {
            if(!globals.state.stopped){
                requestAnimationFrame(repeatMoveCursor)
                this.moveCursor();
            }
        }
        requestAnimationFrame(repeatMoveCursor);
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
            console.log(file.name)
            this.reader.readAsArrayBuffer(file);
        }
    }
    // when the reader is done, it checks for more files
    onReaderComplete(){
        this.loadToQueue(this.reader.result,this);
        if(this.loadingQueue.length > 0){
            this.processNew();
        }
    }
    moveCursor(){
        const currentTime = this.context.currentTime + this.cursorOffset;
        this.cursorPosition = currentTime;
        $("#cursor").style.transform = `translateX(${(this.cursorPosition*globals.pixelsPerSecond*globals.zoom)}px)`;
        let content = (Math.floor(currentTime*100)/100+"").replace(".",":");
        if(currentTime < 10){
            content = "00:0"+content
        }
        $("#numbers").textContent = content;
    }
    setCursor(e,origin){
        // the cursor offset should be the distance between context.currentTime and the new position;
        if(origin == "tracks" && (!e.target.classList.contains("track") && e.target.id != "tracks")){
            return;
        }
        let newPosition = ((e.clientX + 2)/(globals.pixelsPerSecond));
        this.cursorOffset = (newPosition/globals.zoom - this.context.currentTime);
        this.cursorPosition = newPosition < 0 ? 0 : newPosition;
        $("#cursor").style.transform = `translateX(${(this.cursorPosition*globals.pixelsPerSecond)}px)`;
        this.jumpToPoint();
    }

    // make a source, give it a base analyser, compressor, eq, panning, and gain.
    async loadToQueue(buffer){
        const source = this.context.createBufferSource();
        globals.loadingFiles.push(source);

        const track = new Track(trackTypes.stereo, this);
        track.showLoadingSpinner();
        const waveform = new Waveform(source);
        source.player = this;
        source.startTime = 0;
        this.audioFiles.push(waveform);
        this.tracks.push(track);
        waveform.name = this.nextFileName || "";
        
        this.context.decodeAudioData(buffer).then(newBuffer=>{
            track.hideLoadingSpinner();
            source.buffer = newBuffer;
            track.addClip(waveform);
            waveform.drawWaveform(source.buffer);

        });
    }

    async loadAudio(url){
        this.audioBuffer = await fetch(url)
            .then(res => res.arrayBuffer());
        this.loadToQueue(this.audioBuffer)
    }
}

export default AudioPlayer;

/*
    all audio nodes will now contain a reference to this audioplayer object
*/
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
    controlsWidth = 140;

    constructor(url) {
        const context = new AudioContext();
        this.context = context;
        this.context.suspend();
        this.rootNode = context.destination;
        this.reader = new FileReader();
        this.timeline = new Timeline(this);  
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
    restartTrack(id,idx){
        let index;
        if(id != null && id > -1){
            index = this.audioFiles.findIndex(file => file.id == id);
            console.log(index)
        }else if (idx != null && idx > -1){
            index = idx;
            console.log(index)
        }else{
            return null;
        }
        const waveform = this.audioFiles[index];
        if(waveform.track){
            const buffer = waveform.audioNode.buffer;
            waveform.audioNode.disconnect();
            waveform.audioNode = this.context.createBufferSource();
            waveform.audioNode.buffer = buffer;
            waveform.audioNode.started = false;
            waveform.audioNode.player = this;
            waveform.audioNode.connect(waveform.track.headNode);
            this.audioFiles[index] = waveform;
            if(this.playing){
                this.playIndividualFile(waveform);
            }
        }
    }
    jumpToPoint(){
        for(let i = 0; i < this.audioFiles.length; i++){
            this.restartTrack(null,i);
        }
    }

    playIndividualFile(file){
        if(!file.audioNode.started){
            file.audioNode.started = true;
            // currentSpot and startPoint are in seconds
            let currentSpot = (this.cursorPosition/globals.zoom);
            let startPoint = (this.context.currentTime + file.startTime) - currentSpot;
            currentSpot -= file.startTime;
            currentSpot = currentSpot < 0 ? 0 : currentSpot;
            startPoint = startPoint < 0 ? 0 : startPoint;
            file.audioNode.start(startPoint, currentSpot, file.endTime);
        }
    }

    // load audio if none, play audio, set appropriate visualizations
    async play(){
        if(this.playing || !this.audioFiles.length) 
            return;
        this.audioFiles.forEach(file => {
           this.playIndividualFile(file);
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
    fadein(){
        this.gainNode.gain.value = 0;
        var itvl = setInterval(()=>{
            this.gainNode.gain.value += 0.005;
            if(this.gainNode.gain.value >= 0.5){
                clearInterval(itvl);
            }
        },10);
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
            this.nextFileName = file.name;
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

    // move cursor back and return true if out of view
    keepCursorInView(transformValue){

        const totalTransformOffset = transformValue + globals.timelineScrollXOffset;

        // if the cursor is too far to the right
        if(totalTransformOffset > (window.innerWidth - this.controlsWidth)){
            globals.timelineScrollXOffset -= Math.abs(totalTransformOffset - (window.innerWidth - this.controlsWidth)) + (window.innerWidth*0.5);
            Timeline.scrollTimeline();
            return true;
        }
        if(!globals.allowAutoCursor){
            return false;
        }
        // if the cursor is too far to the left
        if(totalTransformOffset < 0){
            globals.timelineScrollXOffset += Math.abs(totalTransformOffset) + (window.innerWidth*0.5);
            globals.timelineScrollXOffset = globals.timelineScrollXOffset > 0 ? 0 : globals.timelineScrollXOffset;
            Timeline.scrollTimeline();
            return true;
        }
        return false

    }

    // sets the current time of the context
    moveCursor(){
        const scrollSecsOffset = Timeline.pixelsToSeconds(globals.timelineScrollXOffset * -1);
        const scrollPixOffset = Timeline.secondsToPixels(scrollSecsOffset);
        const currentTime = this.context.currentTime + this.cursorOffset + scrollSecsOffset;
        this.cursorPosition = currentTime;
        const transformValue = (this.cursorPosition*globals.pixelsPerSecond*globals.zoom) - scrollPixOffset;
        if(this.keepCursorInView(transformValue)){
            return;
        };
        const cursorElement = $("#cursor");
        cursorElement.style.transform = `translateX(${transformValue}px)`;
        cursorElement.style.left = `${globals.timelineScrollXOffset}px`
        $("#numbers").textContent = Timeline.formatSeconds(this.context.currentTime + this.cursorOffset)
    }

    setCursorToPoint(e,origin){
        // the cursor offset should be the distance between context.currentTime and the new position;
        if(origin == "tracks" && (!e.target.classList.contains("track") && e.target.id != "tracks")){
            return;
        }
        let newPosition = (((globals.timelineScrollXOffset * -1) + e.clientX - 1)/(globals.pixelsPerSecond));
        this.cursorOffset = (newPosition/globals.zoom - this.context.currentTime);
        this.cursorPosition = newPosition < 0 ? 0 : newPosition;
        const cursorElement = $("#cursor");
        cursorElement.style.transform = `translateX(${(this.cursorPosition*globals.pixelsPerSecond)}px)`;
        this.jumpToPoint();
        this.moveCursor();
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
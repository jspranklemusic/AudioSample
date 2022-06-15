function $(selector){
    return document.querySelector(selector);
}

const allowedAudioFileTypes = ["audio/mpeg","audio/ogg"];
const globals = {
    tracks: {
        dragStartY: null,
        dragStartX: null,
        dragCurrentY: null,
        dragCurrentX: null,
        currentDragged: [],
    },
    state: {
        stopped: false
    }
}

class Waveform{
    positionX = 0;
    prevPositionX = 0;
    id = 0;
    static count = 0;
    constructor(audio,container="#tracks",canvasWidth = 1050,canvasHeight = 150){
        this.id = Waveform.count;
        Waveform.count++;
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.draggable = true;
        canvas.addEventListener("dragstart", e => {
            var img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(img, 0, 0);
            globals.tracks.currentDragged.push(this)
            return false;
        })
        canvas.addEventListener("dragend", e => {
            globals.tracks.currentDragged = [];
            globals.tracks.dragStartY = null
            globals.tracks.dragStartX = null
            globals.tracks.dragCurrentY = null
            globals.tracks.dragCurrentX = null
            this.prevPositionX = this.positionX;
            $("#tracks").click();
        })
        canvas.addEventListener("drag", e => {

        })
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext("2d");
        this.audio = audio;
        $(container).appendChild(canvas);
    }
    // make a waveform graphic in canvas
    drawWaveform(buffer){
        const bufferL = buffer.getChannelData(0);
        var sampleRate = 48000
        var pixelDensity = 3;
        this.canvas.width = Math.floor(buffer.length/(sampleRate/pixelDensity));
        console.log((this.canvas.width),(buffer.length/sampleRate),bufferL.length,buffer.length)
        this.canvasCtx.fillStyle = 'rgb(235, 235, 235)';
        this.canvasCtx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.canvasCtx.fillStyle = 'rgb(150, 0, 0)';
        console.log(buffer.length)
        for(var i = 0; i < buffer.length; i += sampleRate/10){
            if(bufferL[i]){
                let val = bufferL[i];
                this.canvasCtx.rect(i/(sampleRate/pixelDensity),this.canvas.height/2,0.5,val*100)
                this.canvasCtx.fill();
            }
        }
    }
    // drag tracks along timeline
    static dragPosition(e){
        const tracks = globals.tracks;
        if(tracks.dragStartX === null | tracks.dragStartY === null){
            tracks.dragStartX = e.clientX;
            tracks.dragStartY = e.clientY;
        }
        tracks.dragCurrentX = e.clientX;
        tracks.dragCurrentY = e.clientY;
        const diffX = tracks.dragCurrentX - tracks.dragStartX;
        
        tracks.currentDragged.forEach(item => {
            item.positionX = diffX + item.prevPositionX ;
            item.canvas.style.transform = `translateX(${item.positionX}px)`;
        })
    }
    static mousePosition(e){
        // globals.tracks.dragStartX = e.clientX;
        // globals.tracks.dragStartY = e.clientY;
    }
    static unsetMousePosition(){
        // globals.tracks.dragStartX = null;
        // globals.tracks.dragStartY = null;
    }
}

class AudioPlayer{

    cursorPosition = 0;

    constructor(url) {
        // const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        this.context = context;
        this.rootNode = context.destination;
        this.reader = new FileReader();
        this.audioFiles = [];
        this.reader.addEventListener("load", e =>{
            this.loadToQueue(this.reader.result);
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
            file.source.start(this.context.currentTime,0)
        })
        globals.state.stopped = false;
        // move the cursor
        const moveCursor = timestamp =>{
            if(!globals.state.stopped){
                requestAnimationFrame(moveCursor)
                this.cursorPosition += 1/20.0210728931;
                $("#cursor").style.transform = `translateX(${this.cursorPosition}px)`
            }
        }
        requestAnimationFrame(moveCursor)
        this.fadein();
    }
    stop(){
        globals.state.stopped = true;
        this.audioFiles.forEach(file => {
            file.source.start(this.context.currentTime,0)
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
    processNew(e){
        for(var i = 0; i < e.target.files.length; i++){
            const file = e.target.files[i]
            if(!allowedAudioFileTypes.includes(file.type)){
                throw new Error("Must be a valid audio file.");
            }else{
                this.reader.readAsArrayBuffer(file);
            }
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

class Visualizer {
    constructor(audio,canvasWidth = 350,canvasHeight = 200){
        this.canvas = $('#analyzer');
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvasCtx = this.canvas.getContext("2d");
        this.audio = audio;
        this.visualize();
    }

    visualize(){
        const WIDTH = this.canvas.width;
        const HEIGHT = this.canvas.height;
        const bufferLength = this.audio.bufferLength
        const dataArrayAlt = new Uint8Array(bufferLength);
        this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        let drawVisual;
        
        const drawAlt = ()=> {
            drawVisual = requestAnimationFrame(drawAlt);
            
            this.audio.analyser.getByteFrequencyData(dataArrayAlt);
            this.canvasCtx.fillStyle = 'rgb(235, 235, 235)';
            this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
            // var barWidth = (WIDTH / bufferLength) * 1;
            var barWidth = 3;
            var barHeight;
            var x = 0;

            for(var i = 0; i < bufferLength; i++) {
              let red = i*2.5;
              let blue = 0;
              let green = 0;
   
              barHeight = dataArrayAlt[i]*2;
              this.canvasCtx.fillStyle = `rgba(${red},${green},${blue},1)`;
              this.canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);
              x += barWidth + 2;
            }
        };
        drawAlt();
    }
}

const audio = new AudioPlayer('./music.mp3');
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



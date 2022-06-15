import { $, globals } from './globals.js'

class Waveform{
    positionX = 0;
    prevPositionX = 0;
    id = 0;
    static count = 0;
    constructor(audio,container="#tracks",canvasWidth = 1050,canvasHeight = 150){
        this.id = Waveform.count;
        Waveform.count++;
        const canvas = document.createElement("canvas");
        const parent = document.createElement("div");
        parent.classList.add("track");
        parent.classList.id = "track-"+this.id;
        parent.appendChild(canvas)
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.draggable = true;
        canvas.classList.add("audio-file")
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
        canvas.addEventListener("mousedown", e => {
            // select/unselected multiple if shift, otherwise only select one
            if(e.shiftKey){
                canvas.classList.toggle("selected");
            }else{
                document.querySelectorAll(".audio-file.selected").forEach(element => {
                    element.classList.remove("selected")
                })
                canvas.classList.add("selected");
            }
            console.log(e)
        })
        canvas.addEventListener("drag", e => {

        })
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext("2d");
        this.audio = audio;
        $(container).appendChild(parent);
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

// global mouseup to remove '.selected' class from track
document.addEventListener("mousedown", e => {
    if(!e.target.classList.contains("audio-file")){
        document.querySelectorAll(".audio-file.selected").forEach(element => {
            element.classList.remove("selected")
        })
    }
})

export default Waveform;
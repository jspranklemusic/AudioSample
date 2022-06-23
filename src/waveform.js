import { $, $$, globals } from './globals.js'
const CANVAS_WIDTH_MAX = 32000;
class Waveform{
    positionX = 0;
    prevPositionX = 0;
    positionY = 0;
    prevPositionY = 0;
    id = 0;
    selected = false;
    dragStartY = null;
    dragStartX = null;
    dragCurrentY = null;
    dragCurrentX = null;
    name = "";
    startTime = 0;
    duration = 0;
    track = null;
    canvasElements = [];
    static count = 0;
    static objects = []

    // This runs when a new clip is created
    constructor(audioNode,canvasWidth = 1050,canvasHeight = 100){
        this.id = Waveform.count;
        Waveform.count++;
        Waveform.objects.push(this);

        // set canvas and wrapper
        this.audioNode = audioNode;
        this.name = audioNode.name ? audioNode.name : "Track "+this.id;
        this.player = this.audioNode.player;
        const wrapper = document.createElement("div");
        wrapper.classList.add("track-wrapper");
        wrapper.setAttribute("data-name",this.name);
        this.element = wrapper;
        this.createBaseCanvas(canvasWidth,canvasHeight);

        // change the places where this is referenced, namely the select option
        const option = document.createElement("option");
        option.innerHTML = `Track ${this.id}`
        option.value = this.id
        this.option = option;
        $("#track-select").appendChild(option);
        $("#track-select").value = option.value;
    
        // show an empty image and drag all selected clips
        wrapper.addEventListener("dragstart", e => {
            var img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(img, 0, 0);
            Waveform.findSelected().forEach(object => {
                globals.tracks.currentDragged.push(object)
            })
            return false;
        })
        // select/unselected multiple if shift, otherwise only select one
        this.canvas.addEventListener("mousedown", e => {
            if(!e.target.classList.contains("selected")){
                if(e.shiftKey){
                    this.select();
                }else{
                    Waveform.findSelected().forEach(object => {
                        object.unselect();
                    })
                    this.select();
                }
            }else{
                if(e.shiftKey){
                    this.unselect();
                }
            }
        })
    }

    setName(text){
        this.name = text;
        this.canvas.parentElement.setAttribute("data-name",this.name);
    }

    createBaseCanvas(canvasWidth,canvasHeight){
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.draggable = true;
        canvas.classList.add("audio-file");
        canvas.id = "canvas-"+this.id+String.fromCharCode(97+this.canvasElements.length);
        this.canvasElements.push(canvas);
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext("2d");
        this.element.appendChild(canvas);
    }

    // make a waveform graphic in canvas
    // make a high-resolution canvas at max zoom, and then CSS transformX to scale-in to the current zoom.
    drawWaveform(buffer,skipAnimation){
        const one = Date.now()
        const bufferL = buffer.getChannelData(0);
        const sampleRate = 48000
        const pixelDensity = 3*globals.zoomMax;
        const width =  Math.floor( buffer.length / (sampleRate/pixelDensity) );
        const height = this.canvas.height/2;
        const pixelWidth = 1;

        // in FF/Safari/Chrome, the max canvas width is 32767. what to do if too high res?
        // solution - make multiple canvases.
      
        for(let i = 0; i < Math.floor(width/CANVAS_WIDTH_MAX); i++){
            this.createBaseCanvas(0,this.canvas.height);
        }
        let remainingWidth = width;
        this.canvasElements.forEach(canvas =>{
            if(remainingWidth < CANVAS_WIDTH_MAX){
                canvas.width = remainingWidth;
            }else{
                canvas.width = CANVAS_WIDTH_MAX;
            }
            remainingWidth -= CANVAS_WIDTH_MAX;
            const canvasCtx = canvas.getContext("2d");
            canvasCtx.fillStyle = 'rgb(235, 215, 215)';
            canvasCtx.fillRect(0,0,CANVAS_WIDTH_MAX,canvas.height);
            canvasCtx.fillStyle = 'rgb(150, 0, 0)';
        })



        // this.canvas.width = width;
        // this.canvasCtx.fillStyle = 'rgb(235, 215, 215)';
        // this.canvasCtx.fillRect(0,0,this.canvas.width,this.canvas.height);
        // this.canvasCtx.fillStyle = 'rgb(150, 0, 0)';

            var i = 0;
            let inc = sampleRate/1000;
            let currCanvasIdx = 0;
            let incOffset = 0;
            this.currCanvasContext = this.canvasElements[currCanvasIdx].getContext("2d");

            while(i < buffer.length){
                const j = i;

                let xPos = j/(sampleRate/pixelDensity) - incOffset;
                let yPos = bufferL[j]*60;

                if(xPos >= CANVAS_WIDTH_MAX){
                    console.log(xPos, i, j, buffer.length)
                    currCanvasIdx++;
                    incOffset += CANVAS_WIDTH_MAX
                    xPos = 0;
                    console.log(this.canvasElements,currCanvasIdx);
                    this.currCanvasContext = this.canvasElements[currCanvasIdx].getContext("2d");
                }
                
                requestAnimationFrame(()=>{
                    this.currCanvasContext.fillRect(
                        xPos,
                        height,
                        pixelWidth,
                        yPos
                    )

                    if(j >= buffer.length - inc){
                        this.setWaveZoom();
                        console.log(" ...done rendering in " + (Date.now() - one) + "ms");
                    }
                })
                i += inc;
            }    
         
    }

    setWaveZoom(){
        let width = 0;

        this.canvasElements.forEach(canvas=>{
            canvas.style.transform = `scaleX(${globals.zoom/globals.zoomMax})`
            const rect = canvas.getBoundingClientRect();
            width += (rect.right - rect.left);
        })
        this.element.style.width = width + "px";
    }

    toggleSelected(){
        this.canvas.classList.toggle("selected");
        this.selected = !this.selected
    }
    select(){
        this.canvas.classList.add("selected");
        this.selected = true;
    }
    unselect(){
        this.canvas.classList.remove("selected");
        this.selected = false;
    }

    static findSelected(){
        return Waveform.objects.filter(object => object.selected);
    }
    // drag tracks along timeline
    static dragPosition(e){
        e.preventDefault();
        const tracksOffset = $("#timeline").getBoundingClientRect().bottom
        globals.tracks.currentDragged.forEach((item)=> {
            if(globals.tracks.currentDragged.length == 1){
               if(e.target.classList.contains("track")){
                item.positionY = e.target.getBoundingClientRect().top - (tracksOffset + 2 ) - item.track.element.offsetTop
               }
            }
            if(item.dragStartX === null | item.dragStartY === null){
                item.dragStartX = e.clientX;
                item.dragStartY = e.clientY;
            }
            item.dragCurrentX = e.clientX;
            item.dragCurrentY = e.clientY;
            const diffX = item.dragCurrentX - item.dragStartX;

            item.positionX = diffX + item.prevPositionX ;
            if(item.positionX < 0){
                item.positionX = 0;
            }
            // item.canvas.style.transform = `translateX(${item.positionX}px)`;
            item.canvas.parentElement.style.transform = `translateX(${item.positionX}px) translateY(${item.positionY}px)`;
            
        })
    }
    deleteClip(){
        this.canvas.parentElement.remove();
        this.audioNode.disconnect(this.track.headNode);
        if($("#track-select").value == this.id){
            $("#track-select").value = $("#track-select").options[$("#track-select").options.length - 2].value;
        }
        this.option.remove();
        this.track.removeClip(this);

    }
}

// global mouseup to remove '.selected' class from track
document.addEventListener("mouseup", e => {
    if(!e.target.classList.contains("audio-file")){
        Waveform.findSelected().forEach(object => {
            object.unselect();
        })
    }
    // if you click on track name that's editable, it should do nothing
    if(!e.target.classList.contains("track-name")){
        $$(".track-name").forEach(track=> {
            track.removeAttribute("contenteditable");
        })
    }
})

export default Waveform;

/*

BEHAVIOR OF CLICKING:

1. when shift is held, mousedown over a clip should select it.
2. Clicking a selected track should not unselect other selected tracks, but clicking
    an unselected track should select the new one and unselect the other ones, unless shift is held.

Also, I should distinguish between clips and tracks. 
*/

// ok, here's the problem with mute. the mute button is muting the correct object.

// also, the waveform is too dependent on track.
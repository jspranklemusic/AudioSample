import { $, $$, globals } from './globals.js'
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
    static count = 0;
    static objects = []

    // This runs when a new clip is created
    constructor(audioNode,canvasWidth = 1050,canvasHeight = 99){
        this.id = Waveform.count;
        Waveform.count++;
        Waveform.objects.push(this);
        // set canvas
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.draggable = true;
        canvas.classList.add("audio-file");
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext("2d");
        this.audioNode = audioNode;
        this.name = audioNode.name ? audioNode.name : "Track "+this.id;
        this.player = this.audioNode.player;
        const wrapper = document.createElement("div");
        wrapper.appendChild(canvas);
        wrapper.classList.add("track-wrapper");
        wrapper.setAttribute("data-name",this.name);

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
        canvas.addEventListener("mousedown", e => {
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
        this.element = wrapper;
    }

    setName(text){
        this.name = text;
        this.canvas.parentElement.setAttribute("data-name",this.name);
    }

    // make a waveform graphic in canvas
    drawWaveform(buffer){
        const bufferL = buffer.getChannelData(0);
        var sampleRate = 48000
        var pixelDensity = 3;
        this.canvas.width = Math.floor(buffer.length/(sampleRate/pixelDensity));
        this.canvasCtx.fillStyle = 'rgb(235, 215, 215)';
        this.canvasCtx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.canvasCtx.strokeStyle = 'rgb(150, 0, 0)';
        let one = Date.now()
        this.canvasCtx.beginPath();       

        var i = 0;
        while(i < buffer.length){
            let num1 = i/(sampleRate/pixelDensity);
            let num2 = this.canvas.height/2 + bufferL[i]*100;
            this.canvasCtx.lineTo(num1,num2)
            this.canvasCtx.moveTo(num1,num2)
            this.canvasCtx.stroke();
            i += sampleRate/15;
        }

        // for(var i = 0; i < buffer.length; i += sampleRate/15){
        //         let val = bufferL[i];
        //         this.canvasCtx.lineTo(i/(sampleRate/pixelDensity),this.canvas.height/2 + val*100)
        //         this.canvasCtx.moveTo(i/(sampleRate/pixelDensity),this.canvas.height/2 + val*100)
        //         this.canvasCtx.stroke();
        // }
        let two = Date.now();
        console.log(two - one)

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
        console.log(e)
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
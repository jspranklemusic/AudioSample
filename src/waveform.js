import { $, globals } from './globals.js'
import trackControls from './components/track-controls.js';
import { changeRangeBg } from './components/range.js';
class Waveform{
    positionX = 0;
    prevPositionX = 0;
    id = 0;
    selected = false;
    dragStartY = null;
    dragStartX = null;
    dragCurrentY = null;
    dragCurrentX = null;
    name = "";
    static count = 0;
    static objects = []

    // This runs when a new clip is created
    constructor(audioNode,container="#tracks",canvasWidth = 1050,canvasHeight = 100){
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
        const player = this.audioNode.player;
        const wrapper = document.createElement("div");
        wrapper.appendChild(canvas);
        wrapper.classList.add("track-wrapper");
        wrapper.setAttribute("data-name",this.name);
        // set track
        const track = document.createElement("div");
        track.classList.add("track");
        track.classList.id = "track-"+this.id;
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
        // cleanup after dragging is finished
        wrapper.addEventListener("dragend", e => {
            globals.tracks.currentDragged.forEach(item => {
                item.dragStartY = null
                item.dragStartX = null
                item.dragCurrentY = null
                item.dragCurrentX = null
                item.prevPositionX = item.positionX;
            })
            globals.tracks.currentDragged = [];
            $("#tracks").click();
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
        $(container).appendChild(track);
        // okay, this is where react would be nice. I will have to assign the events after the html renders
        // render track controls and assign listeners
        track.innerHTML = trackControls({
            id: this.id,
        });
        track.appendChild(wrapper)
        console.log($("#panning-"+this.id))
        $("#panning-"+this.id).oninput = e => {player.setChannelPanning(
                audioNode.effects.stereoPanner,
                e,
                "#panning-display-"+this.id
            );
            changeRangeBg(e)
        };
        $("#volume-"+this.id).oninput = e => {player.setChannelVolume(
                audioNode.effects.gainNode,
                e,
                "#volume-display-"+this.id
            );
            changeRangeBg(e)
        };
        const muteBtn =  $("#mute-btn-"+this.id);
        muteBtn.onclick = () => {
            if(!muteBtn.getAttribute("muted")){
                muteBtn.setAttribute("muted","true");
                muteBtn.src = "/icons/volume-x.svg"
            }else{
                muteBtn.removeAttribute("muted")
                muteBtn.src = "/icons/volume-2.svg"
            }
        }
 
    }
    // make a waveform graphic in canvas
    drawWaveform(buffer){
        const bufferL = buffer.getChannelData(0);
        var sampleRate = 48000
        var pixelDensity = 3;
        this.canvas.width = Math.floor(buffer.length/(sampleRate/pixelDensity));
        this.canvasCtx.fillStyle = 'rgb(235, 215, 215)';
        this.canvasCtx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.canvasCtx.fillStyle = 'rgb(150, 0, 0)';
        for(var i = 0; i < buffer.length; i += sampleRate/10){
            if(bufferL[i]){
                let val = bufferL[i];
                this.canvasCtx.rect(i/(sampleRate/pixelDensity),this.canvas.height/2,0.5,val*100)
                this.canvasCtx.fill();
            }
        }
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
        globals.tracks.currentDragged.forEach(item => {
            if(item.dragStartX === null | item.dragStartY === null){
                item.dragStartX = e.clientX;
                item.dragStartY = e.clientY;
            }
            item.dragCurrentX = e.clientX;
            item.dragCurrentY = e.clientY;
            const diffX = item.dragCurrentX - item.dragStartX;

            item.positionX = diffX + item.prevPositionX ;
            // item.canvas.style.transform = `translateX(${item.positionX}px)`;
            item.canvas.parentElement.style.transform = `translateX(${item.positionX}px)`;
        })
    }
    deleteClip(){
        this.canvas.parentElement.remove();
        this.audioNode.tailNode.disconnect();
        if($("#track-select").value == this.id){
            $("#track-select").value = $("#track-select").options[$("#track-select").options.length - 2].value;
        }
        this.option.remove();
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
document.addEventListener("mouseup", e => {
    if(!e.target.classList.contains("audio-file")){
        Waveform.findSelected().forEach(object => {
            object.unselect();
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
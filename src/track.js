import trackControls from "./components/track-controls.js";
import popover from "./components/popover.js";
import { $, $$, globals } from "./globals.js";
import { changeRangeBg } from "./components/range.js";
import Waveform from "./waveform.js";
import Plugin from "./plugins/plugin.js";

export const trackTypes = {
    mono: "mono",
    stereo: "stereo",
    midi: "midi",
    video: "video",
    master: "master"
}

class Track {
    clips = [];
    id = 0;
    muted = false;
    solo = false;
    name = "";
    selected = false;
    hueRotation = 100;
    plugins = [];
    static soloTracks = [];
    static count = 0
    static objects = []
    static cycledHue = 0;
    constructor(type, audioPlayer, container = "#tracks") {
        if(!trackTypes[type]){
            throw new Error("Invalid track type.");
        }
        this.type = type;
        this.buildChannelEffectsChain(audioPlayer);
        this.id = Track.count;
        this.name = "Track " + this.id;
        this.audioPlayer = audioPlayer;
        if(Track.count == 0){
            Track.audioPlayer = audioPlayer;
        }
        Track.count++;
        Track.objects.push(this);
        const track = document.createElement("div");
        track.classList.add("track");
        track.id = "track-"+this.id;
        $(container).appendChild(track);
        // okay, this is where react would be nice. I will have to assign the events after the html renders
         track.innerHTML = trackControls({
            id: this.id,
        });
        this.element = track;
        this.setListeners();
        this.setColor();
    }
    setColor(){
        this.hueRotation = Track.cycledHue*10;
        Track.cycledHue += 7;
        this.element.style.filter = `hue-rotate(${this.hueRotation}deg)`;
        this.element.querySelectorAll(".mute-solo-container").forEach(elem=>{
            elem.style.filter = `hue-rotate(${-this.hueRotation}deg)`;
        })

    }
    showLoadingSpinner(){
        this.spinner = document.createElement("div");
        this.spinner.classList.add("loading-dots");
        this.spinner.innerHTML = `
            <div class="dot"></div>
            <div class="dot dot_two"></div>
            <div class="dot dot_three"></div>
            <div class="dot dot_four"></div>
        `
        this.element.appendChild(this.spinner);
    }
    hideLoadingSpinner(){
        this.spinner.remove();
    }
    addClip(clip){
        this.clips.push(clip);
        this.element.appendChild(clip.element);
        clip.positionY = 0;
        clip.track = this;
        clip.canvas.parentElement.style.left = "0px"
        clip.canvas.parentElement.style.transform = `translateX(${clip.positionX}px) translateY(${clip.positionY}px)`;
        clip.audioNode.connect(this.headNode);
    }
    removeClip(clip){
        const index = this.clips.findIndex(object=>object.id == clip.id);
        this.clips.splice(index,1);
        clip.track = null;
    }
    deleteTrack(){
        console.log("deleting...",this)
        this.clips.forEach(clip => {
            clip.deleteClip();
        })
        this.element.remove();
    }
    setListeners(){
        console.log(this.element)
        window.ondragover = e => Waveform.dragPosition(e);
        this.element.ondrop = e => {
            e.preventDefault();
            globals.tracks.currentDragged.forEach(item => {
                if(globals.tracks.currentDragged.length == 1 && e.target.classList.contains("track")){
                    item.track.removeClip(item);
                    this.addClip(item);
                }
                item.dragStartY = null
                item.dragStartX = null
                item.dragCurrentY = null
                item.dragCurrentX = null
                item.prevPositionX = item.positionX;
                item.positionY = 0;
            })
            globals.tracks.currentDragged = [];
            $("#tracks").click();
        }
        // control panning and volume
        $("#panning-"+this.id).oninput = e => {this.audioPlayer.setChannelPanning(
                this.effects.stereoPanner,
                e,
                "#panning-display-"+this.id
            );
            changeRangeBg(e)
        };
        $("#volume-"+this.id).oninput = e => {this.audioPlayer.setChannelVolume(
                this.effects.gainNode,
                e,
                "#volume-display-"+this.id
            );
            changeRangeBg(e)
        };
        // mute button
        const muteBtn =  $("#mute-btn-"+this.id);
        muteBtn.onclick = () => {
            if(!muteBtn.getAttribute("muted")){
                muteBtn.setAttribute("muted","true");
                muteBtn.src = "/assets/icons/volume-x.svg";
                this.mute();

            }else{
                muteBtn.removeAttribute("muted");
                muteBtn.src = "/assets/icons/volume-2.svg";
                this.unmute();
            }
        }
        // solo button
        const soloBtn = $(`#solo-${this.id}`);
        soloBtn.onclick = (e)=>{
            if(!this.solo){
                // add to soloed if shift
                if(e.shiftKey){
                    Track.soloTracks.push(this.id);
                    soloBtn.classList.add("checked");
                }else{
                    // unsolo the others if no shift
                    Track.soloTracks.forEach(id=>{
                        const solo = $(`#solo-${id}`);
                        solo.classList.remove("checked");
                        Track.find(id).solo = false;
                    })
                    Track.soloTracks = [this.id];
                    soloBtn.classList.add("checked");
                }
                this.solo = true;
            }else{
                Track.soloTracks.splice( Track.soloTracks.indexOf(this.id),1 );
                soloBtn.classList.remove("checked");
                this.solo = false;
            }
            this.soloTracks();
        }
        // delete button
        $(`#delete-track-${this.id}`).onclick = ()=> {
            $("#popover-root").innerHTML = popover({
                title: "Delete Track",
                content: `Do you want to delete \"${this.name}\"?`,
                type: "confirm",
                direction: "right",
                yPosition: 100,
                xPosition: 100
            });
            $(".button.confirm").addEventListener("click", ()=>{
                this.deleteTrack();
            })
        }
        const trackTitleElement = $("#track-"+this.id+"-name")
        // Make Track Title Elements editable
        trackTitleElement.onclick = ()=>{
            if(!trackTitleElement.getAttribute("contenteditable")){
                $$(".track-name[contenteditable='true']").forEach(element => {
                    if(element.id != trackTitleElement.id){
                        element.removeAttribute("contenteditable");
                    }
                })
                trackTitleElement.setAttribute("contenteditable",true)
            }
        }
    }

    buildStereoTrack(){

    }

    buildMasterTrack(){
        
    }

    soloTracks(){
        Track.objects.forEach(track => {
            if(!Track.soloTracks.includes(track.id) && Track.soloTracks.length > 0){
                track.mute(true);
            }else if(!track.muted){
                track.unmute(true);
            }
        })
    }
    

    toggleSelected(){
        this.selected = !this.selected;
        this.element.querySelector(".channel").setAttribute("selected",this.selected);
        console.log(this.selected,this.element.querySelector(".channel"));
    }

    // builds nodes and effects, connects to context root node
    buildChannelEffectsChain(audioPlayer){
        // build the nodes
            const stereoPanner = new StereoPannerNode(audioPlayer.context);
            const gainNode = new GainNode(audioPlayer.context)
            const muteNode = new GainNode(audioPlayer.context);
            const lowshelf = new BiquadFilterNode(audioPlayer.context, { type: "lowshelf", frequency: 100 } );
            const low = new BiquadFilterNode(audioPlayer.context, { type: "peaking", frequency: 250 } );
            const mid = new BiquadFilterNode(audioPlayer.context, { type: "peaking", frequency: 1000 } );
            const high = new BiquadFilterNode(audioPlayer.context, { type: "peaking", frequency: 5000 } );
            const highshelf = new BiquadFilterNode(audioPlayer.context, { type: "highshelf", frequency: 8000 } );
            const compressor = new DynamicsCompressorNode(audioPlayer.context);
        // defaults
            compressor.ratio.value = 1;
            gainNode.gain.value = 0.5;
            muteNode.gain.value = 1;
        // make connections
            highshelf.connect(high);
            high.connect(mid);
            mid.connect(low);
            low.connect(lowshelf);
            lowshelf.connect(compressor);
            compressor.connect(stereoPanner)
            stereoPanner.connect(gainNode);
            gainNode.connect(muteNode);
            muteNode.connect(audioPlayer.rootNode);

            console.log(muteNode);

            const foo = ()=>{
                const muteNode = new Plugin({
                    nextNode: audioPlayer.rootNode,
                    node: new GainNode(audioPlayer.context),
                });
                const gainNode = new Plugin({
                    nextNode: muteNode.node,
                    node: new GainNode(audioPlayer.context),
                });
            
            }
        // save references to nodes as variables
            // source.tailNode = gainNode;
            this.headNode = highshelf;
            this.effects = {
                muteNode,
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
        return this.effects;
    }
    mute(forSolo = undefined){
        this.effects.muteNode.gain.value = 0;
        if(!forSolo){
            this.muted = true;
        }
    }
    unmute(forSolo = undefined){
        this.effects.muteNode.gain.value = 1;
        if(!forSolo){
            this.muted = false;
        }
    }

    // this makes all of the plugins display on the UI
    setPlugins(){
        // get current settings

        // make current settings show

    }

    static find(id){
        return Track.objects.find(object => object.id == id);
    }

    static zoomOut(){
        if(globals.zoom == globals.zoomMin) return false;
        globals.zoom = Math.floor(10*(globals.zoom * 0.8))/10;
        if( globals.zoom < globals.zoomMin) globals.zoom = globals.zoomMin;
        Track.setGlobalZoom();
        return true;
    }
    static zoomIn(){
        if(globals.zoom == globals.zoomMax) return false;
        globals.zoom =  Math.floor(10*(globals.zoom * 1.5))/10;
        if( globals.zoom > globals.zoomMax) globals.zoom = globals.zoomMax;
        Track.setGlobalZoom();
        return true;
    }

    static setGlobalZoom(){
        Track.objects.forEach(object => {
            object.clips.forEach(clip => {
                clip.setWaveZoom();
            })
        })
        globals.audioPlayer.timeline.drawTimeline();
    }
    
}

export default Track;
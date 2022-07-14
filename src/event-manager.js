import Waveform from "./waveform.js";
import Track from "./track.js";
import { $, $$, globals } from "./globals.js";

class EventManager {

    timelineScrollYOffset = 0;
    timelineScrollXOffset = 0;
    timelineBottomPosition = 0;
    

    constructor(audio){
        this.setDefaults();
        $("#tracks").onmousedown = e => audio.setCursor(e,"tracks");
        $("#timeline").onmousedown = e => audio.setCursor(e);
        // menu
        $("#load").onclick = ()=> audio.loadNew();
        $('#start').onclick = () => audio.play();
        $('#stop').onclick = () => audio.stop();
        $("#fadeout").onclick = () => audio.fadeout();
        $("#fileinput").onchange = e => audio.processNew(e);
        $("#zoom-out").onclick = ()=> {
            if(Track.zoomOut()) {
   
            }
        };
        $("#zoom-in").onclick = ()=> {
           if(Track.zoomIn()){
          
           }
        };
        // volume panning
        // $("#volume").oninput = e => audio.setMasterVolume(e);
        // $("#panning").oninput = e => audio.setMasterPanning(e);
        // compressor
        // $("#compressor-threshold").oninput = e => audio.setMasterCompressor(e,"threshold");
        // $("#compressor-ratio").oninput = e => audio.setMasterCompressor(e,"ratio");
        // $("#compressor-attack").oninput = e => audio.setMasterCompressor(e,"attack");
        // $("#compressor-release").oninput = e => audio.setMasterCompressor(e,"release");
        // $("#compressor-knee").oninput = e => audio.setMasterCompressor(e,"knee");
        // eq
        // $("#eq-lowshelf").oninput = e => audio.setMasterEQ(e,"lowshelf");
        // $("#eq-low").oninput = e => audio.setMasterEQ(e,"low");
        // $("#eq-mid").oninput = e => audio.setMasterEQ(e,"mid");
        // $("#eq-high").oninput = e => audio.setMasterEQ(e,"high");
        // $("#eq-highshelf").oninput = e => audio.setMasterEQ(e,"highshelf");
        // custom range dials
        $$(".dial").forEach(dial => {
            // dial.onmouseover = () => {
            //     dial.firstElementChild.classList.add("dial-mouseover")
            // }
            // dial.onmouseleave = () => {
            //     if(!globals.globalMousemoveFunctions.length){
            //         dial.firstElementChild.classList.remove("dial-mouseover")
            //     }
            // }
            dial.onmousedown = () => {
                const style = document.createElement("style");
                style.id = "dial-active"
                style.innerHTML = /*css*/ `
                * {
                    user-select: none;
                    cursor: grabbing !important;
                }
                `
                document.head.appendChild(style);
                globals.globalMousemoveFunctions.push({ element: dial, func: (e,element)=>{
                    if(globals.initialMouseDown === null){
                        globals.initialMouseDown = e.clientY
                    }
                    let val = (globals.initialMouseDown - e.clientY)*1;
                    if(val > 100){
                        val = 100
                    }
                    if(val < 0){
                        val = 0;
                    }
                    element.style.setProperty("--p",val)
                } })
            }
        })
        window.addEventListener("resize", ()=>{
            audio.timeline.drawTimeline();
            this.setDefaults();
        });
        document.onmousemove = e => globals.globalMousemoveFunctions.forEach(item => item.func(e,item.element));
        document.onmouseup = ()=> {
            globals.initialMouseDown = null
            globals.globalMousemoveFunctions = [];
            const dial = $("#dial-active");
            if(dial){
                dial.remove();
            }
        };
        $('#timeline-and-tracks').onwheel = e =>{
             this.scrollHandler(e);
        }
        this.timelineAndTracks = $('#timeline-and-tracks');
        this.prevDateNow = Date.now();
        this.scrollTimeline();

        $("#tracks").onscroll = e =>{
            console.log(this.timelineTopPosition,this.timelineBottomPosition, "tracks position:")
            $$("#tracks canvas").forEach(canvas=>{
                const rect = canvas.getBoundingClientRect().top;
                console.log(rect)
                if(rect.bottom > this.timelineTopPosition | rect.top < this.timelineBottomPosition){
                    canvas.setAttribute("hidden",true);
                }else{
                    canvas.removeAttribute("hidden");
                }
            })
        }


    }
    scrollHandler(e){
        let val = Math.sqrt(Math.abs(e.wheelDeltaY))*0.75;
        this.timelineScrollYOffset += e.wheelDeltaY > 0 ? val : -1*val;
    }

    scrollTimeline(){
        // requestAnimationFrame(()=>{
        //     this.timelineAndTracks.style.transform = `translateX(${this.timelineScrollXOffset}px) translateY(${this.timelineScrollYOffset}px)`;
        //     this.scrollTimeline();
        // })
    }
    setDefaults(){
        const rect = $("#tracks").getBoundingClientRect();
        this.timelineTopPosition = rect.top;
        this.timelineBottomPosition = rect.bottom;
    }

    
}

export default EventManager;
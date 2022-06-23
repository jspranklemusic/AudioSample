import { $, globals } from "./globals";

class Timeline {
    audioPlayer = null
    element = $("#timeline");
    constructor(audioPlayer){
        this.audioPlayer = audioPlayer;
        // construct timeline marks
       this.drawTimeline();
       document.addEventListener("resize", ()=>{
        this.drawTimeline();
       })
    }
    drawTimeline(){
        let n = 0;
        const timeline = this.element;
        timeline.innerHTML = "";
        for(let i = 0; i < timeline.offsetWidth; i += (globals.pixelsPerSecond*10*globals.zoom)){
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
    }
}

export default Timeline;
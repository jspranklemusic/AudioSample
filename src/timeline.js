import { $, globals } from "./globals";

class Timeline {
    audioPlayer = null
    element = $("#timeline");
    constructor(audioPlayer){
        this.audioPlayer = audioPlayer;
        // construct timeline marks
       this.drawTimeline();
    }
    drawTimeline(){
        let n = 0;
        const timeline = this.element;
        timeline.innerHTML = "";

        const setDivisionsPerUnit = (zoom)=>{
            if(zoom <= 0.3){
                return 60;
            }
            if(zoom <= 0.4){
                return 30;
            }
            if(zoom <= 0.6){
                return 20;
            }
            if(zoom <= 0.8){
                return 15;
            }
            // if(zoom >= 1.2){
            //     return 8;
            // }

            return 10;
        }

        let divisionsPerUnit = 10 || setDivisionsPerUnit(globals.zoom);

        const setInc = zoom => {
            const inc = globals.pixelsPerSecond*divisionsPerUnit*zoom;
            return inc;
        };

        const inc = setInc(globals.zoom);

        let secondsDivision = 60;

        for(let i = 0; i < timeline.offsetWidth; i += inc){
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
            `;
            
            timeline.appendChild(span);

            if(!(n%60)){
                span.style.fontWeight = "bold";
                span.style.borderLeft = "2px solid black"
                span.innerText = n/60+"m";
            }else{
                span.innerText = n%60+"s";
        
            }
            n += divisionsPerUnit;
        
        }
        this.audioPlayer.moveCursor();
    }

    static formatSeconds(time) {
        let minutes = (time - time % 60)/60 + "";
        let seconds = Math.floor(time % 60) + "";
        if(seconds.length == 1)
            seconds = "0" + seconds;
        if(minutes.length == 1)
            minutes = "0" + minutes;
        let centiseconds = Math.floor((time % 1)*100) + "";
        if(centiseconds.length == 1)
            centiseconds = "0" + centiseconds;

        return `${minutes}:${seconds}:${centiseconds}`
    }
}

export default Timeline;
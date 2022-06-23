import { $ } from './globals.js'

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

export default Visualizer;
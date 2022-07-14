import Plugin from "./plugin";

const visualizerSchema = {
    nextNode: new AnalyserNode(new AudioContext()),
    track: {}
}

class Visualizer extends Plugin{
    constructor(args=visualizerSchema){
        const visualizer = new AnalyserNode(args.nextNode.context);
        super({...args, node: visualizer});
    }
}

export default Visualizer;
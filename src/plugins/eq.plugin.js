import Plugin from "./plugin";

const equalizerSchema = {
    nextNode: new GainNode(new AudioContext()),
    track: {}
}

class Equalizer extends Plugin{
    constructor(args=equalizerSchema){
        const lowshelf = new BiquadFilterNode(args.nextNode.context, { type: "lowshelf", frequency: 100 } );
        const low = new BiquadFilterNode(args.nextNode.context, { type: "peaking", frequency: 250 } );
        const mid = new BiquadFilterNode(args.nextNode.context, { type: "peaking", frequency: 1000 } );
        const high = new BiquadFilterNode(args.nextNode.context, { type: "peaking", frequency: 5000 } );
        const highshelf = new BiquadFilterNode(args.nextNode.context, { type: "highshelf", frequency: 8000 } );
        super({...args, node: highshelf});
    }
}

export default Equalizer;
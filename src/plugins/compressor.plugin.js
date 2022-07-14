import Plugin from "./plugin";

const compressorSchema = {
    nextNode: new GainNode(new AudioContext()),
    track: {}
}

class Compressor extends Plugin{
    constructor(args=compressorSchema){
        const compressorNode = new DynamicsCompressorNode(args.nextNode.context);
        super({...args, node: compressorNode});
    }
}

export default Compressor;
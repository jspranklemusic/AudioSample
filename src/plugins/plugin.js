
const pluginSchema = {
    nextNode: new GainNode(new AudioContext()),
    node: new GainNode(new AudioContext()),
    track: {}
}

class Plugin{
    id = 0;
    static objects = [];
    static count = 0;
    constructor(args=pluginSchema){
        this.node = args.node;
        this.context = args.nextNode.context;
        this.nextNode = args.nextNode;
        this.nextNode.prevNode = this;
        this.node.connect(this.nextNode);
        this.track = args.track
        this.track.plugins.push(this);
        this.prevNode = null;
        this.id = Plugin.count;
        Plugin.count++;
        Plugin.objects.push(this);
    }   
    destroy(){
        // reassign the nodes
        this.prevNode.nextNode = this.nextNode;
        this.node.disconnect();
        this.prevNode.disconnect();
        this.prevNode.connect(this.nextNode);
        this.node = null;
        this.prevNode = null;
        this.nextNode = null;
        // remove the reference from the track
        this.track.plugins.splice(this.track.plugins.findIndex(plugin => plugin.id == this.id),1);
        Plugin.objects.splice(Plugin.objects.findIndex(plugin => plugin.id == this.id),1);

    }
}

export default Plugin;
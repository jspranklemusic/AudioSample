const trackControls = (args = { id: 0, setChannelVolume:()=>{}, setChannelPanning:()=>{} }) => (
    /*html*/
    `
    <div class="audio-control-group channel">
        <b class="track-name" id="track-${args.id}-name">Track ${args.id}</b>
        <div class="audio-control">
            <b>Volume</b>
            <div class="center" id="volume-display-${args.id}">0.5</div>
            <div>
                <input value="0.5" min="0" max="1" step="0.01" type="range" id="volume-${args.id}">
            </div>
        </div>
        <div class="audio-control">
            <b>Panning (L/R)</b>
            <div class="center" id="panning-display-${args.id}">0</div>
            <div>
                <input value="0" min="-1" max="1" step="0.01" type="range" id="panning-${args.id}">
            </div>
        </div>
    </div>
    `
)

export default trackControls
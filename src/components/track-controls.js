const trackControls = (args = { id: 0, setChannelVolume:()=>{}, setChannelPanning:()=>{} }) => (
    /*html*/
    `
    <div class="audio-control-group channel">
        <b class="track-name" id="track-${args.id}-name">Track ${args.id}</b>
        <div class="mute-solo-container">
            <input type="checkbox" style="display: none;"/>
            <object class="btn-checkbox" data="/icons/volume-2.svg" type="image/svg+xml"></object>
            <input type="checkbox" style="display: none;"/>
            <span class="btn-checkbox">S</span>
            <input type="checkbox" style="display: none;"/>
            <span class="btn-checkbox record-enable"></span>

        </div>
        <div class="gain-pan-container">
            <div class="audio-control">
                <div>Gain</div>
                <div style="display: none" class="center" id="volume-display-${args.id}">0.5</div>
                <div>
                    <input value="0.5" min="0" max="1" step="0.01" type="range" id="volume-${args.id}">
                </div>
            </div>
            <div class="audio-control">
                <div>Pan</div>
                <div style="display: none" class="center" id="panning-display-${args.id}">0</div>
                <div>
                    <input value="0" min="-1" max="1" step="0.01" type="range" id="panning-${args.id}">
                </div>
            </div>
        </div>
      
    </div>
    `
)

export default trackControls
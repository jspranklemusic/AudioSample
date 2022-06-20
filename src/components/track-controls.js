const trackControls = (args = { id: 0, setChannelVolume:()=>{}, setChannelPanning:()=>{} }) => (
    /*html*/
    `
    <div class="audio-control-group channel">
        <b class="track-name" id="track-${args.id}-name">Track ${args.id}</b>
        <div class="mute-solo-container">
            <img class="mute-btn" id="mute-btn-${args.id}" src="/icons/volume-2.svg"/>
            <input id="solo-${args.id}" type="checkbox" style="display: none;"/>
            <label for="solo-${args.id}" >
                <span class="btn-checkbox solo">S</span>
            </label>
            <input id="record-enable-${args.id}"  type="checkbox" style="display: none;"/>
            <label for="record-enable-${args.id}">
                <span class="btn-checkbox record-enable"></span>
            </label>
            <img class="mute-btn" id="delete-track-${args.id}" src="/icons/trash-2.svg"/>
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
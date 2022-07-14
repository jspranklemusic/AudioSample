const pluginsList = e => {
    console.log(e)
    const rect = e.target.getBoundingClientRect();
    let values = ["Parametric EQ", "3-band EQ", "Compressor","Reverb","Delay","Saturation","Visualizer"];
    let pluginListItems = ``;
    values.forEach(value => {
        pluginListItems += //html
        `
            <li>${value}</li>
        `;
    })
    const html = //html 
    `
        <ul class="plugins-list">
            ${pluginListItems}
        </ul>
    `
    return html;
}

export default pluginsList
import { $$ } from '../globals.js'

export function changeRangeBg(e,elem){
    const element = e ? e.target : elem;
    const min = element.min 
    const max = element.max;
    const val = element.value;
    const percent = 100*((val - min)/(max - min));
    element.style.backgroundImage = `
    linear-gradient(90deg,
        var(--range-filled) 0%, 
        var(--range-filled) ${percent}%, 
        var(--range-empty) ${percent}%,
       var(--range-empty) 100%
    )
    `
}

// Custom Range Input
$$("input[type='range']").forEach(range => {
    changeRangeBg(false,range)
    range.addEventListener("input", e => {
        changeRangeBg(e);
    })
})
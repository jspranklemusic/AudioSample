import { $$ } from '../globals.js'

export function changeRangeBg(e,elem,hover){
    const element = e ? e.target : elem;
    const min = element.min 
    const max = element.max;
    const val = element.value;
    const percent = 100*((val - min)/(max - min));
    const emptyVar =  hover ? "rgb(240,200,200)" : "var(--range-empty)";
    element.style.transition = "0.15s";
    element.style.background = `
    linear-gradient(90deg,
        var(--range-filled) 0%, 
        var(--range-filled) ${percent}%, 
        ${emptyVar} ${percent}%,
       ${emptyVar} 100%
    )
    `
}

// Custom Range Input
$$("input[type='range']").forEach(range => {
    changeRangeBg(false,range)
    range.addEventListener("mouseover", e => {
        changeRangeBg(e,false,true);
    })
    range.addEventListener("input", e => {
        changeRangeBg(e,false,true);
    })
    range.addEventListener("mouseleave", e => {
        changeRangeBg(e,false);
    })
})
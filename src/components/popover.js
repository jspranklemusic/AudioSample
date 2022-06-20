import { $ } from "../globals.js";

const popover = (args={ 
        title: "Title Here", 
        content: "This is a dialog.", 
        type: "ok",
        direction: "right",
        yPosition: 100,
        xPosition: 100
    })=> {
    window.closePopup = ()=> {
        $(".popover-container").classList.remove("fadein");
        $(".popover-container").classList.add("fadeout");
        setTimeout(()=>{
            $("#popover-root").innerHTML = "";
        },500)
    }
    const types = {
        confirm: /*html*/ `
            <div class="confirm-buttons">
                <button onclick="closePopup()" class="button cancel">
                    Cancel
                </button>
                <button onclick="closePopup()" class="button confirm">
                    Confirm
                </button>
            </div>
        `,
        ok: /*html*/`
        <div class="confirm-button">
            <button onclick="closePopup()" class="button cancel">
                Ok
            </button>
        </div>
        `
    }
    const containerStyle = `
        top: ${args.yPosition}px;
        ${args.direction}: ${args.xPosition}px;
    `;
    return(/*html*/`
        <div style="${containerStyle}" class="popover-container fadein">
            <h2>${args.title}</h2>
            <p>${args.content}</p>
            ${types[args.type]}
        </div>
    `)
}

export default popover
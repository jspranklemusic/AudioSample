export const tasks = [];

onmessage = (e)=>{
    if(e.data.message == "new-task"){   
        e.data.func();
    }
    if(e.data.message == "draw-canvas"){
        
    }
}
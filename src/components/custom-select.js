const CustomSelect = (parentSelector,values,config) => {
    const parent = document.querySelector(parentSelector);
    const select = document.createElement("select");
    select.classList.add("custom-select")
    parent.appendChild(select);
    for(let key in config){
        select.setAttribute(key, config[key]);
    }
    values.forEach(value=>{
      const option = document.createElement("option");
      option.innerText = value;
      select.appendChild(option);
    })  
}

export default CustomSelect;
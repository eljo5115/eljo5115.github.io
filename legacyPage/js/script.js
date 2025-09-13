function windowLoaded(){
    console.log("Script Loaded");
    document.getElementById("button-1").addEventListener('click',button1clicked);
    document.getElementById("object-2").addEventListener('dblclick',object2dblClick);
    /*
    mouseover
    mouseleave 
    mousedown
    mouseup
    */
}
function button1clicked(){
    document.getElementById("button-1").classList.toggle("was_clicked");
}
function object2dblClick(){
    document.getElementById("object-2").classList.toggle("was-double-clicked")
}

window.onload = windowLoaded;
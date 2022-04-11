
    const url = "api.genius.com/songs/378195";
    const clientId = "Dd2C2QUaa5wbrW3BvkP7vkP5bEBMuzbLy_sJFmUiwE2tp41JgHc84szDvdvU3G66";
    const quoteButton = document.querySelector("#js-new-quote");


quoteButton.addEventListener("click", async function () {
    try{
        const response = await fetch(url, {
            client_id: clientId,
            redirect_uri: "assignment12.html",
            scope: "me",
            state:"",
            response_type:"code",
            headers:{
                 "Bearer": "ZGOZTBh6937U1LqcEwE47PjWF5ZSIIqcBUHV8XiAt3QDA2pyU7ZP7oqTIcUq7iFW"
            }
        });
        if(!response.ok){
            throw Error(response.statusText);
        }
        else{
            const json = await response.json();
            updateDisplay(json['song'], json['artist'], json['url']);
        }
    }finally{
    
    }
});

function updateDisplay(song,artist,link){
    const songText = document.querySelector("#js-song-text");
    const quoteText = document.querySelector("#js-quote-text");
    quoteText.textContent = quote;
    songText.textContent = song;
}



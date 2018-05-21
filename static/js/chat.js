document.addEventListener("DOMContentLoaded",function(){
    
    var socket = io();
    var Name = "Anonymous";
    var quotes;

    //get DOM elements
    var nameButton = document.getElementById("nameButton");
    var instructionButton = document.getElementById("instructionButton");
    var name =  document.getElementById("name");
    var msg = document.getElementById("msg");
    var msgBox = document.getElementById("msgBox");
    var send = document.getElementById("send");
    var rq = document.getElementById("rq");

    //Get quotes
    $.getJSON("static/js/book_quotes.json",function(quote){
      quotes = quote;     
    });
    
    //Show modal onload, modal is not closed by keyboard or mouse
    $("#instructionModal").modal({backdrop: 'static', keyboard: false});
    instructionButton.addEventListener("click",function(){
        $('#instructionModal').modal("hide");
        $("#nameModal").modal({backdrop: 'static', keyboard: false});
    })
    
    
    //when enter is clicked
    nameButton.addEventListener("click",function(){
        if(name.value != ""){
            Name = name.value;
        }
        $("#nameModal").modal("hide");
        game.state.start('play');
    });
    
    function sendMessage(){
        if(msg.value == ""){
            return;
        }
        let container = document.createElement("div");
        let text = document.createElement("span");
        container.classList.add("mt-2","text-right");
        text.innerHTML = msg.value;
        text.classList.add("bg-dark","text-light","px-1","py-1","rounded");
        container.appendChild(text);
        msgBox.appendChild(container);
        socket.emit("message",msg.value,Name);
        msg.value="";
    }
    
    //send button clicked
    send.addEventListener("click",sendMessage);
    msg.addEventListener("keypress",function(e){
        let key = e.keyCode || e.which;
        if(key == 13){
            sendMessage();
        }
    });

    //When RQ (random quote) button is clicked.
    rq.addEventListener("click",function(){
        var rand = Math.floor(Math.random()*100);
        let rquote = quotes[rand].quote+" -"+quotes[rand].author;
        let container = document.createElement("div");
        let text = document.createElement("span");
        container.classList.add("mt-2","text-right");
        text.innerHTML = rquote;
        text.classList.add("bg-dark","text-light","px-1","py-1","rounded");
        container.appendChild(text);
        msgBox.appendChild(container);
        socket.emit("message",rquote,Name);
    });

    function recievedMessage(rmsg,rname){
        let container = document.createElement("div");
        let rtext = document.createElement("span");
        rtext.innerHTML = "<strong>"+rname+"</strong>"+": "+rmsg;
        rtext.classList.add("bg-dark","text-light","px-1","py-1","rounded");
        container.classList.add("text-left","mt-2");
        container.appendChild(rtext);
        msgBox.appendChild(container);
        
    }

    //When message arrives from server.js call recievedMessage()
    socket.on("recieve_message",recievedMessage);
})
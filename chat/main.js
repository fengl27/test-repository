const choiceDiv = document.getElementById("choices");
const hostDiv = document.getElementById("hosting");
const chatDiv = document.getElementById("chat");
const hostIdEl = document.getElementById("hosting-txt");
const codeInput = document.getElementById("input-code");

const chatMessages = document.getElementById("chat-messages");

const chatSendTxt = document.getElementById("chat-send-message");
const chatSendButton = document.getElementById("chat-send-button");

const id = 100000 + Math.floor(900000 * Math.random());//your id
var peer = new Peer(id);
var conn;

function createMessage(side, txt) {
    var thing = document.createElement("div");
    thing.textContent = txt;
    thing.classList.add(side);
    return thing;
}

function handleData(data) {
    if(data === "connected") {
        //hosting, connected
        chatDiv.style.visibility = "visible";
        hostDiv.style.visibility = "hidden";
        return;
    }
    //this is a message
    chatMessages.appendChild(createMessage("peer-message", data.txt));
    chatMessages.scrollTo(chatMessages.scrollHeight);
}
function handleClose() {
    console.log("lolllll get dumped on");
    chatMessages.appendChild(createMessage("announcement-message", "He left..."));
    chatMessages.scrollTo(chatMessages.scrollHeight);
}
function sendMessage() {
    chatMessages.appendChild(createMessage("you-message", chatSendTxt.value));
    chatMessages.scrollTo(chatMessages.scrollHeight);
    conn.send({txt: chatSendTxt.value});
    chatSendTxt.value = "";//empty
}
chatSendTxt.addEventListener("keydown", function(e) {
    if(e.key === "Enter") {
        sendMessage();
    }
});
function host() {
    console.log("ID " + id);
    console.log("peer: ", peer);

    choiceDiv.hidden = true;
    hostDiv.style.visibility = "visible";
    hostIdEl.textContent = id;

    peer.on('connection', function(connection) {
        conn = connection;
        conn.on('data', handleData);
    });
}
function join() {
    conn = peer.connect(codeInput.value);
    // on open will be launch when you successfully connect to PeerServer
    console.log("hello, probably");
    conn.on('open', function(){
        // here you have conn.id
        console.log("IT TOTALLY WORKS!!!!");
        conn.send('connected');
        chatDiv.style.visibility = "visible";
        choiceDiv.hidden = true;
    });
    conn.on('data', handleData);
    conn.on('error', function() {
        console.log("ERROR ERROR ERROR");
        choiceDiv.hidden = true;
        hostDiv.style.visibility = "visible";
    });

    conn.on('close', handleClose);
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

//audio stuff
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");
  navigator.mediaDevices
    .getUserMedia(
      // constraints - only audio needed for this app
      {
        audio: true,
      },
    )

    // Success callback
    .then(audioStuff)

    // Error callback
    .catch((err) => {
      console.error(`The following getUserMedia error occurred: ${err}`);
    });
} else {
  console.log("getUserMedia not supported on your browser!");
}

var getPeakLevel = () => 0;

function audioStuff(stream) {
    // Create an audio context and connect the stream source to an analyzer node
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyzer = context.createAnalyser();
    source.connect(analyzer);

    // The array we will put sound wave data in
    const array = new Uint8Array(analyzer.fftSize);

    getPeakLevel = function() {
        analyzer.getByteTimeDomainData(array);
        return array.reduce((max, current) => {
            return Math.max(max, Math.abs(current - 128))
        }, 0) / 127;
    }
    
}

var pos = {x: canvas.width/2, y: canvas.height/2};
var scale = 1;
var mouse = {
    x: 0, y: 0
};
function mouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}
function keyPress(e) {
    if(e.key === "p") {
        console.log("pos");
        pos.x = mouse.x - 128 * scale; pos.y = mouse.y - 128 * scale;
    }
    else if(e.key === "s") {
        console.log("scale");
        var prevScale = scale;
        scale = Math.abs(mouse.x-(pos.x+128*scale)) * 0.01;
        pos.x -= (scale - prevScale) * 128;
        pos.y -= (scale - prevScale) * 128;
    }
}
document.body.addEventListener("mousemove", mouseMove);
document.body.addEventListener("keydown", keyPress);
var past = [];


var images = ['idle1.png', "idle2.png", "talk-low.png", "talk-mid.png", "talk-high.png"];
var assets = {};
for(var i = 0; i < images.length; i ++) {
    let bob = new Image();
    bob.src = "assets/" + images[i];
    assets[images[i].substring(0, images[i].length - 4)] = bob;
}
var frame = function() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var vol = getPeakLevel();
    past.push(vol);
    if(past.length > 8) {
        past.splice(0, 1);
    }
    //var loudAmt = past.filter(vol => vol>0.1).length;
    var loudAmt = past.reduce((total, curr) => {return total + curr;}, 0) * 3;
    ctx.drawImage(assets[loudAmt>6?"talk-high": loudAmt > 3?"talk-mid": loudAmt > 0.5?"talk-low":Date.now()%500<250?"idle1":"idle2"], pos.x, pos.y, 256 * scale, 256 * scale);
    window.requestAnimationFrame(frame);
};
window.requestAnimationFrame(frame);
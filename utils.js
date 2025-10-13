var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");


canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const width = canvas.width;
const height = canvas.height;

var enemySize = width * 3 / 80;
var keys = [];
var projectiles = [];
var player = null;
var deadTime = 0;
var time = 0;
// player setting
var friction = 0.5; //out of 1, default 0.85
var maxSpeed = width / 80; //default 10
var playerAcceleration = width * 3 / 400; //default 2

// game settings
var SPAWNER_RATE = 200; //in frames, default 80
var SMALL_RING_RATE = 225; //in frames, default 225
var LARGE_RING_RATE = 750; //in frames, default 750
var VERTICAL_SHOWER_RATE = 800; //in frames, default 500
var BOTTOM_RING_RATE = 300; //in frames, default 300
var LOOPER_RATE = 80; //in frames, default 80;
var FOLLOWER_RATE = 160; //in frames, default 80;

var frameCount = 0;
var currPhase = 0;
var phases = [
    {
        time: 900,
        stats: [0, 100, 0, 0, 150, 0, 0]//only rings (not even curvers)
    },
    {
        time: 900,
        stats: [0, 200, 0, 0, 300, 60, 0]//only rings
    },
    {
        time: 600,
        stats: [0, 0, 0, 50, 0, 60, 0]//trans phase
    },
    {
        time: 900,
        stats: [0, 225, 550, 200, 325, 70, 0]//add shower
    },
    {
        time: 600,
        stats: [100, 0, 0, 0, 0, 60, 0]//trans phase
    },
    {
        time: 900,
        stats: [200, 225, 600, 400, 325, 90, 0]//add spawner
    },
    {
        time: 600,
        stats: [0, 0, 0, 0, 0, 60, 80]//trans phase
    },
    {
        time: 900,
        stats: [200, 225, 600, 400, 300, 90, 160]//add follower
    },
    {
        time: 900,
        stats: [200, 225, 600, 400, 300, 80, 160]// finalmost
    },
    {
        time: 900,
        stats: [2, 0, 0, 0, 0, 0, 0]// final
    }
];
for(var i = 1; i < phases.length; i ++) {
    //make the time the frame count instead of length
    phases[i].time += phases[i - 1].time;
}
function setStats(array) {
    [SPAWNER_RATE, SMALL_RING_RATE, LARGE_RING_RATE, VERTICAL_SHOWER_RATE, BOTTOM_RING_RATE, LOOPER_RATE, FOLLOWER_RATE] = array.stats;
}
var flashbang = 0;
function doPhases() {
    if(frameCount > phases[currPhase].time && currPhase !== phases.length - 1) {
        currPhase ++;
        console.log("NEXT PHASE :)");
        setStats(phases[currPhase]);
        makeGameEvil();
        screenShake.shake(Math.random() * 10 - 5, Math.random() * 10 - 5);
        flashbang = 1;
        document.getElementById("background").style.opacity = (100 - 10 * currPhase) + "%";
    }
    if(frameCount % 60 === 0) {
        console.log("second " + (frameCount / 60));
    }
}
var GAME_EVILNESS = 2/3; //... erm divide all the rates by this number... how evil :D... but increase score by more!
var keyPressed = function(e){keys[e.keyCode] = true;};
var keyReleased = function(e){keys[e.keyCode] = false;};
document.body.addEventListener("keydown", keyPressed);
document.body.addEventListener("keyup", keyReleased);
var makeGameEvil = function(){//evil
    SPAWNER_RATE /= GAME_EVILNESS;
    SPAWNER_RATE = Math.ceil(SPAWNER_RATE);
    SMALL_RING_RATE /= GAME_EVILNESS;
    SMALL_RING_RATE = Math.ceil(SMALL_RING_RATE);
    LARGE_RING_RATE /= GAME_EVILNESS;
    LARGE_RING_RATE = Math.ceil(LARGE_RING_RATE);
    VERTICAL_SHOWER_RATE /= GAME_EVILNESS;
    VERTICAL_SHOWER_RATE = Math.ceil(VERTICAL_SHOWER_RATE);
    BOTTOM_RING_RATE /= GAME_EVILNESS;
    BOTTOM_RING_RATE = Math.ceil(BOTTOM_RING_RATE);
    LOOPER_RATE /= GAME_EVILNESS;
    LOOPER_RATE = Math.ceil(LOOPER_RATE);
};

var screenShake = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    shake: function(x, y) {
        x = x * width / 400;
        y = y * height / 400;
        var x = x? x: Math.random() * 10 - 5;
        var y = y? y: Math.random() * 10 - 5;
        this.vx += x;
        this.vy += y;
        this.x += Math.random() * 15 - 7.5;
        this.y += Math.random() * 15 - 7.5;
    },
    update: function() {
        this.vx -= this.x / 10;
        this.vy -= this.y / 10;
        this.vx *= 0.8;
        this.vy *= 0.8;
        this.x += this.vx;
        this.y += this.vy;
    }
};
//cool circle effect {
var CoolCircle = function(size, tailLength, r, g, b) {
    this.tLength = tailLength;
    this.size = size;
    this.prevPos = [];
    this.col = [r, g, b];
};
CoolCircle.prototype.display = function(x, y,sizeMult, opacity) {
    var opacity = opacity? opacity / 255: 1;
    sizeMult = sizeMult||1;
    if(this.prevPos.length === 0) {
        this.prevPos.push({x: x, y: y});
    }
    var lastPos = this.prevPos[this.prevPos.length - 1];
    var vel = {
        x: x - lastPos.x,
        y: y - lastPos.y
    };
    var mag = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    if(opacity === 255) {
        var rotated = {//left
            x: vel.y,
            y: -vel.x
        };
        rotated.x *= this.size / 2 / mag*sizeMult;
        rotated.y *= this.size / 2 / mag*sizeMult;
        ctx.fillStyle = "rgba(150, 150, 150, " + opacity + ")";
        ctx.beginPath();//draw a triangle
        ctx.moveTo(x + rotated.x, y + rotated.y);
        ctx.lineTo(x - rotated.x, y - rotated.y);
        ctx.lineTo(this.prevPos[0].x, this.prevPos[0].y);
        ctx.fill();
    }
    this.prevPos.push({x: x, y: y});
    if(this.prevPos.length > this.tLength) {
        this.prevPos.splice(0, 1);
    }
    ctx.save();
    ctx.fillStyle = "rgba(" + this.col[0] + ", " + this.col[1] + ", " + this.col[2] + ", " + opacity + ")";
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(vel.y, vel.x));
    ellipse(0, 0, this.size * (1 + mag / 50), this.size);
    ctx.restore();
};
// }
function quadEaseOut(t) {
    var t = Math.min(t, 1);
    return (2 - t) * t;
}
function quadEaseIn(t) {
    var t = Math.min(Math.max(t, 0), 1);
    return t * t;
}

function ellipse(x, y, w, h, isStroke) {
    ctx.beginPath();
    var w = w / 2;
    var h = h / 2;
    ctx.moveTo(x + w, y);
    for(var deg = 0; deg < Math.PI * 2; deg += Math.PI / 20) {
        ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
    }
    if(isStroke) {
        ctx.closePath();
        ctx.stroke();
    }
    else {
        ctx.fill();
    }
}
function fill(r, g, b, a) {
    if(arguments.length === 3) {
        ctx.fillStyle = "rgb(" + [r,g,b].join(", ") + ")";
    }
    else {
        ctx.fillStyle = "rgba(" + [r,g,b,a/255].join(", ") + ")";
    }
}
function arc(x, y, w, h, start, stop) {
    ctx.beginPath();
    var w = w / 2;
    var h = h / 2;
    var start = start * Math.PI / 180;
    var stop = stop * Math.PI / 180;
    ctx.moveTo(x, y);
    for(var deg = start; deg < stop; deg += Math.PI / 10) {
        ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
    }
    deg = stop;
    ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
    ctx.closePath();
    ctx.fill();
}
function random(a, b) {
    if(arguments.length === 1) {
        return Math.random() * a;
    }
    else {
        return Math.random() * (b - a) + a;
    }
}
function cos(deg) {
    return Math.cos(deg * Math.PI / 180);
}
function sin(deg) {
    return Math.sin(deg * Math.PI / 180);
}
function lerp(x, y, t) {
    return x + (y - x) * t;
}
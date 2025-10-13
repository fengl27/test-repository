var tiles = [];
var screenSize = new Vect(parseInt(prompt("x size")), parseInt(prompt("y size")));
var zoom = 1.1;
var tileSize = new Vect(Math.round(width / screenSize.x), Math.round(height / screenSize.y));
tileSize.y = tileSize.x;
//var tileSize = new Vect(width / 40, width / 40);
//screenSize.x = Math.floor(width / tileSize.x);
//screenSize.y = Math.floor(height / tileSize.y);

for(var i = 0; i < screenSize.x * screenSize.y; i ++) {
    tiles.push([]);
}
var getTile = function(x, y) {
    return tiles[x + y * screenSize.x];
};
var setTile = function(x, y, val) {
    tiles[x + y * screenSize.x].push(val);
};
background(0);

var rects = [];
var drawRect = function(p1, p2, addToRects) {
    var p1 = new Vect(p1.x + 0.15 * tileSize.x, p1.y + 0.15 * tileSize.y);
    var p1br = Vect.add(p1, Vect.mult(tileSize, 0.7));
    var p2 = new Vect(p2.x + 0.15 * tileSize.x, p2.y + 0.15 * tileSize.y);
    var p2br = Vect.add(p2, Vect.mult(tileSize, 0.7));
    if(addToRects) {
        return [
            new Vect(
                Math.round(Math.min(p1.x, p2.x)),
                Math.round(Math.min(p1.y, p2.y))
            ),
            new Vect(
                Math.round(Math.max(p1br.x, p2br.x)),
                Math.round(Math.max(p1br.y, p2br.y))
            ),
            false
        ];
    }
    else {
        rect(
            Math.min(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.max(p1br.x, p2br.x) - Math.min(p1.x, p2.x),
            Math.max(p1br.y, p2br.y) - Math.min(p1.y, p2.y)
        );
    }
};

var highestDist = 0;
var highestDistRect = 0;
var doThing = function(pos, dist, dir) {
    var availableAngles = [];
    for(var i = 0; i < 4; i ++) {
        var nextPos = Vect.get(pos);
        nextPos.add(Math.round(Math.cos(i * Math.PI / 2)), Math.round(Math.sin(i * Math.PI / 2)));
        availableAngles.push(Vect.get(nextPos));
    }
    var output = [];
    function getThing(dir) {
        var i = dir;
        var nextPos = availableAngles[i];
        availableAngles.splice(i, 1);
        if(nextPos.x >= 0 && nextPos.x < screenSize.x && nextPos.y >= 0 && nextPos.y < screenSize.y && !getTile(nextPos.x, nextPos.y).length) {
            var newRect = drawRect(Vect.mult(pos, tileSize), Vect.mult(nextPos, tileSize), true);
            newRect.push(Vect.get(pos));
            newRect.push(Vect.get(nextPos));
            
            output.push([nextPos, dist + 1, dir, newRect]);
        }
    }
    if(Math.random() < 0.2) {
        getThing(dir);
    }
    while(availableAngles.length) {
        getThing(Math.floor(Math.random() * availableAngles.length));
    }
    return output;
};

fill(255, 255, 255);
background(0, 0, 0);

var thingsToDo = [[new Vect(0, 0), 0, 0]];
var touchedRects = [];

var checkCollisions = function(tl, br, pos, size) {
    return pos.x >= tl.x && pos.x + size.x <= br.x && pos.y >= tl.y && pos.y + size.y <= br.y;
};
var checkAllCollisions = function(pos, size) {
    var collision = true;
    for(var i = 0; i < rects.length; i ++) {
        if(checkCollisions(rects[i][0], rects[i][1], pos, size)) {
            //fill(255, 0, 0);
            //rect(rects[i][0].x, rects[i][0].y, rects[i][1].x - rects[i][0].x, rects[i][1].y - rects[i][0].y);
            collision = false;
            if(!rects[i][2]) {
                rects[i][2] = true;
                touchedRects.push(rects[i]);
            }
            if(rects[i][5]) {
                background(0, 255, 0);
            }
        }
    }
    return collision;
};
var player = {
    pos: new Vect(0.3 * tileSize.x, 0.3 * tileSize.y),
    size: new Vect(tileSize.x * 0.4, tileSize.y * 0.4),
    dir: new Vect(1, 0)
};
player.displayPos = Vect.get(player.pos);

var keys = [];
var keyPressed = function(e) {
    keys[e.keyCode] = true;
};
var keyReleased = function(e) {
    keys[e.keyCode] = false;
};
document.body.addEventListener("keydown", keyPressed);
document.body.addEventListener("keyup", keyReleased);
var drawTlBr = function(tl, br) {
    rect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
};
var genMaze = function() {
    var count = 0;
    while(++count < 100 && thingsToDo.length > 0) {
        var largest = thingsToDo.length - 1;
        var small = Math.max(0, thingsToDo.length - 5);
        //var i = thingsToDo.length - 1;
        var i = Math.floor(Math.random() * (largest - small) + small);
        
        if(thingsToDo[i][3]) {
            var newRect = thingsToDo[i][3];
            if(!getTile(newRect[4].x, newRect[4].y).length) {
                setTile(newRect[3].x, newRect[3].y, newRect);
                setTile(newRect[4].x, newRect[4].y, newRect);
                //rect(newRect[3].x * tileSize.x, newRect[3].y * tileSize.y, tileSize.x, tileSize.y);
                drawTlBr(newRect[0], newRect[1]);
                //rect(newRect[4].x * tileSize.x, newRect[4].y * tileSize.y, tileSize.x, tileSize.y);
                drawTlBr(newRect[0], newRect[1]);
                var dist = thingsToDo[i][1] - 1;
                newRect[6] = dist;
                if(dist > highestDist) {
                    highestDist = dist;
                    highestDistRect = newRect;
                }
                rects.push(newRect);
                //return;
            }
        }
        var thing = doThing(thingsToDo[i][0], thingsToDo[i][1], thingsToDo[i][2]);
        thingsToDo.splice(i, 1);
        if(thing.length) {
            var randId = Math.floor(Math.random() * thing.length);
            thingsToDo.push(thing[randId]);
            thing.splice(randId, 1);
            for(var j = 0; j < thing.length; j ++) {
                thingsToDo.splice(Math.floor(Math.random() * thingsToDo.length), 0, thing[j]);
            }
        }
    }
    if(thingsToDo.length === 0) {
        highestDistRect[5] = true;
    }
};
var frame = function() {
    background(0, 0, 0);
    var moveAmount = keys[16]? 0.2: 0.1;
    var oldPY = player.pos.y;
    var oldPX = player.pos.x;
    player.pos.y += tileSize.y * moveAmount * (!!keys[40] - !!keys[38]);
    if(checkAllCollisions(player.pos, player.size)) {
        player.pos.y = oldPY;
    }
    player.pos.x += tileSize.x * moveAmount * (!!keys[39] - !!keys[37]);
    if(checkAllCollisions(player.pos, player.size)) {
        player.pos.x = oldPX;
    }
    fill(255, 255, 255);
    if(zoom !== 1) {
        ctx.translate(-player.displayPos.x * zoom, -player.displayPos.y * zoom);
        ctx.translate(width / 2, height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-player.size.x / 2, -player.size.y / 2);
    }
    for(var i = 0; i < rects.length; i ++) {
        if(rects[i][2]) {
            fill(255, 0, 0);
        }
        else {
            fill(255, 255, 255);
        }
        drawTlBr(rects[i][0], rects[i][1]);
    }
    fill(0, 255, 0);
    drawTlBr(highestDistRect[0], highestDistRect[1]);
    fill(0, 125, 255);
    player.displayPos.x += (player.pos.x - player.displayPos.x) / 5;
    player.displayPos.y += (player.pos.y - player.displayPos.y) / 5;
    rect(player.pos.x, player.pos.y, player.size.x, player.size.y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
};

var draw = function() {
    if(thingsToDo.length) {
        genMaze();
    }
    else {
        frame();
    }
    window.requestAnimationFrame(draw);
};
window.requestAnimationFrame(draw);


setStats(phases[currPhase]);
makeGameEvil();
var draw = function() {
    if(player.lives > 0){
        frameCount ++;
        ctx.save();
        ctx.fillStyle = "rgb(45, 17, 65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        screenShake.update();
        ctx.translate(screenShake.x, screenShake.y);
        time += GAME_EVILNESS;
        //fill(0,0,0,40);
        //rect(-50,-50,width + 100,height + 100);
        
        doPhases();

        if(frameCount % SPAWNER_RATE === 0) {
            projectiles.push(new Spawner());
        }
        if(frameCount % SMALL_RING_RATE === 0){ //small ring
            for(var i = 0;i<360;i+=random(30,100)){
                var vel = new Vect(cos(i),sin(i));
                projectiles.push(new Straight(new Vect(width/2,height/2),vel,100,0.5));
            }
        }
        if(frameCount % LARGE_RING_RATE === LARGE_RING_RATE-1){ //large ring
            for(var i = frameCount%30;i<360;i+=45){
                var vel = new Vect(cos(i),sin(i));
                projectiles.push(new Straight(new Vect(width/2,height/2),vel,100,0.5));
            }
           
        }
        if(frameCount % VERTICAL_SHOWER_RATE === VERTICAL_SHOWER_RATE-1){ //vertical shower
            if(Math.random()>0.5){
                for(var x = 0;x<width;x += random(75,140) * width / 400){
                    projectiles.push(new Straight(new Vect(x,10),new Vect(0,1),100,0.5));
                }
            }else{
                for(var x = 0;x<width;x += random(75,140) * width / 400){
                    projectiles.push(new Straight(new Vect(x,height-10),new Vect(0,-1),100,0.5));
                }
                
            }
        }
        if(frameCount % BOTTOM_RING_RATE === BOTTOM_RING_RATE-1){ //bottom ring
            if(Math.random()>0.5){
                var dir = Math.random()>0.5? -1:1;
                for(var i = 0;i<360;i+=random(20,40)){
                    var vel = new Vect(dir * cos(i),dir * sin(i));
                    projectiles.push(new Straight(new Vect(width/2,height/2+height*dir/2),vel,100,0.5));
                }
                
            }else{
                var dir = Math.random()>0.5? -1:1;
                for(var i = 0;i<360;i+=random(20,40)){
                    var vel = new Vect(dir * -sin(i),dir * cos(i));
                    projectiles.push(new Straight(new Vect(width/2+width*dir/2,height/2),vel,100,0.5));
                }
                
            }
        }
        if(frameCount%LOOPER_RATE === LOOPER_RATE-1){ //looper
            projectiles.push(new Looper(new Vect(random(width),random(height)),random(50,100),random(3,5),random(100,480)));
        }
        if(frameCount%FOLLOWER_RATE === FOLLOWER_RATE-1){
            for(var i = 0;i<2;i++){
                var diry = Math.random()>0.5? -1:1;
                var dirx = Math.random()>0.5? -1:1;
                var vel = new Vect(Math.random()*-dirx * 2,Math.random()*-diry * 2);
                projectiles.push(new Follower(new Vect(width/2+width*dirx/2,height/2+height*diry/2),vel,100,0.5));
            }
        }
        for(var i = projectiles.length - 1;i >= 0;i--){
            projectiles[i].go();
            if(projectiles[i].dead){
                projectiles.splice(i,1);
            }
        }
        player.go();
        
        ctx.restore();

        fill(118, 83, 143, 150);
        //textAlign(CENTER,CENTER);
        //textSize(50);
        //text(player.lives + " lives",width/2,50);
        ctx.strokeStyle = "white";
        ctx.lineWidth = player.size / 5;
        var x = width * 15/16;
        var y = height / 16;
        var w = width / 32;
        var h = height / 32;
        ellipse(x, y, width * 7 / 80, height * 7 / 80);
        ctx.beginPath();
        ctx.moveTo(x + w, y);
        var endDeg = Math.min(player.lives, 3) * Math.PI * 2/3;
        for(var deg = 0; deg < endDeg; deg += Math.PI * 2/30) {
            ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
        }
        deg = endDeg;
        ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
        ctx.stroke();
        if(player.lives > 3) {
            var w = w / 2;
            var h = h / 2;
            ctx.beginPath();
            ctx.moveTo(x + w, y);
            var endDeg = Math.min(player.lives - 3, 3) * Math.PI * 2/3;
            for(var deg = 0; deg < endDeg; deg += Math.PI * 2/30) {
                ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
            }
            deg = endDeg;
            ctx.lineTo(x + Math.cos(deg) * w, y + Math.sin(deg) * h);
            ctx.stroke();
        }
    }
    else{
        deadTime++;
        fill(0,0,0,255);
        ctx.fillRect(-50,-50,width + 100,height - Math.max(50-deadTime,0)/50*(height)+100);
        if(player.deathAnim(deadTime-50)){
            fill(255,255,255,quadEaseIn((deadTime-150)/50)*55);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = width / 8 + "px Arial";
            ctx.fillText("YOU DIED RIP", width / 2, height / 2);
            ctx.fillText("TIME: " + (frameCount / 60).toFixed(2), width / 2, height / 2 + width / 8);
            ctx.fillText("PHASE: " + (1 + currPhase) + "/10", width/2,height/2 + width / 4);

            if(keys[32]) {
                player = new Player();
                projectiles = [];
                frameCount = 0;
                currPhase = 0;
                setStats(phases[currPhase]);
                makeGameEvil();
            }
        }
    }

    ctx.fillStyle = "rgba(255, 255, 255, " + flashbang + ")";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, " + flashbang + ")";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = width / 8 + "px Arial";
    ctx.fillText("CREDIT", width / 2, height / 2 - width / 8);
    ctx.fillText("TO", width / 2, height / 2);
    ctx.fillText("JAYDEN S", width / 2, height / 2 + width / 8);
    flashbang *= 0.95;

    window.requestAnimationFrame(draw);
};
draw();
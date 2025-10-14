var Player = function(){
    this.pos = new Vect(width/2,height/2 +height/4);
    this.vel = new Vect();
    this.accel = playerAcceleration;
    this.maxSpeed = maxSpeed;
    this.lives = 3;
    this.Iframes = 20;
    this.prevPos = [];
    this.size = canvas.width / 20;
    this.display = function(){
        fill(48, 113, 181, 5);
        this.prevPos.push({x: this.pos.x, y: this.pos.y});
        if(this.prevPos.length > 2) {
            this.prevPos.splice(0, 1);
        }
        var size = this.size * 1.5;
        for(var i = 0; i < 10; i ++) {
            var idx = Math.max(this.prevPos.length - 1 - i, 0);
            ellipse(this.prevPos[idx].x, this.prevPos[idx].y, size, size);
            size += this.size / 4;
        }
        if(this.Iframes%10<6){
            if(this.Iframes!==0){
                fill(143, 62, 75);
            }else{
                fill(48, 113, 181);
            }
        }else{
            fill(255, 255, 255);
        }
        ellipse(this.pos.x,this.pos.y,this.size,this.size);
        if(this.Iframes!==0&&this.Iframes%10<6){
            fill(45, 17, 65);
            arc(this.pos.x,this.pos.y,this.size * 3/4,this.size * 3/4,120*this.lives+10,360);
        }
        if(this.lives === 1 && frameCount % 30 < 16) {
            fill(255, 255, 255);
            ellipse(this.pos.x, this.pos.y + this.size * 7/20, this.size / 4, this.size / 4);
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            ctx.scale(this.size / 20, this.size / 20);
            ctx.beginPath();
            ctx.moveTo(2, 2);
            ctx.lineTo(-2, 2);
            ctx.lineTo(-2.75, -9);
            ctx.lineTo(2.5, -10);
            ctx.fill();
            ctx.restore();
        }
    };
    this.update = function(){
        var moving = false;
        if(keys[37]){//lef
            moving = true;
            this.vel.x -= this.accel;
        }
        if(keys[39]){//right
            moving = true;
            this.vel.x += this.accel;
        }
        if(keys[38]){//uup
            moving = true;
            this.vel.y -= this.accel;
        }
        if(keys[40]){//doown
            moving = true;
            this.vel.y += this.accel;
        }
        this.vel.mult(friction);
        if(this.vel.x * this.vel.x + this.vel.y * this.vel.y > this.maxSpeed * this.maxSpeed){
            this.vel.normalize();
            this.vel.mult(this.maxSpeed);
        }
        this.pos.add(this.vel);
        if(this.pos.x - this.size / 2 < 0){
            this.pos.x = this.size / 2;
        }
        if(this.pos.x + this.size / 2 > width){
            this.pos.x = width - this.size / 2;
        }
        if(this.pos.y - this.size / 2 < 0){
            this.pos.y = this.size / 2;
        }
        if(this.pos.y + this.size / 2 > height){
            this.pos.y = height - this.size / 2;
        }
        for(var i = 0;i<projectiles.length;i++){
            if(Vect.dist(this.pos.x,this.pos.y,projectiles[i].pos.x,projectiles[i].pos.y) < enemySize&&projectiles[i].active){
                if(projectiles[i].isHeal) {
                    this.lives ++;
                }
                else if(this.Iframes===0){
                    this.lives --;
                    this.Iframes = 60;
                    
                    var dir = {
                        x: this.pos.x - projectiles[i].pos.x,
                        y: this.pos.y - projectiles[i].pos.y
                    };
                    var mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                    dir.x *= 15 / mag;
                    dir.y *= 15 / mag;
                    screenShake.shake(dir.x, dir.y);
                }
                
                projectiles[i].onDeath();
            }
        }
        this.Iframes = Math.max(0,this.Iframes-1);
    };
    this.go = function(){
        this.update();
        this.display();
    };
    this.deathAnim = function(t){
        var lerpVal = quadEaseIn((t-50)/50);
        fill(48, 113, 181,lerpVal * 255);
        ellipse(
            lerp(this.pos.x,width/2,lerpVal),
            lerp(this.pos.y,height/4,lerpVal),
            lerp(this.size,width/8,lerpVal),
            lerp(this.size,height/8,lerpVal)
        );
        ctx.strokeStyle = "rgba(255, 237, 135," + quadEaseIn((t-100)/40) + ")";
        ctx.lineWidth = player.size / 4;
        ellipse(width / 2,height*3/16,width / 10,height/40, true);
        if(t>100){
            return true;
        }else{
            return false;
        }
    };
};
player = new Player();
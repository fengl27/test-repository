class Straight {
    constructor(p, v, gofast, fastmult) {
        this.pos = Vect.get(p);
        this.vel = Vect.get(v);
        this.vel.mult(width / 400);//width used to be always 400, trying to make it adaptable
        this.isHeal = Math.random() < 0.01 && player.lives < 6;
        if (this.isHeal) {
            this.circle = new CoolCircle(enemySize, 5, 48, 113, 181);
            this.vel = Vect.sub(player.pos, this.pos);
            this.vel.div(60);
        }
        else {
            this.circle = new CoolCircle(enemySize, 5, 218, 63, 121);
        }
        this.life = 0;
        this.gofast = gofast;
        this.fastmult = fastmult * width / 400;
        this.dead = false;
        this.deathAnim = 0;
        this.active = false;
    }
    onDeath() {
        this.deathAnim++;
        this.active = false;
    }
    display() {
        if (this.deathAnim) {
            var size = enemySize * (1 + this.deathAnim / 5);
            var opacity = (1 - this.deathAnim / 10) * 255;
            if (this.isHeal) {
                fill(48, 113, 181, opacity);
            }
            else {
                fill(218, 63, 121, opacity);
            }
            ellipse(this.pos.x, this.pos.y, size, size);
        }
        else {
            var easeout = quadEaseOut(this.life * 2 / this.gofast);
            var size = (easeout + 1) / 2;
            var opacity = easeout * 255;
            this.circle.display(this.pos.x, this.pos.y, size, opacity);
        }
    }
    update() {
        if (this.deathAnim) {
            this.deathAnim++;
            if (this.deathAnim > 10) {
                this.dead = true;
            }
        }
        else {
            this.life++;
            this.active = this.life >= this.gofast / 2;
            if (this.life >= this.gofast) {
                var mag = this.vel.mag();
                this.vel.mult((this.fastmult + mag) / mag);
            }
            else {
                this.vel.mult(0.98);
            }
            this.pos.add(this.vel);
            if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
                this.deathAnim++;
                this.vel.mult(-0.1);
                var times = 0;
                while ((this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) && ++times < 10) {
                    this.pos.add(this.vel);
                }
            }
        }
    }
    go() {
        this.update();
        this.display();
    }
}
class Spawner {
    constructor() {
        this.pos = new Vect(
            Math.round(Math.random()) * width,
            Math.round(Math.random()) * height
        );
        if (Math.random() < 0.5) {
            this.nextPos = { x: width - this.pos.x, y: this.pos.y };
        }
        else {
            this.nextPos = { x: this.pos.x, y: height - this.pos.y };
        }
        this.life = 0;
        this.dead = false;
    }
    go() {
        this.life++;
        if (this.life > 120) {
            this.dead = true;
        }
        if (this.life % 3 === 0 && Math.random() < 0.5) {
            var pos = new Vect(
                lerp(this.pos.x, this.nextPos.x, this.life / 120),
                lerp(this.pos.y, this.nextPos.y, this.life / 120)
            );

            var vel = Vect.normalize(Vect.sub(player.pos, pos));
            vel.x += random(-0.2, 0.2);
            vel.y += random(-0.2, 0.2);
            projectiles.push(new Straight(pos, vel, 120, 0.15));
        }
    }
}
class Looper {
    constructor(center, rad, speed, life) {
        this.center = Vect.get(center);
        this.rad = rad * width / 400;//making width adaptable
        this.speed = speed;
        this.dead = false;
        this.deathAnim = 0;
        this.time = 0;
        this.life = life;
        this.active = false;
        this.pos = new Vect(-50, -50);
        this.isHeal = Math.random() < 0.1 && player.lives < 6;
        if (this.isHeal) {
            this.circle = new CoolCircle(enemySize, 5, 48, 113, 181);
            this.speed /= 2;
        }
        else {
            this.circle = new CoolCircle(enemySize, 7, 255, 0, 162);
        }
        this.rotation = Math.random() * 360;
        this.displayPos = this.getPos();
    }
    onDeath() {
        this.deathAnim++;
    }
    getPos() {
        return {
            x: cos(this.rotation) * this.rad + this.center.x,
            y: sin(this.rotation) * this.rad + this.center.y
        };
    }
    display() {
        ctx.save();
        ctx.translate(this.center.x, this.center.y);
        if (this.deathAnim) {
            var scaleVal = 1 - quadEaseIn(this.deathAnim / 20);
            ctx.scale(scaleVal, scaleVal);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, " + quadEaseOut(this.time / 20) / 5 + ")";
        ctx.lineWidth = enemySize * 2/3;
        ellipse(0, 0, this.rad * 2, this.rad * 2, true);
        fill(255, 0, 162);
        if (this.time < 50) {
            //display flashing transparent purple thing to represent danger
            if (this.isHeal) {
                fill(48, 113, 181, sin(this.time * 20) * 80 + 80);
            }
            else {
                fill(255, 0, 162, sin(this.time * 20) * 80 + 80);
            }
            ellipse(this.displayPos.x - this.center.x, this.displayPos.y - this.center.y, enemySize, enemySize);
        }
        else if (this.deathAnim > 0) {
            var size = enemySize * (1 + this.deathAnim / 4);
            var opacity = (1 - this.deathAnim / 10) * 255;
            if (this.isHeal) {
                fill(48, 113, 181, opacity);
            }
            else {
                fill(255, 0, 162, opacity);
            }
            ellipse(this.pos.x - this.center.x, this.pos.y - this.center.y, size, size);
        }
        else {
            this.circle.display(this.pos.x - this.center.x, this.pos.y - this.center.y);
        }
        ctx.restore();
    }
    update() {
        if (this.deathAnim > 0) {
            this.active = false;
            this.deathAnim++;
            if (this.deathAnim >= 20) {
                this.dead = true;
            }
            this.rotation += quadEaseOut((this.time - 50) / 20) * this.speed;
            this.pos = this.getPos();
            return;
        }
        this.time++;
        this.active = this.time >= 50 && this.deathAnim === 0;
        if (this.time >= 50) {
            this.rotation += quadEaseOut((this.time - 50) / 20) * this.speed;
            this.pos = this.getPos();
        }
        if (this.time > this.life) {
            this.deathAnim++;
        }
    }
    go() {
        this.update();
        this.display();
    }
}

class Follower {
    constructor(pos, vel, gofast, fastspeed) {
        this.pos = Vect.get(pos);
        this.vel = Vect.get(vel);
        this.vel.mult(width/400);
        this.circle = new CoolCircle(enemySize, 5, 188, 123, 151);
        this.life = 0;
        this.gofast = gofast;
        this.fastspeed = fastspeed * width / 400;
        this.dead = false;
        this.deathAnim = 0;
        this.active = false;
    }
    onDeath() {
        this.deathAnim++;
        this.active = false;
    }
    display() {
        if (this.deathAnim) {
            var size = enemySize * (1 + this.deathAnim / 5);
            var opacity = (1 - this.deathAnim / 10) * 255;
            fill(218, 63, 121, opacity);
            ellipse(this.pos.x, this.pos.y, size, size);
        }
        else {
            var easeout = quadEaseOut(this.life * 2 / this.gofast);
            var size = (easeout + 1) / 2;
            var opacity = easeout * 255;
            this.circle.display(this.pos.x, this.pos.y, size, opacity);
        }
    }
    update() {
        if (this.deathAnim) {
            this.deathAnim++;
            if (this.deathAnim > 10) {
                this.dead = true;
            }
        }
        else {
            this.life++;
            this.active = this.life >= this.gofast / 2;
            if (this.life >= this.gofast) {
                var diff = Vect.sub(player.pos, this.pos);
                diff.normalize();
                diff.mult(0.1);
                //diff.div(((this.life-this.gofast+1)/(this.life-this.gofast*2/3))*3);
                this.vel.add(diff);
                var mag = this.vel.mag();
                this.vel.mult(lerp(mag, this.fastspeed + (this.life - this.gofast) / 25, 0.01) / mag);
            }
            else {
                this.vel.mult(0.98);
            }
            this.pos.add(this.vel);
            if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
                this.deathAnim++;
                this.vel.mult(-0.1);
                var times = 0;
                while ((this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) && ++times < 10) {
                    this.pos.add(this.vel);
                }
            }
        }
    }
    go() {
        this.update();
        this.display();
    }
}
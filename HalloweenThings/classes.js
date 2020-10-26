
// Usable subjects
class Subject {
    constructor(pos) {
        this.type = 0; // See types in parameters.js
        if(pos)
            this.pos = pos;
        else
            this.pos = new Vec2(0, 0);
    }
}

// Weapon
class Weapon {
    constructor() {
        this.damage = 1;
        // Ammo
        this.ammoMax = 10;
        this.ammo = this.ammoMax;
        // Cooldown
        this.cooldownTime = 0.5;
        this.timeToCooldown = this.cooldownTime;
    }
}

// Player | monster
class Object {
    constructor() {
        this.pos = new Vec2(0, 0); // Position
        this.gridPos = new Vec2(0, 0); // Position
        this.dir = 0; // Direction

        this.lamp = 1; // 1 - on, 0 - off
        this.distLight = DIST_LIGHT;

        this.hp = LIMIT_HP;
        this.oil = LIMIT_OIL;
        this.mind = LIMIT_MIND;
        this.matches = LIMIT_MATCHES;

        this.status = 0; // 0 - alive, 1 - dead, 2 - delirious, 3 - win
        
        this.protectionTime = 1; // Invulnerability after taking damage (parameter)
        this.protectionTimer = 0; // Invulnerability after taking damage (Timer)
        this.subjects = [undefined, undefined];

        this.weapon = new Weapon();
        
        // animation
        this.right = 1;
        this.animationType = -1; // 0 - standing, 1 - walking up, 2 - walking down, 3 - walking right, 4 - left
        this.animationFrame = 0; // from 0 to skol'ko est'
        this.animationTime = 0.3; // time per 1 animation frame
        this.animationTimer = 0; // timer

        // For monster
        this.monsterType = 0;
        this.horror = 0; // -mind per second

        this.attackRange = 5;
        this.damage = 1;
    }
}

class Anime {
    constructor(frame_time, frames) {
        this.frame_time = frame_time;
        this.frames = frames;
        this.frame = 0;
        this.frames_cnt = this.frames.length;
    }
}

Object.prototype.set_animations = function(standing, walking) { // standing - [], walking - [[up], [down], [right]]
    this.animations = [standing, walking[0], walking[1], walking[2], walking[2]];
    this.cur_animation = this.animations[0];
}

// Cooldowns, timers, etc
Object.prototype.step = function(dt) {

    // Protection timer
    this.protectionTimer -= dt;
    if (this.protectionTimer < 0) {
        this.protectionTimer = 0;
    }

    if (this.animationType < 0) {
        return;
    }
    
    // animation timer
    this.cur_animation = this.animations[this.animationType];
    this.animationTimer += dt;
    if (this.animationTimer >= this.cur_animation.frame_time) {
        this.animationTimer = 0;
        this.cur_animation.frame = (this.cur_animation.frame + 1) % this.cur_animation.frames_cnt;
    }
}

Object.prototype.get_frame = function() {
    return this.cur_animation.frames[this.cur_animation.frame];
}

// mind += delta
Object.prototype.change_mind = function(delta) {
    this.mind += delta;

    if (this.mind < EPS) {
        this.mind = 0;
        this.status = 2; // Delirium
    }
    if (this.mind > LIMIT_MIND) {
        this.mind = LIMIT_MIND;
    }
}

// hp += delta
Object.prototype.change_hp = function(delta) {
    this.hp += delta;

    if (this.hp < EPS) {
        this.hp = 0;
        this.status = 1; // Death
    }
    if (this.hp > LIMIT_HP) {
        this.hp = LIMIT_HP;
    }
}

// hp += delta
Object.prototype.hurt = function(damage) {
    if (this.protectionTimer == 0) { // protection after attacks
        this.change_hp(-damage);
        this.protect();
    }
}

// oil += delta
Object.prototype.change_oil = function(delta) {
    this.oil += delta;

    if (this.oil < 0) {
        this.oil = 0;
        this.lamp = 0;
    }
    if (this.oil > LIMIT_OIL) {
        this.oil = LIMIT_OIL;
    }
}

// Protection after attacks
Object.prototype.protect = function() {
    this.protectionTimer = this.protectionTime;
}

// Cell on the grid
class Cell {
    constructor() {
        this.ground = 0;
        this.covering = 0;
        this.grave = 0;
        this.gates = 0; // 0 - none, 1 - left part, 2 - right part
        this.obstacle = 0; // 0 - player can pass, 1 - player can't pass
        this.type = 0; // For different texturing
        this.light = 0; // Illumination
        
        this.zombieNav = 0; // Used to navigate zombies
        this.ghostNav = 0; // Used to navigate zombies
    }
}

// Light source
class LightSource {
    constructor(pos, power) {
        if (pos)
            this.pos = plus(pos, new Vec2(0, 0));
        else
            this.pos = new Vec2(0, 0);
        if (power)
            this.power = power;
        else
            this.power = 0;
    }
}

class TemporalLightSource {
    constructor(pos, power, lifespan) {
        if (pos)
            this.pos = plus(pos, new Vec2(0, 0));
        else
            this.pos = new Vec2(0, 0);
        if (power)
            this.power = power;
        else
            this.power = 0;
        if (lifespan) {
            this.lifespan = lifespan;
            this.life = this.lifespan;
            this.initialPower = this.power;
        }
        else {
            this.life = 0;
            this.alive = 0;
        }

        this.alive = 1;
    }
}

// Fading
TemporalLightSource.prototype.step = function(dt) {
    this.life -= dt;
    if (this.life <= 0) {
        this.life = 0;
        this.alive = 0;
    }

    this.power = Math.floor(this.initialPower * this.life / this.lifespan)
}

class Animation {
    constructor(frames, pos, box, t, interface_bind, repeating) {
        this.frames = frames; // Images
        this.pos = new Vec2(pos.x, pos.y); // Position
        this.box = box; // Size
        this.frameTime = t; // Frame change period
        this.timer = this.frameTime; // Countdown to change frame
        this.currentFrame = 0; // id of current frame
        this.alive = 1; // If 0 - animation must be deleted

        if (interface_bind) {
            this.interface_bind = 1; // drawn at very top of all layers
        } else {
            this.interface_bind = 0;
        }
        if (repeating) { // 0 - dying after repeating, 1 - repeating, 2 - last frame alive
            this.repeating = repeating;
        } else {
            this.repeating = 0;
        }
    }
};

Animation.prototype.step = function() {
    this.timer -= DT;
    if (this.timer <= 0) {
        this.currentFrame++;
        this.timer = this.frameTime;
        if (this.currentFrame >= this.frames.length)
        {
            if (this.repeating == 0) { // Repeating check
                this.alive = 0;
            }
            else if (this.repeating == 1) {
                this.currentFrame = 0;
            }
        }
    }
}

Animation.prototype.getFrame = function() {
    return this.frames[this.currentFrame];
}

class Artifact {
    constructor() {
        
    }
};


const Weapon = require("./weapon")
const Vec2 = require("./vec2")

// Player | monster
class Entity {
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

        this.grid_pos = null
    }

    set_animations(standing, walking) { // standing - [], walking - [[up], [down], [right]]
        this.animations = [standing, walking[0], walking[1], walking[2], walking[2]];
        this.cur_animation = this.animations[0];
    }

// Cooldowns, timers, etc
    step(dt) {

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

    get_frame() {
        return this.cur_animation.frames[this.cur_animation.frame];
    }

// mind += delta
    change_mind(delta) {
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
    change_hp(delta) {
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
    hurt(damage) {
        if (this.protectionTimer === 0) { // protection after attacks
            this.change_hp(-damage);
            this.protect();
        }
    }

// oil += delta
    change_oil(delta) {
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
    protect() {
        this.protectionTimer = this.protectionTime;
    }
}

module.exports = Entity
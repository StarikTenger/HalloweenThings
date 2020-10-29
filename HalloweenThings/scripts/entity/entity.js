

const Vec2 = require("../vec2")

/**
 * Entity or monster
 */
class Entity {

    // TODO: Напишите внятные доки к gridPos и Pos, я не понимаю что они значат.

    /**
     * Entity grid position
     * @type {Vec2}
     */
    gridPos = new Vec2(0, 0);

    /**
     * Entity position
     * @type {Vec2}
     */
    pos = new Vec2(0, 0);

    /**
     * Damage invulnerability time parameter
     * @type {Number}
     */
    protectionTime = 0.5;

    /**
     * Damage invulnerability timer
     * @type {Number}
     */
    protectionTimer = 0;

    /**
     * Entity health
     */
    hp = LIMIT_HP;

    /**
     * Where this entity lives
     * @type {Game}
     */
    game = null

    /**
     * @param config Entity config
     * @param config.game Game containing this entity
     */
    constructor(config) {
        if(!config) config = {}

        this.game = config.game

        this.dir = 0; // Direction

        this.status = 0; // 0 - alive, 1 - dead, 2 - delirious, 3 - win

        // animation
        this.right = 1;
        this.animationType = -1; // 0 - standing, 1 - walking up, 2 - walking down, 3 - walking right, 4 - left
        this.animationFrame = 0; // from 0 to skol'ko est'
        this.animationTime = 0.3; // time per 1 animation frame
        this.animationTimer = 0; // timer

        this.posPrev = this.pos.clone();
        this.grid_pos = null
    }

    set_animations(standing, walking) { // standing - [], walking - [[up], [down], [right]]
        this.animations = [standing, walking[0], walking[1], walking[2], walking[2]];
        this.cur_animation = this.animations[0];
    }

    // Cooldowns, timers, etc
    step(dt) {
        // Previous pos
        this.posPrev = this.pos.clone();

        // Grid pos
        this.gridPos = this.game.getCell(this.pos);

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

    getFrame() {
        return this.cur_animation.frames[this.cur_animation.frame];
    }

    // hp += delta
    changeHp(delta) {
        this.hp += delta;

        if (this.hp < EPS) {
            this.hp = 0;
            this.status = 1; // Death
            if (!this.monsterType)
                window.SOUND_DEATH.play();
        }
        if (this.hp > LIMIT_HP) {
            this.hp = LIMIT_HP;
        }
    }

    // hp += delta
    hurt(damage) {
        if (this.protectionTimer === 0) { // protection after attacks
            this.changeHp(-damage);
            this.protect();
        }
    }

    // Protection after attacks
    protect() {
        this.protectionTimer = this.protectionTime;
    }
}

module.exports = Entity
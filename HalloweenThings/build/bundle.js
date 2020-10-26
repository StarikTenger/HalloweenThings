(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

const Vec2 = require("./vec2")

// Sprite
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

    step() {
        this.timer -= DT;
        if (this.timer <= 0) {
            this.currentFrame++;
            this.timer = this.frameTime;
            if (this.currentFrame >= this.frames.length)
            {
                if (this.repeating === 0) { // Repeating check
                    this.alive = 0;
                }
                else if (this.repeating === 1) {
                    this.currentFrame = 0;
                }
            }
        }
    }

    getFrame() {
        return this.frames[this.currentFrame];
    }
}

module.exports = Animation
},{"./vec2":14}],2:[function(require,module,exports){
class Anime {
    constructor(frame_time, frames) {
        this.frame_time = frame_time;
        this.frames = frames;
        this.frame = 0;
        this.frames_cnt = this.frames.length;
    }
}

module.exports = Anime
},{}],3:[function(require,module,exports){
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

module.exports = Cell
},{}],4:[function(require,module,exports){
class Deque {
    constructor() {
        this.front = this.back = undefined;
    }
    addFront(value) {
        if (!this.front) this.front = this.back = { value };
        else this.front = this.front.next = { value, prev: this.front };
    }
    removeFront() {
        let value = this.peekFront();
        if (this.front === this.back) this.front = this.back = undefined;
        else (this.front = this.front.prev).next = undefined;
        return value;
    }
    peekFront() { 
        return this.front && this.front.value;
    }
    addBack(value) {
        if (!this.front) this.front = this.back = { value };
        else this.back = this.back.prev = { value, next: this.back };
    }
    removeBack() {
        let value = this.peekBack();
        if (this.front === this.back) this.front = this.back = undefined;
        else (this.back = this.back.next).back = undefined;
        return value;
    }
    peekBack() { 
        return this.back && this.back.value;
    }
}

module.exports = Deque
},{}],5:[function(require,module,exports){

const Vec2 = require("./vec2")

// This class is responsible for drawing
class Draw {
    constructor(ctx) {
        this.ctx = ctx;

        this.cam = new Vec2(0, 0); // Camera position
        this.center = new Vec2(64, 64); // Screen center (здфнукы ы)
    }

    image(texture, x, y, w, h, flip) {
        x = Math.round(x);
        y = Math.round(y);
        w = Math.round(w);
        h = Math.round(h);

        if(!flip)
            flip = 0;

        this.ctx.save();
        let width = 1;
        if (flip) {
            this.ctx.scale(-1, 1);
            width = -1;
        }
        this.ctx.imageSmoothingEnabled = 0;
        this.ctx.drawImage(texture, width*(x + w * flip - this.cam.x + this.center.x) * SCALE, (y - this.cam.y + this.center.y) * SCALE, w * SCALE, h * SCALE);
        this.ctx.restore();
    }

    rect(x, y, w, h, color) {
        x = Math.round(x);
        y = Math.round(y);
        w = Math.round(w);
        h = Math.round(h);

        this.ctx.imageSmoothingEnabled = 0;
        this.ctx.fillStyle = color;
        this.ctx.fillRect((x - this.cam.x + this.center.x) * SCALE, (y - this.cam.y + this.center.y) * SCALE, w * SCALE, h * SCALE);
    }

    draw(game) {

        // Focusing camera
        this.cam = game.player.pos;
        this.center = new Vec2(64, 64);

        // Filling background
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, 10000, 10000);

        this.ySorted = [];

        // Grid
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                if(game.grid[x][y].light <= 0 && game.player.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4)) > DIST_LIGHT * 2) // We don't see this cell
                   continue;
                let cell = game.grid[x][y];


                if (cell.ground) {
                    this.ySorted.push([IMGS_GROUND[cell.ground - 1], x * CELL_SIZE, y * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE, 0, -5]);
                }
                if (cell.covering) {
                    this.ySorted.push([IMGS_COVERING[cell.covering - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, -4]);
                }

                if (cell.gates) {
                    if (game.gates_state === 1)
                        this.ySorted.push([IMGS_GATES[+cell.gates - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    continue;
                }

                if (cell.grave) {
                    if (cell.grave > 0) {
                        this.ySorted.push([IMGS_GRAVE[+cell.grave - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    } else { // Spec grave
                        this.ySorted.push([IMGS_SPEC_GRAVE[-cell.grave - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    }
                }
            }
        }

        // Player
        let cur_texture = game.player.get_frame();
        this.ySorted.push([cur_texture, game.player.pos.x - CELL_SIZE / 2, game.player.pos.y - 2 * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, game.player.right === 0, game.player.pos.y]);

        // Monsters
        for (let i = 0; i < game.monsters.length; i++) {
            let monster = game.monsters[i];
            let frame = monster.get_frame();
            this.ySorted.push([frame, monster.pos.x - CELL_SIZE / 2, monster.pos.y - CELL_SIZE * 2, TEXTURE_SIZE, TEXTURE_SIZE * 2, monster.right === 0, monster.pos.y]);
        }

        // Subjects
        for (let i = 0; i < game.subjects.length; i++) {
            let subject = game.subjects[i];
            if (!subject || !subject.type) // Corrupted
                continue;
            this.ySorted.push([IMGS_SUBJECT[subject.type - 1], subject.pos.x - CELL_SIZE / 2, subject.pos.y - CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE , 0, subject.pos.y]);
        }

        // Sprite animations
        for (let i = 0; i < game.animations.length; i++) {
            let animation = game.animations[i];
            if (animation.interface_bind) {
                continue;
            }
            let img = animation.getFrame();
            this.ySorted.push([img, animation.pos.x - CELL_SIZE / 2, animation.pos.y, animation.box.x, animation.box.y , 0, 1000]);
        }

        // Sorting objects by Y-pos
        this.ySorted.sort(function(a, b) {
            return a[6] - b[6];
        });

        // Drawing sorted objects
        for (let x = 0; x < this.ySorted.length; x++) {
            let a = this.ySorted[x];
            this.image(a[0], a[1], a[2], a[3], a[4], a[5]);
        }

        // Gradient light
        let pixelSize = 2; // Size of cell of light grid
        for (let x1 = this.cam.x - 64; x1 <= this.cam.x + 64; x1 += pixelSize) {
            for (let y1 = this.cam.y - 64; y1 <= this.cam.y + 64; y1+= pixelSize) {
                let val = 0; // Light value
                let sum = 0; // Dist sum
                let pos = new Vec2(x1, y1);
                let cellPos = game.getCell(pos);

                // Neighbor cells
                for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                    for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {
                        let dist = pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                        if (game.checkCell(new Vec2(x, y)) || dist >= 16)
                            continue;
                        val += game.getLight(new Vec2(x, y)) * (18 - dist);
                        sum += 18 - dist;
                    }
                }

                val /= sum;

                let alpha = (1 - (val / DIST_LIGHT));
                this.rect(x1, y1, pixelSize, pixelSize, "rgba(0,0,0," + alpha + ")");
            }
        }

        //// Interface ////
        this.cam = new Vec2(0, 0);
        this.center = new Vec2(0, 0);
        this.image(IMG_INTERFACE, 0, 0, 64 * 2, 64 * 2);

        // Mind
        this.rect(53 * 2, 55 * 2, game.player.mind * 10 / LIMIT_MIND * 2, 2, "rgb(0,100,200)");
        // Hp
        this.rect(18 * 2, 63 * 2, 2 * 2, - game.player.hp * 6 / LIMIT_HP * 2, "rgb(194, 29, 40)");
        // Oil
        this.rect(8 * 2, 63 * 2, 2 * 2, - game.player.oil * 6 / LIMIT_OIL * 2, "rgb(148, 133, 46)");
        // Matches
        for (let i = 0; i < game.player.matches; i++) {
            this.image(IMG_MATCH, (22 + i * 2)  * 2, 58 * 2, 2, 5 * 2);
        }
        // Ammo
        this.rect(2, 55 * 2, game.player.weapon.ammo * 10 / 5 * 2, 2, "rgb(0, 143, 39)");
        // Cooldown
        this.rect(2, 54 * 2, game.player.weapon.timeToCooldown * 10 / game.player.weapon.cooldownTime * 2 , 2, "rgb(0, 0, 0)");

        if (game.mentalDanger) {
            this.image(IMG_MENTAL_DANGER, 53 * 2, 49 * 2, 10 * 2, 5 * 2);
        }

        // Subjects
        for (let j = 0; j < 2; j++) {
            if (!game.player.subjects[j] || !game.player.subjects[j].type) // Empty slot
                continue;

            this.image(IMGS_SUBJECT[game.player.subjects[j].type - 1], (28 + j * 7)  * 2, 56 * 2, 8 * 2, 8 * 2)
        }

        // Spec Graves
        for (let i = 0; i < game.spec_graves_visited.length; i++) {
            if (game.spec_graves_visited[i] === 2) {
                this.image(IMGS_SPEC_MINI_GRAVE[i], (52 + 4 * i) * 2, 57 * 2, 3 * 2, 6 * 2);
            }
        }

        // Overlay
        this.image(IMG_INTERFACE_OVERLAY, 0, 0, 64 * 2, 64 * 2);

        // Animations
        for (let i = 0; i < game.animations.length; i++) {
            let animation = game.animations[i];
            if (!animation.interface_bind) {
                continue;
            }
            let img = animation.getFrame();
            this.image(img, animation.pos.x * 2, animation.pos.y * 2, animation.box.x * 2, animation.box.y * 2 , 0);
        }

        // Gameover screen
        if (game.player.status === 1) {
            this.image(IMG_DEAD, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 2) {
            this.image(IMG_DELIRIOUS, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 3) {
            this.image(IMG_WIN, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 4) {
            this.image(IMG_START_SCREEN, 0, 0, 64 * 2, 64 * 2);
        }
    }
}

module.exports = Draw
},{"./vec2":14}],6:[function(require,module,exports){


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
},{"./vec2":14,"./weapon":15}],7:[function(require,module,exports){

const Animation = require("./animation.js")
const Anime = require("./anime.js")
const Cell = require("./cell.js")
const Deque = require("./deque.js")
const Entity = require("./entity.js")
const LightSource = require("./lightSource.js")
const TemporalLightSource = require("./temporalLightSource.js")
const Vec2 = require("./vec2.js")
const Subject = require("./subject")
const Random = require("./random")


// Main class that controls everything

class Game {
    constructor() {
        // Filling grid
        this.grid = [];
        for (let x = 0; x < SIZE_X; x++) {
                this.grid.push([]);
                for (let y = 0; y < SIZE_Y; y++) {
                    this.grid[x].push(new Cell);
                }
        }

        // Setting player
        this.player = new Entity();
        this.player.pos = new Vec2(10, 10);
        this.player.gridPos = new Vec2(0, 0);

        // Player's animations
        let anm_standing = new Anime(0.5, ANM_PLAYER_STANDING);
        let anm_walking_right = new Anime(0.3, ANM_PLAYER_MOVING_RIGHT);
        let anm_walking_up = new Anime(0.3, ANM_PLAYER_MOVING_UP);
        let anm_walking_down = new Anime(0.3, ANM_PLAYER_MOVING_DOWN);
        this.player.set_animations(anm_standing, [anm_walking_up, anm_walking_down, anm_walking_right]);

        // Game progress
        this.spec_graves_visited = [0, 0, 0];
        this.spec_graves_visited_count = 0;
        this.gates_state = 0; // 1 - gates spawned, 2 - gates opened
        this.level = 0;

        // Spec graves cooldown
        this.specGraveCooldown = 5; // in sec
        this.specGraveTimer = this.specGraveCooldown;

        // Flickering
        this.flickeringCooldown = 0.1;
        this.flickeringTimer = this.flickeringCooldown;
        this.flickeringDelta = 0;
        this.flickeringMaxDelta = 0.5;
        this.flickeringD = 0.075;

        // Light
        this.spec_lights = [];
        this.temporalLightSources = [];

        // Monster array
        this.monsterTimer = 0;
        this.monsters = [];

        // Subjects array
        this.subjectTimer = 0;
        this.subjects = [];

        // Light sources array
        this.lightSources = [];

        this.animations = [];

        this.RELOAD = 0;

        this.mentalDanger = 0; // PLayer is taking mental damage
    }

    // Deals damage & makes sprite animation
    hurt(target, value) {
        if (target.protectionTimer === 0) {
            this.animations.push(new Animation(ANM_BLOOD, target.pos.plus(new Vec2(0, -8)), new Vec2(8, 8), 0.1));
            if (!target.monsterType) {
                this.animations.push(new Animation(ANM_DAMAGE, new Vec2(0, 0), new Vec2(64, 64), 0.3, 1));
            }
        }
        target.hurt(value);
    }

    // Checks is the cell is in bounds
    checkCell(pos) {
        if(pos.x < 0 || pos.y < 0 || pos.x >= SIZE_X || pos.y >= SIZE_Y)
            return 1;
        return 0;
    }

    // Checks is the cell is in bounds and in margin
    checkMargin(pos) {
        if(pos.x < MARGIN || pos.y < MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN)
            return 1;
        return 0;
    }

    // In which cell is pos
    getCell(pos) {
        let cellPos = pos.div(new Vec2(8, 8));
        cellPos.x = Math.floor(cellPos.x);
        cellPos.y = Math.floor(cellPos.y);
        return cellPos;
    }

    // Gets visible light value for current cell
    getLight(pos) {
        let val = 0;
        if (!this.checkCell(pos))
            val = Math.max(this.grid[pos.x][pos.y].light + DIST_LIGHT - DIST_LOAD, 0);
        return val;
    }

    // Choose random grave texture
    random_grave_type() {
        let graves_cnt = IMGS_GRAVE.length;
        return Random.normalRoll(2, graves_cnt, 10);
    }

    // Choose random ground texture
    random_ground_type() {
        let grounds_cnt = IMGS_GROUND.length;
        return Random.normalRoll(1, grounds_cnt, 3);
    }

    // Choose random ground covering texture
    //     random_covering_type() {
    //         let covering_cnt = IMGS_COVERING.length;
    //         return normalRoll(1, covering_cnt, 2);
    //     }

    // Choose random monster texture
    random_monster_type() {
        let monster_cnt = IMGS_MONSTER.length;
        return Random.normalRoll(1, monster_cnt, 1);
    }

    clever_covering_type() {
        let roll = Random.random(1, 100);
        let grass_cnt = 5;
        let water_cnt = 2;
        let blood_cnt = 1;
        let sum = 0;
        if (roll < 90) { // Grass
            return Random.normalRoll(sum + 1, grass_cnt, 3);
        } else {
            sum += grass_cnt;
        }

        if (roll < 98) { // Water
            return Random.normalRoll(sum + 1, sum + water_cnt, 3);
        } else {
            sum += water_cnt;
        }

        if (roll < 100) {
            return Random.normalRoll(sum + 1, sum + blood_cnt, 3);
        }
    }

    subject_type() {
        let type = Random.random(1, 100);
        if (type <= 10) {
            type = SBJ_HEAL;
        } else if (type <= 35) {
            type = SBJ_WHISKEY;
        } else if (type <= 60) {
            type = SBJ_OIL;
        } else if (type <= 80) {
            type = SBJ_MATCHBOX;
        } else {
            type = SBJ_AMMO;
        }

        return type;
    }

    // Generates map
    initialGeneration() {
        // Initial graves (in each cell with some chance)
        for (let x = MARGIN - 1; x < SIZE_X - (MARGIN - 1); x++) {
            let y = (MARGIN - 1);
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let x = (MARGIN - 1); x < SIZE_X - (MARGIN - 1); x++) {
            let y = SIZE_Y - (MARGIN - 1) - 1;
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let y = (MARGIN - 1); y < SIZE_Y - (MARGIN - 1); y++) {
            let x = (MARGIN - 1);
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let y = (MARGIN - 1); y < SIZE_Y - (MARGIN - 1); y++) {
            let x = SIZE_X - (MARGIN - 1) - 1;
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
    }

    // Generates gates (always in the top), check for player near
    gates(x) {
        // Check for existing gates
        let gatesFound = 0;
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                if(this.grid[x][y].gates)
                    gatesFound = 1;
            }
        }

        if (gatesFound || this.gates_state) { // We don't need one more gates
            if (this.gates_state === 0)
                this.gates_state = 1; // Gates spawned
            return;
        }

        // Set gates_state
        this.gates_state = 1;

        // Gates itself
        this.grid[x][MARGIN - 1].gates = 1;
        this.grid[x + 1][MARGIN - 1].gates = 2;
        // Clear space under
        this.grid[x][MARGIN].obstacle = 0;
        this.grid[x + 1][MARGIN].obstacle = 0;
        this.grid[x][MARGIN].grave = 0;
        this.grid[x + 1][MARGIN].grave = 0;
        // Light
        this.spec_lights.push(new LightSource(new Vec2(x * 8 + 8, MARGIN * 8 - 8), 3));
    }

    // Generates the map
    generate() {
        // Initial graves (in each cell with some chance)

        let specGravesNum = 0;
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                let cell = this.grid[x][y];
                if (cell.light > 0) // Forbidden zone
                    continue;
                cell.ground = this.random_ground_type();
                cell.covering = this.clever_covering_type();
                if (cell.grave < 0) {
                    this.spec_graves_visited[-cell.grave - 1] = 0;
                    specGravesNum++;
                }
            }
        }

        for (let x = MARGIN; x < SIZE_X - MARGIN; x++) {
            for (let y = MARGIN; y < SIZE_Y - MARGIN; y++) {
                let cell = this.grid[x][y];
                if (cell.light > 0) // Forbidden zone
                    continue;
                if (!Random.random(0, 10)) { // Grave
                    cell.grave = this.random_grave_type();
                    cell.obstacle = 1;
                    cell.covering = 0;
                } else {
                    cell.grave = 0;
                    cell.obstacle = 0;
                }
            }
        }

        // Neighbor graves (finds random point, sets grave if this cell has neighbor)
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];
        let neighborsDiagonal = [
            new Vec2(1, 1),
            new Vec2(-1, 1),
            new Vec2(1, -1),
            new Vec2(-1, -1)
        ];
        for (let i = 0; i < (SIZE_X * SIZE_Y); i++) {
            // Generate random point
            let pos = new Vec2(Random.random(MARGIN, SIZE_X - 1 - MARGIN), Random.random(MARGIN, SIZE_Y - 1 - MARGIN));

            // Number of neighbors
            let neighborsCount = 0;
            let neighborsDiagonalCount = 0;

            if(this.grid[pos.x][pos.y].light > 0) // Forbidden zone
                continue;

            // Check for neighbors
            // Close neighbors
            for (let j = 0; j < 4; j++) {
                let pos1 = pos.plus(neighbors[j]); // In this cell we check neighbor
                if(this.checkMargin(pos1)) // Cell out of borders or in margin
                    continue;
                if(this.grid[pos1.x][pos1.y].obstacle) // Neighbor found
                    neighborsCount++;
            }
            // Diagonal neighbors
            for (let j = 0; j < 4; j++) {
                let pos1 = pos.plus(neighborsDiagonal[j]); // In this cell we check neighbor
                if(this.checkMargin(pos1)) // Cell out of borders or in margin
                    continue;
                if(this.grid[pos1.x][pos1.y].obstacle) // Neighbor found
                    neighborsDiagonalCount++;
            }

            // If cell has neighbors we generate a grave
            if (neighborsCount === 1 && neighborsDiagonalCount <= 1 && this.grid[pos.x][pos.y].grave >= 0) {
                let cell = this.grid[pos.x][pos.y];
                cell.grave = this.random_grave_type();
                cell.obstacle = 1;
                cell.covering = 0;
            }
        }

        // Spec grave
        let spec_sum = this.spec_graves_visited[0] * this.spec_graves_visited[1] * this.spec_graves_visited[2];

        if (this.level < 3 && specGravesNum <= this.spec_graves_visited_count + 1 && spec_sum === 0) {
            let x = Random.random(MARGIN, SIZE_X - MARGIN - 1);
            let y = Random.random(MARGIN, SIZE_Y - MARGIN - 1);
            let cell = this.grid[x][y];

            for(let i = 0; i < 1000 && cell.light > 0; i++) {
                x = Random.random(MARGIN, SIZE_X - MARGIN - 1);
                y = Random.random(MARGIN, SIZE_Y - MARGIN - 1);
                cell = this.grid[x][y];
            }

            if (1) { // Spec grave!!!
                cell.grave = -this.level - 1;
                this.spec_graves_visited[-cell.grave - 1] = 1; // 1 - generated, 2 - visited
                cell.obstacle = 1;
                cell.covering = 0;
            }

            console.log('spec');
        }

        //// Cemetery gates ////
        if (this.spec_graves_visited_count >= 3)
            this.gates(Random.random(MARGIN + 1, SIZE_X - MARGIN - 2));

    }

    // Subjects-spawning management
    spawnSubjects() {
        //// Subjects (bonuses) ////
        this.subjectTimer -= DT; // dt
        // Despawn
        for (let i = 0; i < this.subjects.length; i++) {
            let subject = this.subjects[i];
            subject.gridPos = this.getCell(subject.pos);
            if (!subject.type || subject.pos.dist(this.player.pos) > 1000) {
                this.subjects.splice(i, 1);
            }
        }

        // Spawning new subjects
        for (let i = 0; i < 10; i++) { // We try to spawn subject for 10 times
            // Generate random point
            let pos = new Vec2(Random.random(0, SIZE_X - 1), Random.random(0, SIZE_Y - 1));

            // Checking for limitations
            if (this.subjects.length >= SUBJECT_LIMIT) // Too much subjects
                break;
            if (this.subjectTimer > 0) // We can't spawn subjects to often
                break;
            if (this.grid[pos.x][pos.y].obstacle) // Cell is not empty
                continue;
            if (this.grid[pos.x][pos.y].light > DIST_LIGHT - 1) // Visible zone
                continue;
            if (pos.x <= MARGIN && pos.y <= MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN) // Out of cemetery
                continue;

            // Making a subject
            let subject = new Subject(pos.mult(new Vec2(8, 8)).plus(new Vec2(4, 4)));

            // Choosing type
            subject.type = this.subject_type();

            // Adding subject to array
            this.subjects.push(subject);

            // Timer
            this.subjectTimer = SUBJECT_PERIOD;
        }
    }

    // Moves object (collision)
    move(object, shift, flight) {
        let deltaPos = shift;
        let newPosX = object.pos.plus(new Vec2(0, 0)); newPosX.x += deltaPos.x;
        let newPosY = object.pos.plus(new Vec2(0, 0)); newPosY.y += deltaPos.y;
        let cellPosX = newPosX.div(new Vec2(8, 8)); // Cell
        let cellPosY = newPosY.div(new Vec2(8, 8)); // Cell
        cellPosX.x = Math.floor(cellPosX.x);
        cellPosX.y = Math.floor(cellPosX.y);
        cellPosY.x = Math.floor(cellPosY.x);
        cellPosY.y = Math.floor(cellPosY.y);
        if(cellPosX.x < 0 || cellPosX.y < 0 || cellPosX.x >= SIZE_X || cellPosX.y >= SIZE_Y || (!flight && this.grid[cellPosX.x][cellPosX.y].obstacle)){
            deltaPos.x = 0;
        }
        if(cellPosY.x < 0 || cellPosY.y < 0 || cellPosY.x >= SIZE_X || cellPosY.y >= SIZE_Y || (!flight && this.grid[cellPosY.x][cellPosY.y].obstacle)){
            deltaPos.y = 0;
        }
        object.pos = object.pos.plus(deltaPos);

        // Grid pos
        object.grid_pos = this.getCell(this.player.pos);

    }

    // Player's movement & actions
    playerControl() {
        // Player movement
        let deltaPos = new Vec2(0, 0); // Shift for this step
        // Check keys
        this.player.dir = NONE;
        if (KEY_D) { // Right
            deltaPos.x += 1;
            this.player.dir = RIGHT;
            this.player.right = 1;
        }
        if (KEY_A) { // Left
            deltaPos.x -= 1;
            this.player.dir = LEFT;
            this.player.right = 0;
        }
        if (KEY_S) { // Down
            deltaPos.y += 1;
            this.player.dir = DOWN;
        }
        if (KEY_W) { // Up
            deltaPos.y -= 1;
            this.player.dir = UP;
        }
        this.player.animationType = this.player.dir;

        // Movement
        this.move(this.player, deltaPos);

        // Cooldowns
        this.player.step(DT);

        //// Lamp management ////
        // Consumption
        if (this.player.lamp)
            this.player.change_oil(-OIL_CONSUMPTION * DT);

        // Turning lamp off
        if (KEY_X && !KEY_X_PREV) {
            if (this.player.lamp)
                this.player.lamp = 0;
        }

        //// Match using (interacting) ////
        if (KEY_F && !KEY_F_PREV) {
            if (this.player.matches > 0) {
                this.player.lamp = 1;
                this.player.matches--;
                this.temporalLightSources.push(new TemporalLightSource(this.player.pos, 5, 2));
                this.animations.push(new Animation(ANM_MATCH, this.player.pos.plus(new Vec2(0, -5)), new Vec2(8, 8), 0.1)); // In game
                this.animations.push(new Animation(ANM_MATCH_BURNING, new Vec2(22 + (this.player.matches - 1) * 2 + 1, 57), new Vec2(3, 7), 0.1, 1)); // In interface

                // Lighting spec graves
                let pos = this.player.grid_pos;
                for (let x = pos.x - 1; x <= pos.x + 1; ++x) {
                    for (let y = pos.y - 1; y <= pos.y + 1; ++y) {
                        let cell = this.grid[x][y];
                        if (cell.grave < 0 && this.spec_graves_visited[-cell.grave - 1] === 1) { // spec grave

                            this.specGraveTimer = this.specGraveCooldown;
                            this.spec_graves_visited[-cell.grave - 1] = 2;
                            this.spec_lights.push(new LightSource(new Vec2(x * 8 + 4, y * 8 + 4), 2));
                            this.spec_graves_visited_count += 1;
                            this.animations.push(new Animation(ANM_IGNITION[-cell.grave - 1], new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(8, 16), 0.1));
                            this.animations.push(new Animation(ANM_ACTIVE_GRAVE, new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(8, 16), 0.15, 0, 1));
                            this.level++;
                            this.generate();
                        }
                    }
                }

                // Open gates
                for (let x = 0; x < SIZE_X; x++) {
                    for (let y = 0; y < SIZE_Y; y++) {
                        if (this.spec_graves_visited_count < 3) // Gates are not ready
                            break;

                        // Check for player
                        if (this.gates_state === 1 && this.grid[x][y].gates === 1 && this.player.pos.dist(new Vec2(x * 8 + 8, y * 8 + 8)) < 32) {
                            this.gates_state = 2; // Gates opened
                            this.animations.push(new Animation(ANM_GATES, new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(16, 16), 0.3));
                        }

                        // Clean obstacles
                        if (this.gates_state === 2 && this.grid[x][y].gates) {
                            this.grid[x][y].obstacle = 0;
                        }
                    }
                }
            }
        }

        if (this.player.lamp)
            this.player.distLight = DIST_LIGHT;
        else
            this.player.distLight = 1;

        // Horror
        if (!this.player.lamp) {
            this.player.change_mind(-0.35 * DT);
            this.mentalDanger = 1;
        }

        //// Active subjects ////
        // Get subjects
        for (let i = 0; i < this.subjects.length; i++) {
            let subject = this.subjects[i];
            if (subject.pos.dist(this.player.pos) > 8) // Not close enough
                continue;

            // Checking slots
            for (let j = 0; j < 2; j++) {
                if (this.player.subjects[j] && this.player.subjects[j].type) // There is another subject in the slot
                    continue;

                this.player.subjects[j] = new Subject();
                this.player.subjects[j].type = subject.type;

                subject.type = undefined;
            }
        }

        // Use subjects
        let keys = [
            (KEY_1 && !KEY_1_PREV),
            (KEY_2 && !KEY_2_PREV)
        ];
        for (let i = 0; i < 2; i++) {
            if (!this.player.subjects[i] || !this.player.subjects[i].type) // Slot is empty
                continue;
            if (!keys[i]) // No command
                continue;

            // Current subject
            let subject = this.player.subjects[i];

            // Checking for subject type
            if (subject.type === SBJ_HEAL){
                this.player.change_hp(1);
            }
            if (subject.type === SBJ_OIL){
                this.player.change_oil(7);
            }
            if (subject.type === SBJ_WHISKEY){
                this.player.change_mind(6);
            }
            if (subject.type === SBJ_MATCHBOX){
                this.player.matches += 2;
                this.player.matches = Math.min(this.player.matches, LIMIT_MATCHES);
            }
            if (subject.type === SBJ_AMMO){
                this.player.weapon.ammo += 2;
                this.player.weapon.ammo = Math.min(this.player.weapon.ammo, this.player.weapon.ammoMax);
            }

            // Remove subject
            this.player.subjects[i] = undefined;
        }

        //// Weapon ////
        // Cooldown progress
        this.player.weapon.timeToCooldown -= DT;

        if (KEY_UP || KEY_DOWN || KEY_LEFT || KEY_RIGHT) {
            let dir = new Vec2();

            // Get direction
            if (KEY_UP)
                dir = new Vec2(0, -1);
            if (KEY_DOWN)
                dir = new Vec2(0, 1);
            if (KEY_LEFT)
                dir = new Vec2(-1, 0);
            if (KEY_RIGHT)
                dir = new Vec2(1, 0);
            if (KEY_ENTER) {
                this.RELOAD = 1;
            }

            if (this.player.weapon.timeToCooldown <= 0 && this.player.weapon.ammo > 0) { // Are we able to shoot
                // Stupid collision check
                let pos = new Vec2(this.player.pos.x, this.player.pos.y);
                dir = dir.mult(new Vec2(2, 2));
                for (let i = 0; i < 30; i++) {
                    let hit = 0;
                    for (let j = 0; j < this.monsters.length; j++) {
                        // Current monster
                        let monster = this.monsters[j];
                        // Shift
                        pos = pos.plus(dir);
                        // Collision check
                        if (pos.dist(monster.pos) < 8) {
                            this.hurt(monster, this.player.weapon.damage);
                        }
                    }
                    if (hit)
                        break;
                }

                // Animation
                let curAnm = ANM_TRACER_UP; // Current animation
                if (KEY_UP)
                    curAnm = ANM_TRACER_UP;
                if (KEY_DOWN)
                    curAnm = ANM_TRACER_DOWN;
                if (KEY_LEFT)
                    curAnm = ANM_TRACER_LEFT;
                if (KEY_RIGHT)
                    curAnm = ANM_TRACER_RIGHT;
                this.animations.push(new Animation(curAnm, this.player.pos.plus(new Vec2(-28, -36)), new Vec2(64, 64), 0.1));
                this.animations.push(new Animation(ANM_PISTOL_SHOT, new Vec2(1, 47), new Vec2(13, 7), 0.1, 1, 0));


                // Modify cooldown & ammo
                this.player.weapon.timeToCooldown =  this.player.weapon.cooldownTime;
                this.player.weapon.ammo--;
            }
        }

        //// WIN ////
        if (this.player.pos.y < MARGIN * 8 - 8)
            this.player.status = 3;
    }

    // Monster management
    monstersControl() {
        //// Spawning & despawning ////
        this.monsterTimer -= DT;
        // Despawning monsters
        for (let i = 0; i < this.monsters.length; i++) {
            let monster = this.monsters[i];
            if (monster.hp <= 0 || monster.pos.dist(this.player.pos) > 1000) {
                // Drop items
                if (Random.random(0, 99) < 70) { // Chance 70%
                    let sbj = new Subject(); // Dropped subject
                    sbj.type = this.subject_type();
                    sbj.pos = monster.pos;
                    this.subjects.push(sbj);
                }
                this.monsters.splice(i, 1);
            }
        }

        // Spawning new monsters
        // We try to spawn monster for 10 times
        for (let i = 0; i < 10; i++) {
            // Generate random point
            let pos = new Vec2(Random.random(0, SIZE_X - 1), Random.random(0, SIZE_Y - 1));

            // Checking for limitations
            if(this.monsters.length >= MONSTER_LIMIT) // Too much monsters
                break;
            if(this.monsterTimer > 0) // We can't spawn monsters too often
                break;
            if(this.grid[pos.x][pos.y].obstacle) // Cell is not empty
                continue;
            if(this.grid[pos.x][pos.y].light > DIST_LIGHT - 1) // Visible zone
                continue;
            if (pos.x <= MARGIN && pos.y <= MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN) // Out of cemetery
                continue;

            // Making a monster
            let monster = new Entity();
            monster.pos = pos.mult(new Vec2(8, 8)).plus(new Vec2(4, 4));
            monster.monsterType = this.random_monster_type();

            // Choosing animations
            let standing = [];
            let moving_up = [];
            let moving_down = [];
            let moving_right = [];
            if (monster.monsterType === MNS_ZOMBIE) {
                monster.horror = 0.2;
                monster.hp = Random.random(2, 3);
                standing = new Anime(0.5, ANM_ZOMBIE_STANDING);
                moving_up = new Anime(0.3, ANM_ZOMBIE_MOVING_UP);
                moving_down = new Anime(0.3, ANM_ZOMBIE_MOVING_DOWN);
                moving_right = new Anime(0.3, ANM_ZOMBIE_MOVING_RIGHT);
            }
            if (monster.monsterType === MNS_GHOST) {
                monster.horror = 0.3;
                monster.hp = Random.random(1, 3);
                standing = new Anime(0.5, ANM_GHOST_STANDING);
                moving_up = new Anime(0.3, ANM_GHOST_MOVING_UP);
                moving_down = new Anime(0.3, ANM_GHOST_MOVING_DOWN);
                moving_right = new Anime(0.3, ANM_GHOST_MOVING_RIGHT);
            }
            if (monster.monsterType === MNS_TENTACLE) {
                monster.horror = 0.7;
                monster.hp = Random.random(3, 4);
                standing = new Anime(0.5, ANM_WORM_STANDING);
                moving_up = new Anime(0.3, ANM_WORM_STANDING);
                moving_down = new Anime(0.3, ANM_WORM_STANDING);
                moving_right = new Anime(0.3, ANM_WORM_STANDING);
            }


            monster.set_animations(standing, [moving_up, moving_down, moving_right]);


            if (monster.monsterType === MNS_TENTACLE)
                monster.horror = 0.5;
            else
                monster.horror = 0.2;

            // Adding monster to array
            this.monsters.push(monster);

            // Timer
            this.monsterTimer = MONSTER_PERIOD;
        }

        //// Behaviour ////
        for (let i = 0; i < this.monsters.length; i++) {
            // Get current monster
            let monster = this.monsters[i];
            monster.gridPos = this.getCell(monster.pos);
            let x1 = monster.pos.x;
            let y1 = monster.pos.y;

            // Cooldowns
            if (monster.monsterType === MNS_ZOMBIE) { // ZOMBIE
                // Movement
                let deltaPos = new Vec2(0, 0);
                // Check neighbor cells to find
                let neighbors = [
                    new Vec2(1, 0),
                    new Vec2(-1, 0),
                    new Vec2(0, 1),
                    new Vec2(0, -1)
                ];
                for (let j = 0; j < 4; j ++) {
                    let pos1 = monster.gridPos.plus(neighbors[j]);
                    if (this.checkCell(pos1) || this.grid[pos1.x][pos1.y].obstacle)
                        continue;
                    if (this.grid[pos1.x][pos1.y].zombieNav > this.grid[monster.gridPos.x][monster.gridPos.y].zombieNav)
                        deltaPos = deltaPos.plus(neighbors[j]);
                }

                if(!Random.random(0, 1)) {
                    this.move(monster, deltaPos.mult(new Vec2(1, 1)), 0);
                }
            }
            else if (monster.monsterType === MNS_GHOST) { // GHOST
                // Movement
                let deltaPos = new Vec2(0, 0);
                // Check neighbor cells to find
                let neighbors = [
                    new Vec2(1, 0),
                    new Vec2(-1, 0),
                    new Vec2(0, 1),
                    new Vec2(0, -1)
                ];
                for(let j = 0; j < 4; j++) {
                    let pos1 = monster.gridPos.plus(neighbors[j]);
                    if (this.checkCell(pos1))
                        continue;
                    if(this.grid[pos1.x][pos1.y].ghostNav > this.grid[monster.gridPos.x][monster.gridPos.y].ghostNav)
                        deltaPos = deltaPos.plus(neighbors[j]);
                }

                if(!Random.random(0, 2))
                    this.move(monster, deltaPos.mult(new Vec2(1, 1)), 1);
            }

            let x2 = monster.pos.x;
            let y2 = monster.pos.y;

            if (x2 - x1 > 0) {
                monster.right = 1;
                monster.dir = RIGHT;
            }

            if (x2 - x1 < 0) {
                monster.right = 0;
                monster.dir = LEFT;
            }

            if (y2 - y1 > 0) {
                monster.dir = DOWN;
            }

            if (y2 - y1 < 0) {
                monster.dir = UP;
            }

            monster.animationType = monster.dir;
            monster.step(DT);

            // Horror
            if (this.grid[monster.gridPos.x][monster.gridPos.y].light > DIST_LIGHT - 1) {
                this.player.change_mind(-monster.horror * DT);
                this.mentalDanger = 1;
            }

            // Damage
            if (monster.pos.dist(this.player.pos) <= monster.attackRange) {
                this.hurt(this.player, monster.damage);
            }
        }
    }

    // Generate light around player (& other objects)
    setLight() {
        // Add player pos to light source
        this.lightSources.push(new LightSource(this.player.pos, this.player.distLight + this.flickeringDelta));

        // Turning off light
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].light = 0;
            }
        }

        for (let i = 0; i < this.spec_lights.length; i++) {
            this.lightSources.push(this.spec_lights[i]);
        }

        // BFS deque
        let deque = new Deque();

        // Adding initial cells
        for (let i = 0; i < this.lightSources.length; i++) {
            // Current light source
            let lightSource = this.lightSources[i];
            let cellPos = this.getCell(lightSource.pos);
            for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {
                    let dist = lightSource.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                    if (this.checkCell(new Vec2(x, y)) || dist > 16)
                        continue;
                    this.grid[x][y].light = Math.max (this.grid[x][y].light, lightSource.power - DIST_LIGHT + DIST_LOAD + 1 - dist / 8);
                    deque.addBack(new Vec2(x, y));
                }
            }
        }

        // Temporal light sources
        for (let i = 0; i < this.temporalLightSources.length; i++) {
            // Current light source
            let lightSource = this.temporalLightSources[i];
            lightSource.step(DT);
            let cellPos = this.getCell(lightSource.pos);

            for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {

                    let dist = lightSource.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                    if (this.checkCell(new Vec2(x, y)) || dist > 16)
                        continue;
                    this.grid[x][y].light = Math.max(this.grid[x][y].light, lightSource.power - DIST_LIGHT + DIST_LOAD + 1 - dist / 8);
                    deque.addBack(new Vec2(x, y));
                }
            }

            if (lightSource.alive === 0)
                this.temporalLightSources.splice(i, 1);
        }

        // Clean lightSources
        this.lightSources = [];

        // BFS itself
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];
        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if(this.grid[pos.x][pos.y].light < 0)
                this.grid[pos.x][pos.y].light = 0;
            if (this.grid[pos.x][pos.y].light <= 0)
                continue;

            let deltaLight = 1;
            if (this.grid[pos.x][pos.y].obstacle)
                deltaLight = 3;
            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || this.grid[pos1.x][pos1.y].light > this.grid[pos.x][pos.y].light - deltaLight)
                    continue;
                this.grid[pos1.x][pos1.y].light = this.grid[pos.x][pos.y].light - deltaLight;
                deque.addBack(pos1);
            }
        }
    }

    // Sprite animations
    manageAnimations() {
        // Step
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i].step();
        }
        // Delete
        for (let i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].alive) {
                this.animations.splice(i, 1);
                i--;
            }
        }
    }

    cooldowns() {
        // Spec graves
        this.specGraveTimer -= DT;
        if (this.specGraveTimer < 0)
            this.specGraveTimer = 0;

        // Flickering
        this.flickeringTimer -= DT;
        if (this.flickeringTimer <= 0) {
            this.flickeringTimer = this.flickeringCooldown;
            this.flickeringDelta += Random.random(-1, 1) * this.flickeringD;
            this.flickeringDelta = Math.min(Math.max(this.flickeringDelta, -this.flickeringMaxDelta), this.flickeringMaxDelta);
        }
    }

    // Pathfinding, DA HARDKOD NO VY VOOBSHE ETOT EBANYI PROEKT VIDELI, TUT V ODNOM ETOM FAILE 1000 STROK NAHUI
    pathfinding() {
        // ZOMBIE
        // Clearing navigating map
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].zombieNav = 0;
            }
        }
        // BFS deque
        let deque = new Deque();
        let x = this.getCell(this.player.pos).x;
        let y = this.getCell(this.player.pos).y;

        this.grid[x][y].zombieNav = DIST_LOAD + 1;
        deque.addBack(new Vec2(x, y));

        // BFS itself
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];

        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if(this.grid[pos.x][pos.y].zombieNav < 0)
                this.grid[pos.x][pos.y].zombieNav = 0;
            if (this.grid[pos.x][pos.y].zombieNav <= 0)
                continue;

            let deltaNav = 1;
            if (this.grid[pos.x][pos.y].obstacle)
                deltaNav = 1000;
            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || (this.grid[pos1.x][pos1.y].zombieNav >= this.grid[pos.x][pos.y].zombieNav - deltaNav))
                    continue;
                this.grid[pos1.x][pos1.y].zombieNav = this.grid[pos.x][pos.y].zombieNav - deltaNav;
                deque.addBack(pos1);
            }
        }

        // Ghost

        // Clearing
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].ghostNav = 0;
            }
        }
        // BFS deque
        deque = new Deque();
        x = this.getCell(this.player.pos).x;
        y = this.getCell(this.player.pos).y;

        this.grid[x][y].ghostNav = DIST_LOAD + 1;
        deque.addBack(new Vec2(x, y));

        // BFS itself
        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if(this.grid[pos.x][pos.y].ghostNav < 0)
                this.grid[pos.x][pos.y].ghostNav = 0;
            if (this.grid[pos.x][pos.y].ghostNav <= 0)
                continue;

            let deltaNav = 1;

            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || (this.grid[pos1.x][pos1.y].ghostNav >= this.grid[pos.x][pos.y].ghostNav - deltaNav))
                    continue;
                this.grid[pos1.x][pos1.y].ghostNav = this.grid[pos.x][pos.y].ghostNav - deltaNav;
                deque.addBack(pos1);
            }
        }
    }

    // Function called in each iteration
    step() {
        if (this.player.status === 0) { // If player is alive
            this.mentalDanger = 0;
            this.pathfinding();
            this.playerControl();
            this.monstersControl();
            this.setLight();
            //this.generate();
            this.spawnSubjects();
            this.manageAnimations();
            this.cooldowns();
        }
        if (KEY_ENTER) {
            this.RELOAD = 1;
        }
    }

    spawnPlayer(pos) {
        let gridPos = this.getCell(pos);

        this.player.pos = pos;
        this.player.gridPos = gridPos;

        // Clearing area
        for (let x = Math.max(0, gridPos.x - 1); x <= Math.min(SIZE_X, gridPos.x + 1); x++) {
            for (let y = Math.max(0, gridPos.y - 1); y <= Math.min(SIZE_Y, gridPos.y + 1); y++) {
                this.grid[x][y].grave = 0;
                this.grid[x][y].obstacle = 0;
            }
        }

        // Spawning gates
        this.gates(this.getCell(pos).x - 1);
    }
}

module.exports = Game
},{"./animation.js":1,"./anime.js":2,"./cell.js":3,"./deque.js":4,"./entity.js":6,"./lightSource.js":8,"./random":11,"./subject":12,"./temporalLightSource.js":13,"./vec2.js":14}],8:[function(require,module,exports){
// Light source
class LightSource {
    constructor(pos, power) {
        if (pos)
            this.pos = pos.clone();
        else
            this.pos = new Vec2(0, 0);
        if (power)
            this.power = power;
        else
            this.power = 0;
    }
}

module.exports = LightSource
},{}],9:[function(require,module,exports){

const Parameters = require("./parameters")
const Game = require("./game.js")
const Draw = require("./draw.js")
const Vec2 = require("./vec2.js")

window.addEventListener("load", function() {
    let game = new Game();
    let draw = new Draw(CTX);

    game.initialGeneration();
    game.generate();
    game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
    game.player.status = 4;

    // let myAudio = new Audio('music/main_theme.mp3');
    //
    // myAudio.addEventListener('ended', function() {
    //     this.currentTime = 0;
    //     this.play();
    // }, false);
    //
    // myAudio.play();

    function step() {
        window.game = game; // For checking from console

        // myAudio.volume = VOLUME;
        // myAudio.play();
        game.step();
        draw.draw(game);

        if (KEY_MINUS) {
            VOLUME = Math.max(0, VOLUME - 0.1);
        }
        if (KEY_PLUS) {
            VOLUME = Math.min(1, VOLUME + 0.1);
        }

        // Previous keys
        KEY_W_PREV = KEY_W;
        KEY_A_PREV = KEY_A;
        KEY_S_PREV = KEY_S;
        KEY_D_PREV = KEY_D;
        KEY_X_PREV = KEY_X;
        KEY_F_PREV = KEY_F;
        KEY_1_PREV = KEY_1;
        KEY_2_PREV = KEY_2;
        KEY_UP_PREV = KEY_UP;
        KEY_DOWN_PREV = KEY_DOWN;
        KEY_LEFT_PREV = KEY_LEFT;
        KEY_RIGHT_PREV = KEY_RIGHT;

        if (game.RELOAD === 1) {
            game = new Game();
            game.initialGeneration();
            game.generate();
            game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
        }
    }

    var interval = setInterval(step, DT * 1000);
})
},{"./draw.js":5,"./game.js":7,"./parameters":10,"./vec2.js":14}],10:[function(require,module,exports){
'use strict'


//// CONSTANTS ////
// Directions
window.NONE = 0
window.RIGHT = 3;
window.DOWN = 2;
window.LEFT = 4;
window.UP = 1;

// Subjects' types
window.SBJ_HEAL = 1;
window.SBJ_OIL = 2;
window.SBJ_WHISKEY = 3;
window.SBJ_MATCHBOX = 4;
window.SBJ_AMMO = 5;

// Monsters' names

window.MNS_ZOMBIE = 1;
window.MNS_GHOST = 2;
window.MNS_TENTACLE = 3;

//// GAME PREFERENCES ////
window.DT = 0.050; // Tick time in seconds
window.CELL_SIZE = 8;
window.TEXTURE_SIZE = 8;

window.EPS = 0.0001;

// Limitations for player
window.LIMIT_HP = 3;
window.LIMIT_OIL = 10;
window.LIMIT_MIND = 10;
window.LIMIT_MATCHES = 3;

window.OIL_CONSUMPTION = 0.2;
window.DIST_LIGHT = 7;
window.DIST_LOAD = 12;

window.MONSTER_LIMIT = 4; // Maximum number of monsters
window.MONSTER_PERIOD = 7; // Time between monsters spawn

window.SUBJECT_LIMIT = 5.5; // Maximum number of subjects
window.SUBJECT_PERIOD = 1.65; // Time between subjects spawn

// Map parameters
window.MARGIN = 3; // Cells on map's sides, that are not changing
window.SIZE_X = 20 + MARGIN * 2;
window.SIZE_Y = 20 + MARGIN * 2;

// Music
window.VOLUME = 1;

// Generation
window.SPEC_GRAVE_RADIUS = 10;
window.HARDNESS = 0;

// consts
window.LIFE_ETERNAL = -12222;


//// DRAW PREFERENCES ////
window.SCALE = 10; // 1 Cell in px
while (64 * SCALE <= Math.min(window.innerHeight, window.innerWidth)) {
    SCALE += 1;
}
SCALE = 7;

// Canvas
window.SCREEN = document.getElementById("screen");
SCREEN.width = SCREEN.height = 128 * SCALE;
window.CTX = SCREEN.getContext("2d");

// Images
function getImg(src) { // Load images
    let img = new Image();
    img.src = src;
    return img;
}

// Loading current imgs
window.IMGS_GROUND = [
    getImg("textures/grounds/ground1.png"),
    getImg("textures/grounds/ground2.png")
];

window.IMGS_COVERING = [
    getImg("textures/coverings/covering1.png"),
    getImg("textures/coverings/covering2.png"),
    getImg("textures/coverings/covering3.png"),
    getImg("textures/coverings/covering4.png"),
    getImg("textures/coverings/covering5.png"),
    getImg("textures/coverings/covering6.png"),
    getImg("textures/coverings/covering7.png"),
    getImg("textures/coverings/covering8.png")
];

window.IMGS_SPEC_GRAVE = [
    getImg("textures/spec_graves/spec_grave1.png"),
    getImg("textures/spec_graves/spec_grave2.png"),
    getImg("textures/spec_graves/spec_grave3.png")
];

window.IMGS_SPEC_MINI_GRAVE = [
    getImg("textures/spec_graves/spec_mini_grave1.png"),
    getImg("textures/spec_graves/spec_mini_grave2.png"),
    getImg("textures/spec_graves/spec_mini_grave3.png")
];

window.IMGS_GRAVE = [
    getImg("textures/graves/grave1.png"),
    getImg("textures/graves/grave2.png"),
    getImg("textures/graves/grave3.png"),
    getImg("textures/graves/grave4.png"),
    getImg("textures/graves/grave5.png"),
    getImg("textures/graves/grave6.png"),
    getImg("textures/graves/grave7.png"),
    getImg("textures/graves/grave8.png"),
    getImg("textures/graves/grave9.png"),
    getImg("textures/graves/grave10.png"),
    getImg("textures/graves/grave11.png"),
];

window.IMGS_GATES = [
    getImg("textures/gates1.png"),
    getImg("textures/gates2.png")
];

window.IMGS_MONSTER = [
    getImg("textures/monsters/monster1.png"),
    getImg("textures/monsters/monster2.png"),
    getImg("textures/monsters/monster3.png")
];

window.IMGS_SUBJECT = [
    getImg("textures/subjects/heal.png"),
    getImg("textures/subjects/oil.png"),
    getImg("textures/subjects/whiskey.png"),
    getImg("textures/subjects/matchbox.png"),
    getImg("textures/subjects/ammo.png")
];

// Player animation
window.ANM_PLAYER_STANDING = [
    getImg("textures/player/player_standing_0.png"),
    getImg("textures/player/player_standing_1.png")
];

window.ANM_PLAYER_MOVING_RIGHT = [
    getImg("textures/player/player_moving_right_0.png"),
    getImg("textures/player/player_moving_right_1.png")
];

window.ANM_PLAYER_MOVING_UP = [
    getImg("textures/player/player_moving_up_0.png"),
    getImg("textures/player/player_moving_up_1.png")
];

window.ANM_PLAYER_MOVING_DOWN = [
    getImg("textures/player/player_moving_down_0.png"),
    getImg("textures/player/player_moving_down_1.png")
];

// MONSTERS

window.ANM_ZOMBIE_STANDING = [
    getImg("textures/monsters/zombie_standing_0.png"),
    getImg("textures/monsters/zombie_standing_1.png")
];

window.ANM_ZOMBIE_MOVING_UP = [
    getImg("textures/monsters/zombie_moving_up_0.png"),
    getImg("textures/monsters/zombie_moving_up_1.png")
];

window.ANM_ZOMBIE_MOVING_DOWN = [
    getImg("textures/monsters/zombie_moving_down_0.png"),
    getImg("textures/monsters/zombie_moving_down_1.png")
];

window.ANM_ZOMBIE_MOVING_RIGHT = [
    getImg("textures/monsters/zombie_moving_right_0.png"),
    getImg("textures/monsters/zombie_moving_right_1.png")
];

// GATES
window.ANM_GATES = [
    getImg("textures/particles/gates/gates0.png"),
    getImg("textures/particles/gates/gates1.png"),
    getImg("textures/particles/gates/gates2.png"),
    getImg("textures/particles/gates/gates3.png")
];

window.ANM_GHOST_STANDING = [
    getImg("textures/monsters/ghost_standing_0.png"),
    getImg("textures/monsters/ghost_standing_1.png")
];

window.ANM_GHOST_MOVING_UP = [
    getImg("textures/monsters/ghost_moving_up_0.png"),
    getImg("textures/monsters/ghost_moving_up_1.png"),
    getImg("textures/monsters/ghost_moving_up_2.png"),
    getImg("textures/monsters/ghost_moving_up_3.png")

];

window.ANM_GHOST_MOVING_DOWN = [
    getImg("textures/monsters/ghost_moving_down_0.png"),
    getImg("textures/monsters/ghost_moving_down_1.png"),
    getImg("textures/monsters/ghost_moving_down_2.png"),
    getImg("textures/monsters/ghost_moving_down_3.png")
];

window.ANM_GHOST_MOVING_RIGHT = [
    getImg("textures/monsters/ghost_moving_right_0.png"),
    getImg("textures/monsters/ghost_moving_right_1.png"),
    getImg("textures/monsters/ghost_moving_right_2.png"),
    getImg("textures/monsters/ghost_moving_right_3.png"),
];

window.ANM_WORM_STANDING = [
    getImg("textures/monsters/worm_standing_0.png"),
    getImg("textures/monsters/worm_standing_1.png"),
    getImg("textures/monsters/worm_standing_2.png"),
    getImg("textures/monsters/worm_standing_3.png")
]

// ===================

window.IMG_MONSTER0 = getImg("textures/monsters/zombie_standing_0.png");
window.IMG_SHADOW = getImg("textures/shadow.png");
window.IMG_INTERFACE = getImg("textures/interface/interface.png");
window.IMG_INTERFACE_OVERLAY = getImg("textures/interface/interfaceOverlay.png");
window.IMG_MATCH = getImg("textures/interface/match.png");
window.IMG_MENTAL_DANGER = getImg("textures/interface/mental_danger.png");

// Endgame screens
window.IMG_DEAD = getImg("textures/interface/deathscreen.png");
window.IMG_DELIRIOUS = getImg("textures/interface/deliriumscreen.png");
window.IMG_WIN = getImg("textures/interface/winscreen.png");
window.IMG_START_SCREEN = getImg("textures/interface/startscreen.png");

// Sprite animations
window.ANM_BLOOD = [
    getImg("textures/particles/blood/blood0.png"),
    getImg("textures/particles/blood/blood1.png"),
    getImg("textures/particles/blood/blood2.png")
];

window.ANM_IGNITION_RED = [
    getImg("textures/particles/ignition/ignition_red_0.png"),
    getImg("textures/particles/ignition/ignition_red_1.png"),
    getImg("textures/particles/ignition/ignition_red_2.png"),
    getImg("textures/particles/ignition/ignition_red_3.png"),
    getImg("textures/particles/ignition/ignition_red_4.png"),
    getImg("textures/particles/ignition/ignition_red_5.png"),
];

window.ANM_IGNITION_GREEN = [
    getImg("textures/particles/ignition/ignition_green_0.png"),
    getImg("textures/particles/ignition/ignition_green_1.png"),
    getImg("textures/particles/ignition/ignition_green_2.png"),
    getImg("textures/particles/ignition/ignition_green_3.png"),
    getImg("textures/particles/ignition/ignition_green_4.png"),
    getImg("textures/particles/ignition/ignition_green_5.png"),
];

window.ANM_IGNITION_BLUE = [
    getImg("textures/particles/ignition/ignition_blue_0.png"),
    getImg("textures/particles/ignition/ignition_blue_1.png"),
    getImg("textures/particles/ignition/ignition_blue_2.png"),
    getImg("textures/particles/ignition/ignition_blue_3.png"),
    getImg("textures/particles/ignition/ignition_blue_4.png"),
    getImg("textures/particles/ignition/ignition_blue_5.png"),
];

window.ANM_IGNITION = [ANM_IGNITION_RED, ANM_IGNITION_GREEN, ANM_IGNITION_BLUE];

window.ANM_MATCH = [
    getImg("textures/particles/match/match0.png"),
    getImg("textures/particles/match/match1.png"),
    getImg("textures/particles/match/match2.png")
];

window.ANM_MATCH_BURNING = [
    getImg("textures/particles/match_burn/match_burn_0.png"),
    getImg("textures/particles/match_burn/match_burn_1.png"),
    getImg("textures/particles/match_burn/match_burn_2.png"),
    getImg("textures/particles/match_burn/match_burn_3.png"),
    getImg("textures/particles/match_burn/match_burn_4.png")
];

window.ANM_ACTIVE_GRAVE = [
    getImg("textures/particles/active_grave/active_grave_0.png"),
    getImg("textures/particles/active_grave/active_grave_1.png"),
    getImg("textures/particles/active_grave/active_grave_2.png"),
    getImg("textures/particles/active_grave/active_grave_3.png"),
    getImg("textures/particles/active_grave/active_grave_4.png")
];

window.ANM_PISTOL_SHOT = [
    getImg("textures/interface/pistol_shot/pistol_0.png"),
    getImg("textures/interface/pistol_shot/pistol_1.png"),
    getImg("textures/interface/pistol_shot/pistol_2.png"),
    getImg("textures/interface/pistol_shot/pistol_3.png"),
    getImg("textures/interface/pistol_shot/pistol_4.png")
];

window.ANM_TRACER_LEFT = [
    getImg("textures/particles/tracer/tracer_left.png")
];
window.ANM_TRACER_RIGHT = [
    getImg("textures/particles/tracer/tracer_right.png")
];
window.ANM_TRACER_UP = [
    getImg("textures/particles/tracer/tracer_up.png")
];
window.ANM_TRACER_DOWN = [
    getImg("textures/particles/tracer/tracer_down.png")
];

// Damage animation
window.ANM_DAMAGE = [
    getImg("textures/particles/damage/damage0.png"),
    getImg("textures/particles/damage/damage1.png"),
    getImg("textures/particles/damage/damage2.png"),
    getImg("textures/particles/damage/damage3.png")
];

//// KEY CONFIG ////
// Keys (0 - released, 1 - pressed)
window.KEY_W = 0; window.KEY_W_PREV = 0;
window.KEY_A = 0; window.KEY_A_PREV = 0;
window.KEY_S = 0; window.KEY_S_PREV = 0;
window.KEY_D = 0; window.KEY_D_PREV = 0;
window.KEY_X = 0; window.KEY_X_PREV = 0;
window.KEY_F = 0; window.KEY_F_PREV = 0;
window.KEY_1 = 0; window.KEY_1_PREV = 0;
window.KEY_2 = 0; window.KEY_2_PREV = 0;
window.KEY_UP = 0; window.KEY_UP_PREV = 0;
window.KEY_DOWN = 0; window.KEY_DOWN_PREV = 0;
window.KEY_LEFT = 0; window.KEY_LEFT_PREV = 0;
window.KEY_RIGHT = 0; window.KEY_RIGHT_PREV = 0;
window.KEY_ENTER = 0; window.KEY_ENTER_PREV = 0;
window.KEY_PLUS = 0; window.KEY_PLUS_PREV = 0;
window.KEY_MINUS = 0; window.KEY_MINUS_PREV = 0;

function checkKey(e, t) {
    if(e.keyCode == 87)
        KEY_W = t;	
    if(e.keyCode == 65)
        KEY_A = t;  
    if(e.keyCode == 83)
        KEY_S = t;
    if(e.keyCode == 68)
        KEY_D = t;
    if(e.keyCode == 88)
        KEY_X = t;
    if(e.keyCode == 70)
        KEY_F = t;
    if(e.keyCode == 49)
        KEY_1 = t;
    if(e.keyCode == 50)
        KEY_2 = t;
    if(e.keyCode == 37)
        KEY_LEFT = t;
    if(e.keyCode == 38)
        KEY_UP = t;
    if(e.keyCode == 39)
        KEY_RIGHT = t;
    if(e.keyCode == 40)
        KEY_DOWN = t;
    if (e.keyCode == 13)
        KEY_ENTER = t;
    if (e.keyCode == 189)
        KEY_MINUS = t;
    if (e.keyCode == 187)
        KEY_PLUS = t;
    
}

window.addEventListener('keydown', checkDown,false);
function checkDown(e) {
   
    // Checking for buttons pressed
    checkKey(e, 1);
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
    }
}

window.addEventListener('keyup', checkUp,false);
function checkUp(e) {
   
    // Checking for buttons pressed
    checkKey(e, 0);
}
},{}],11:[function(require,module,exports){

//// RANDOM ////

class Random {
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static random_float(min, max) {
        return (Math.random() * (max - min) + min);
    }

    static normalDistribution(min, max, iterations) {
        let sum = 0;
        for (let i = 0; i < iterations; i++)
            sum += this.random(min, max);
        return Math.round(sum / iterations);
    }

    static normalRoll(min, max, iterations) { // gives value from min to max with normal distribution
        let roll = this.normalDistribution(-max + min, +max - min, iterations);
        return Math.abs(roll) + min;
    }
}

module.exports = Random
},{}],12:[function(require,module,exports){

const Vec2 = require("./vec2")

class Subject {
    constructor(pos) {
        this.type = 0; // See types in parameters.js
        if (pos)
            this.pos = pos;
        else
            this.pos = new Vec2(0, 0);
    }
}

module.exports = Subject
},{"./vec2":14}],13:[function(require,module,exports){

const Vec2 = require("./vec2")

class TemporalLightSource {
    constructor(pos, power, lifespan) {
            if (pos)
                this.pos = pos.clone();
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
            } else {
                this.life = 0;
                this.alive = 0;
            }

            this.alive = 1;
    }

    // Fading
    step(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.life = 0;
            this.alive = 0;
        }

        this.power = Math.floor(this.initialPower * this.life / this.lifespan)
    }
}

module.exports = TemporalLightSource
},{"./vec2":14}],14:[function(require,module,exports){
//// 2D vector ////
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(a) {
        return new Vec2(this.x + a.x, this.y + a.y);
    }

    minus(a) {
        return new Vec2(this.x - a.x, this.y - a.y);
    }

    mult(a) {
        return new Vec2(this.x * a.x, this.y * a.y);
    }

    div(a) {
        return new Vec2(this.x / a.x, this.y / a.y);
    }

    dist(a) {
        let x = this.x - a.x;
        let y = this.y - a.y;
        return Math.abs(x) + Math.abs(y);
    }

    clone() {
        return new Vec2(this.x, this.y)
    }
}

module.exports = Vec2
},{}],15:[function(require,module,exports){
// Weapon
class Weapon {
    constructor() {
        this.damage = 1;
        // Ammo
        this.ammoMax = 5;
        this.ammo = this.ammoMax;
        // Cooldown
        this.cooldownTime = 1;
        this.timeToCooldown = this.cooldownTime;
    }
}

module.exports = Weapon
},{}]},{},[9]);

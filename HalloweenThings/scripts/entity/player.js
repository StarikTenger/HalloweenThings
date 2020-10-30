
const Entity = require("./entity")
const CharacterControls = require("../controls/character-controls")
const TemporalLightSource = require("../temporal-light-source.js")
const LightSource = require("../light-source")
const Animation = require("../animation")
const Weapon = require("../weapon")
const Vec2 = require("../vec2")
const Subject = require("../subject")
const Anime = require("../anime")

class Player extends Entity {

    /**
     * Lamp oil amount
     * @type {number}
     */
    oil = LIMIT_OIL;

    /**
     * Sanity factor
     * @type {number}
     */
    mind = LIMIT_MIND;

    /**
     * Lamp status
     * @type {boolean}
     */
    lamp = true

    /**
     * Light distance
     * @type {number}
     */
    distLight = DIST_LIGHT;

    /**
     * Items
     * @type Array<Subject|null>
     */
    subjects = [null, null];

    /**
     * Matches amount
     * @type {number}
     */
    matches = LIMIT_MATCHES

    /**
     * Player weapon
     * @type {Weapon}
     */
    weapon = new Weapon();

    constructor(config) {
        super(config);

        this.controls = new CharacterControls()

        let anm_standing = new Anime(0.5, ANM_PLAYER_STANDING);
        let anm_walking_right = new Anime(0.3, ANM_PLAYER_MOVING_RIGHT);
        let anm_walking_up = new Anime(0.3, ANM_PLAYER_MOVING_UP);
        let anm_walking_down = new Anime(0.3, ANM_PLAYER_MOVING_DOWN);
        this.set_animations(anm_standing, [anm_walking_up, anm_walking_down, anm_walking_right]);
    }

    step(dt) {
        super.step(dt)

        this.dir = NONE;

        let movement = this.controls.getMovement()
        if (movement.lengthSquared() > 0.01) { // <=> length() > 0.1

            this.game.move(this, movement)

            if (window.SOUND_STEPS.isPlaying !== 1) {
                window.SOUND_STEPS.play();
                window.SOUND_STEPS.isPlaying = 1;
            }

            if (movement.y < -0.1) this.dir = UP;
            else if (movement.y > 0.1) this.dir = DOWN;
            else if (movement.x < -0.1) {
                this.dir = LEFT;
                this.right = 0;
            }
            else if (movement.x > 0.1) {
                this.dir = RIGHT;
                this.right = 1;
            }
        }
        else {
            window.SOUND_STEPS.pause();
            window.SOUND_STEPS.isPlaying = 0;
        }

        this.animationType = this.dir;

        // Turning lamp off
        if (this.game.keyboard.keyPressedOnce("KeyX")) {
            this.lampOff()
        }

        if (this.lamp)
            this.changeOil(-OIL_CONSUMPTION * DT);

        // Horror
        if (!this.lamp) {
            this.changeMind(-0.35 * DT);
            this.game.mentalDanger = 1;
        }

        if (this.game.keyboard.keyPressedOnce("KeyF")) {
            this.useMatch();
        }

        this.tickWeapon();
        this.pickUpSubjects();
        this.useSubjects();
    }

    tickWeapon() {
        this.weapon.timeToCooldown -= DT;

        this.controls.updateShootingDirection()

        if (!this.controls.shootDirection.isZero()) {
            let dir = this.controls.shootDirection

            if (this.weapon.timeToCooldown <= 0 && this.weapon.ammo > 0) { // Are we able to shoot
                window.SOUND_SHOOT.play();
                // Stupid collision check
                let pos = new Vec2(this.pos.x, this.pos.y);

                for (let i = 0; i < 30; i++) {
                    let hit = 0;
                    for (let j = 0; j < this.game.monsters.length; j++) {
                        // Current monster
                        let monster = this.game.monsters[j];
                        // Shift
                        pos = pos.plus(dir);
                        // Collision check
                        if (pos.dist(monster.pos) < 8) {
                            this.game.hurt(monster, this.weapon.damage);
                        }
                    }
                    if (hit)
                        break;
                }

                // Animation
                let curAnm = ANM_TRACER_UP; // Current animation
                if (dir.y < 0) curAnm = ANM_TRACER_UP;
                else if (dir.y > 0)  curAnm = ANM_TRACER_DOWN;
                else if (dir.x < 0) curAnm = ANM_TRACER_LEFT;
                else if (dir.x > 0)  curAnm = ANM_TRACER_RIGHT;

                this.game.animations.push(new Animation(curAnm, this.pos.plus(new Vec2(-28, -36)), new Vec2(64, 64), 0.1));
                this.game.animations.push(new Animation(ANM_PISTOL_SHOT, new Vec2(1, 47), new Vec2(13, 7), 0.1, 1, 0));

                // Modify cooldown & ammo
                this.weapon.timeToCooldown =  this.weapon.cooldownTime;
                this.weapon.ammo--;
            }
        }
    }

    pickUpSubjects() {
        for (let i = 0; i < this.game.subjects.length; i++) {
            let subject = this.game.subjects[i];

            if (subject.pos.dist(this.pos) > 8) // Not close enough
                continue;


            let freeSlot = this.getFreeSubjectSlot()

            if(freeSlot === null) continue;

            window.SOUND_PICKUP.play();
            this.subjects[freeSlot] = new Subject();
            this.subjects[freeSlot].type = subject.type;

            subject.type = undefined;
        }
    }

    getFreeSubjectSlot() {
        for (let i = 0; i < 2; i++) {
            if (!this.subjects[i] || !this.subjects[i].type)
                return i
        }

        return null
    }

    useSubjects() {
        // // Use subjects
        if(this.game.keyboard.keyPressedOnce("Digit1")) {
            this.consumeSubject(0);
        }
        if(this.game.keyboard.keyPressedOnce("Digit2")) {
            this.consumeSubject(1)
        }
    }

    consumeSubject(index) {
        if(!this.subjects[index] || !this.subjects[index].type) // Slot is empty
            return

        // Current subject
        let subject = this.subjects[index];

        // Checking for subject type
        if (subject.type === SBJ_HEAL) {
            window.SOUND_DRINK.play();
            this.changeHp(1);
        }
        if (subject.type === SBJ_OIL) {
            window.SOUND_OIL.play();
            this.changeOil(7);
        }
        if (subject.type === SBJ_WHISKEY){
            window.SOUND_DRINK.play();
            this.changeMind(6);
        }
        if (subject.type === SBJ_MATCHBOX){
            window.SOUND_MATCHBOX.play();
            this.matches += 2;
            this.matches = Math.min(this.matches, LIMIT_MATCHES);
        }
        if (subject.type === SBJ_AMMO) {
            window.SOUND_AMMO.play();
            this.weapon.ammo += 5;
            this.weapon.ammo = Math.min(this.weapon.ammo, this.weapon.ammoMax);
        }

        // Remove subject
        this.subjects[index] = undefined;
    }

    useMatch() {
        if (this.matches > 0) {
            window.SOUND_MATCH.play();
            this.lampOn()
            this.matches--;
            this.game.temporalLightSources.push(new TemporalLightSource(this.pos, 5, 2));
            this.game.animations.push(new Animation(ANM_MATCH, this.pos.plus(new Vec2(0, -5)), new Vec2(8, 8), 0.1)); // In game
            this.game.animations.push(new Animation(ANM_MATCH_BURNING, new Vec2(22 + (this.matches - 1) * 2 + 1, 57), new Vec2(3, 7), 0.1, 1)); // In interface

            // Lighting spec graves
            let pos = this.grid_pos;
            for (let x = pos.x - 1; x <= pos.x + 1; ++x) {
                for (let y = pos.y - 1; y <= pos.y + 1; ++y) {
                    let cell = this.game.grid[x][y];
                    if (cell.grave < 0 && this.game.spec_graves_visited[-cell.grave - 1] === 1) { // spec grave

                        this.game.specGraveTimer = this.game.specGraveCooldown;
                        this.game.spec_graves_visited[-cell.grave - 1] = 2;
                        this.game.spec_lights.push(new LightSource(new Vec2(x * 8 + 4, y * 8 + 4), 2));
                        this.game.spec_graves_visited_count += 1;
                        this.game.animations.push(new Animation(ANM_IGNITION[-cell.grave - 1], new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(8, 16), 0.1));
                        this.game.animations.push(new Animation(ANM_ACTIVE_GRAVE, new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(8, 16), 0.15, 0, 1));
                        this.game.level++;

                        this.game.generate();
                    }
                }
            }

            // Open gates
            for (let x = 0; x < SIZE_X; x++) {
                for (let y = 0; y < SIZE_Y; y++) {
                    if (this.game.level < 3) // Gates are not ready
                        break;

                    // Check for player
                    if (this.game.gates_state === 1 && this.game.grid[x][y].gates === 1 && this.pos.dist(new Vec2(x * 8 + 8, y * 8 + 8)) < 32) {
                        this.game.gates_state = 2; // Gates opened
                        this.game.animations.push(new Animation(ANM_GATES, new Vec2(x * 8 + 4, y * 8 - 8), new Vec2(16, 16), 0.3));
                    }

                    // Clean obstacles
                    if (this.game.gates_state === 2 && this.game.grid[x][y].gates) {
                        this.game.grid[x][y].obstacle = 0;
                    }
                }
            }
        }
    }

    // mind += delta
    changeMind(delta) {
        this.mind += delta;

        if (this.mind < EPS) {
            this.mind = 0;
            this.status = 2; // Delirium
            if (!this.monsterType)
                window.SOUND_DEATH.play();
        }
        if (this.mind > LIMIT_MIND) {
            this.mind = LIMIT_MIND;
        }
    }

    // oil += delta
    changeOil(delta) {
        this.oil += delta;

        if (this.oil < 0) {
            this.oil = 0;
            this.lampOff()
        }
        if (this.oil > LIMIT_OIL) {
            this.oil = LIMIT_OIL;
        }
    }

    lampOff() {
        this.lamp = false
        this.distLight = 1
    }

    lampOn() {
        this.lamp = true
        this.distLight = DIST_LIGHT
    }
}

module.exports = Player
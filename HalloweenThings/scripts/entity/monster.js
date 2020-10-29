
const Entity = require("./entity")
const Vec2 = require("../vec2")
const Random = require("../random")

class Monster extends Entity {

    /**
     * crutch
     * @type {number}
     */
    monsterType = 0

    /**
     * Sanity consumption per second
     * @type {number}
     */
    horror = 0

    /**
     * Maximum distance to attack
     * @type {number}
     */
    attackRange = 5

    /**
     * The distance at which he see player
     * @type {number}
     */
    seenRange = 64

    /**
     * Monster damage
     * @type {number}
     */
    damage = 1

    /**
     * Monster level, indicates on which level monster cam be spawned
     * @type {number}
     */
    level = 0

    constructor(config) {
        super(config);
    }

    static getRandomMonster(game) {
        let classIndex = Math.floor(Math.random() * Monster.classes.length);
        let Clazz = Monster.classes[classIndex];
        // Chosing direction for skeleton patrolling
        return new Clazz({
            game:game
        })
    }

    step(dt) {
        if (this.pos.dist(this.game.player.pos) < this.seenRange)
            this.behavior();
        this.setDirection();
        super.step(dt);
        this.dealHorror();
        this.dealDamage();
    }

    behavior() {}

    setDirection() {
        let x1 = this.posPrev.x;
        let y1 = this.posPrev.y;
        let x2 = this.pos.x;
        let y2 = this.pos.y;

        if (x2 - x1 > 0) {
            this.right = 1;
            this.dir = RIGHT;
        }

        if (x2 - x1 < 0) {
            this.right = 0;
            this.dir = LEFT;
        }

        if (y2 - y1 > 0) {
            this.dir = DOWN;
        }

        if (y2 - y1 < 0) {
            this.dir = UP;
        }

        this.animationType = this.dir;
    }

    dealHorror() {
        if (this.game.grid[this.gridPos.x][this.gridPos.y].light > DIST_LIGHT - 1) {
            this.game.player.changeMind(-this.horror * DT);
            this.game.mentalDanger = 1;
        }
    }

    dealDamage() {
        if (this.pos.dist(this.game.player.pos) <= this.attackRange) {
            this.game.hurt(this.game.player, this.damage);
        }
    }
}

module.exports = Monster

// Trailing monster loader
// TODO: use my browserify module for this

Monster.classes = [
    require("./monsters/zombie"),
    require("./monsters/skeleton"),
    require("./monsters/tentaсle"),
    require("./monsters/ghost")
]

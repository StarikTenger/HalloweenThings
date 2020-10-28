
const Entity = require("./entity")

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
     * Monster damage
     * @type {number}
     */
    damage = 1

    constructor(config) {
        super(config);
    }

    static getRandomMonster(game) {
        let classIndex = Math.floor(Math.random() * Monster.classes.length)
        let Clazz = Monster.classes[classIndex]

        return new Clazz({
            game:game
        })
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


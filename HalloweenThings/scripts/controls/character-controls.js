
const Axle = require("./axle")
const Vec2 = require("../vec2")

class CharacterControls {
    constructor() {
        this.movementXAxle = new Axle()
        this.movementYAxle = new Axle()

        this.shootWestAxle = new Axle()
        this.shootEastAxle = new Axle()
        this.shootNorthAxle = new Axle()
        this.shootSouthAxle = new Axle()

        this.movement = new Vec2(0, 0)
        this.shootDirection = new Vec2(0, 0)
    }

    // TODO: make this a bit more effective
    /**
     * Updates and returns player movement vector
     * @return {Vec2}
     */
    getMovement() {
        this.movement.x = this.movementXAxle.getValue()
        this.movement.y = this.movementYAxle.getValue()

        return this.movement
    }

    updateShootingDirection() {

        let x = 0, y = 0;

        x -= Math.ceil(this.shootWestAxle.getValue())
        x += Math.ceil(this.shootEastAxle.getValue())
        y -= Math.ceil(this.shootNorthAxle.getValue())
        y += Math.ceil(this.shootSouthAxle.getValue())

        if(y !== 0 && x !== 0) x = 0;

        this.shootDirection.x = x
        this.shootDirection.y = y
    }
}

module.exports = CharacterControls
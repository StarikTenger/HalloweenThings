
const Axle = require("./axle")

class ButtonAxle extends Axle {
    constructor(min, max) {
        super()
        this.min = min === undefined ? 0 : min
        this.max = max === undefined ? 1 : max

        this.ownValue = this.min
        this.pressed = false
    }

    keyPressed() {
        this.pressed = true
        this.setNeedsUpdate()
    }

    keyReleased() {
        this.pressed = false
        this.setNeedsUpdate()
    }

    reverse() {
        this.max = -this.max
        this.min = -this.min
        return this
    }

    getValue() {
        this.ownValue = this.pressed ? this.max : this.min
        return this.ownValue
    }
}

module.exports = ButtonAxle
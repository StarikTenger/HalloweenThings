
const Axle = require("./axle")

class GamepadAxle extends Axle {
    constructor(controller, axle) {
        super();
        this.axle = axle
        this.controller = controller
        this.value = 0
        this.power = 1
        this.inverted = false
        this.controller.on("axle", (index, value) => {
            if(index === this.axle) {
                this.value = Math.pow(value, this.power)
                this.setNeedsUpdate()
            }
        })
    }

    invert() {
        this.inverted = !this.inverted
        return this
    }

    getValue() {
        return this.inverted ? -this.value : this.value
    }
}

module.exports = GamepadAxle
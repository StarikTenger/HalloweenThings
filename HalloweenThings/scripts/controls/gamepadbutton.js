
const ButtonAxle = require("./buttonaxle")

class GamepadButton extends ButtonAxle {
    constructor(gamepad, button, min, max) {
        super(max, min);

        this.button = button
        gamepad.on("button", (index, value) => {
            if(index === this.button) {
                this.keyPressed(value)
            }
        })
    }
}

module.exports = GamepadButton
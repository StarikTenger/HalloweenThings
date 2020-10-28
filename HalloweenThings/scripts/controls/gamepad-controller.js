
const DocumentEventHandler = require("../events/documenteventhandler")
const GamepadAxle = require("./gamepadaxle")
const GamepadButton = require("./gamepadbutton")

navigator.getGamepads = navigator.getGamepads || navigator["webkitGetGamepads"]

class GamepadController extends DocumentEventHandler {
    constructor() {
        super();

        this.gamepad = null
        this.axises = []
        this.buttons = []
        this.target = window
    }

    startListening() {
        if(navigator.getGamepads) {
            this.bind("gamepadconnected", this.gamepadConnected)
            this.bind("gamepaddisconnected", this.gamepadDisconnected)
        }
    }

    refresh() {
        if(this.gamepad === null) return

        for(let [i, button] of navigator.getGamepads()[this.gamepad].buttons.entries()) {
            let value = typeof button === "number" ? button : button.value
            if(this.buttons[i] !== value) {
                this.emit("button", i, value)
                this.buttons[i] = value
            }
        }

        for(let [i, axis] of navigator.getGamepads()[this.gamepad].axes.entries()) {
            if(this.axises[i] !== axis) {
                this.emit("axle", i, axis)
                this.axises[i] = axis
            }
        }
    }

    gamepadConnected(event) {
        console.log("hey!!!")
        if(this.gamepad !== null) {
            return
        }
        this.gamepad = event.gamepad.index
        this.axises = new Array(navigator.getGamepads()[this.gamepad].axes.length)
    }

    gamepadDisconnected(event) {
        if(event.gamepad.index === this.gamepad) {
            this.gamepad = null
        }
    }

    getAxle(index) {
        return new GamepadAxle(this, index)
    }

    getButton(index) {
        return new GamepadButton(this, index)
    }
}

module.exports = GamepadController
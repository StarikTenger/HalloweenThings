
const Axle = require("./axle")
const EventEmitter = require("../utils/event-emitter")

class UserControls extends EventEmitter {
    constructor() {
        super()

        this.axles = new Map()
        this.createAxle("movement-x")
        this.createAxle("movement-y")
        this.createAxle("shoot-west")
        this.createAxle("shoot-east")
        this.createAxle("shoot-north")
        this.createAxle("shoot-south")

        this.createAxle("respawn")
    }

    createAxle(name, dimensions) {
        this.axles.set(name, new Axle(dimensions))
    }

    connectCharacterControls(controls) {
        controls.movementXAxle.addSource(this.axles.get("movement-x"))
        controls.movementYAxle.addSource(this.axles.get("movement-y"))

        controls.shootWestAxle.addSource(this.axles.get("shoot-west"))
        controls.shootEastAxle.addSource(this.axles.get("shoot-east"))
        controls.shootNorthAxle.addSource(this.axles.get("shoot-north"))
        controls.shootSouthAxle.addSource(this.axles.get("shoot-south"))
    }

    disconnectCharacterControls() {
        this.axles.get("movement-x").disconnectAll()
        this.axles.get("movement-y").disconnectAll()

        this.axles.get("shoot-west") .disconnectAll()
        this.axles.get("shoot-east") .disconnectAll()
        this.axles.get("shoot-north").disconnectAll()
        this.axles.get("shoot-south").disconnectAll()
    }

    setupGamepad(gamepad) {
        this.axles.get("movement-x").addSource(gamepad.getAxle(2))
        this.axles.get("movement-y").addSource(gamepad.getAxle(3))

        this.axles.get("shoot-west") .addSource(gamepad.getButton(14));
        this.axles.get("shoot-east") .addSource(gamepad.getButton(15));
        this.axles.get("shoot-north").addSource(gamepad.getButton(12));
        this.axles.get("shoot-south").addSource(gamepad.getButton(13));
    }

    setupKeyboard(keyboard) {
        this.axles.get("movement-y")
            .addSource(keyboard.getKeyAxle("KeyW").reverse())
            .addSource(keyboard.getKeyAxle("KeyS"))

        this.axles.get("movement-x")
            .addSource(keyboard.getKeyAxle("KeyD"))
            .addSource(keyboard.getKeyAxle("KeyA").reverse())

        this.axles.get("shoot-west").addSource(keyboard.getKeyAxle("ArrowLeft"))
        this.axles.get("shoot-east").addSource(keyboard.getKeyAxle("ArrowRight"))
        this.axles.get("shoot-north").addSource(keyboard.getKeyAxle("ArrowUp"))
        this.axles.get("shoot-south").addSource(keyboard.getKeyAxle("ArrowDown"))
    }
}

module.exports = UserControls
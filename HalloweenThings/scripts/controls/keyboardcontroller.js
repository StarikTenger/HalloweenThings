
const DocumentEventHandler = require("../events/documenteventhandler")
const KeyAxle = require("./keyaxle")

class KeyboardController extends DocumentEventHandler {
    constructor() {
        super()
        this.keys = new Set()
        this.keybindings = []
        this.isMacOS = navigator.userAgent.indexOf("Mac") !== -1
    }

    keybinding(name, handler) {
        let parts = name.split("-")
        let cmd = parts.indexOf("Cmd") !== -1
        let shift = parts.indexOf("Shift") !== -1
        let alt = parts.indexOf("Alt") !== -1
        let key = parts.pop()

        this.on("keydown", (event) => {
            let eventCmd = this.isMacOS ? event.metaKey : event.ctrlKey
            let eventShift = event.shiftKey
            let eventAlt = event.altKey

            let eventKey = event.code
            if(eventKey.startsWith("Key")) eventKey = eventKey.substr(3)

            if(eventCmd !== cmd) return;
            if(eventShift !== shift) return;
            if(eventAlt !== alt) return;
            if(eventKey !== key) return;

            event.preventDefault()

            handler(event)
        })
    }

    startListening() {
        this.bind("keyup", this.keyup)
        this.bind("keydown", this.keydown)
    }

    keyPressed() {
        for(let argument of arguments) {
            if (this.keys.has(argument)) return true
        }
        return false
    }

    keyPressedOnce(key) {
        if(this.keys.has(key)) {
            this.keys.delete(key)
            return true
        }
        return false
    }

    keyup(e) {
        this.emit("keyup", e)
        this.keys.delete(e.code)
    }

    keydown(e) {
        if(e.repeat) {
            e.preventDefault()
            return
        }
        this.emit("keydown", e)
        this.keys.add(e.code)
    }

    // for future gamepad support
    getKeyAxle(key, min, max) {
        return new KeyAxle(this, key, min, max)
    }
}

module.exports = KeyboardController
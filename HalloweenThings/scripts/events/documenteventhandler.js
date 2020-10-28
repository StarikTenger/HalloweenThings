
const EventEmitter = require("../utils/event-emitter")

class DocumentEventHandler extends EventEmitter {
    constructor() {
        super()
        /** @type Map<string,any> */
        this.listeners = new Map()
        this.target = document.body
    }

    bind(event, handler) {
        if(this.listeners.has(event)) {
            this.unbind(event)
        }
        const self = this
        const listener = function(){ handler.apply(self, arguments) }


        this.listeners.set(event, listener)

        if(Array.isArray(this.target)) {
            for (let target of this.target)
                target.addEventListener(event, listener)
        } else {
            this.target.addEventListener(event, listener)
        }
    }

    unbind(event) {
        if(Array.isArray(this.target)) {
            for (let target of this.target)
                target.removeEventListener(event, this.listeners.get(event))
        } else {
            this.target.removeEventListener(event, this.listeners.get(event))
        }

        this.listeners.delete(event)
    }

    startListening() {}
    stopListening() {
        for(let event of this.listeners.keys()) {
            this.unbind(event)
        }
        this.keys.clear()
        this.listeners.clear()
    }
}

module.exports = DocumentEventHandler
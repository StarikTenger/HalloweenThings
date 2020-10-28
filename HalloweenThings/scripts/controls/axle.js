
class Axle {
    constructor() {
        this.sources = new Set()
        this.ownValue = 0
        this.value = 0
        this.update = false

        this.destinations = new Set()
    }

    addSource(source) {
        this.sources.add(source)
        source.destinations.add(this)
        this.setNeedsUpdate()
        return this
    }

    removeSource(source) {
        this.sources.delete(source)
        source.destinations.delete(this)
        this.setNeedsUpdate()
        return this
    }

    disconnectAll() {
        for(let destination of this.destinations.values()) {
            destination.removeSource(this)
        }
    }

    connect(destination) {
        destination.addSource(this)
    }

    getValue() {
        if (this.update) {
            this.update = false
            let result = this.ownValue

            for (let source of this.sources.values()) result += source.getValue()
            this.value = result
            return result
        } else {
            return this.value
        }
    }

    setValue(value) {
        this.ownValue = value
        this.setNeedsUpdate()
    }

    setNeedsUpdate() {
        this.update = true

        for(let destination of this.destinations.values())
            destination.setNeedsUpdate()
    }

    needsUpdate() {
        return this.update
    }
}

module.exports = Axle
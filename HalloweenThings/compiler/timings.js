
const util = require("util")

class Entry {
    constructor(title) {
        this.title = title
        this.date = Date.now()
        this.hasSubtasks = false
    }
}

class Timings {
    static stack = []

    static tab() {
        return new Array(this.stack.length + 1).join(" - ")
    }

    static begin(title) {
        if(this.stack.length > 0)
            this.stack[this.stack.length - 1].hasSubtasks = true

        process.stdout.write("\n" + this.tab() + title + ":")
        this.stack.push(new Entry(title))
    }

    static perform(title, task) {
        this.begin(title)

        if(util.types.isAsyncFunction(task)) {
            return task().then(() => this.end())
        }

        task()
        this.end()
    }

    static end() {
        let task = this.stack.pop()

        let time = ((Date.now() - task.date) / 1000).toFixed(3)

        if(task.hasSubtasks) {
            process.stdout.write("\n" + this.tab() + task.title + ": [" + time + "s]")
        } else {
            process.stdout.write(" [" + time + "s]")
        }
    }
}

module.exports = Timings
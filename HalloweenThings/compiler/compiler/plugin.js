class Plugin {
    constructor(options) {
        options = options || {}
        this.options = options
    }

    setCompiler(compiler) {
        this.compiler = compiler
    }

    async perform(resources) {

    }
}

module.exports = Plugin

const babelify = require('babelify')
const browserify = require("browserify")
const incremental = require('browserify-incremental')
const SASS = require("node-sass")
const CompileCache = require("../compilecache")
const JSBuilder = require("../jsbuilder")
const GLSLMinify = require("../glsl-minifier/glsl-minifier")
const Timings = require("../timings")
const resourceify = require("../resourceify")
const folderify = require("../folderify")
const aliasify = require("aliasify")

const fs = require('fs')
const path = require("path")

const cacheFile = path.resolve(__dirname, '../cache/browserify-cache.json')

class Compiler {

    static projectDirectory = path.resolve(__dirname, "../..")

    constructor(options) {
        this.options = options

         /**
         * @type {Plugin[]}
         */

        this.plugins = []
        this.babelify = null
        this.resourcify = null
        this.result = ""
    }

    /**
     * @param plugin {Plugin}
     */
    plugin(plugin) {
        plugin.setCompiler(this)
        this.plugins.push(plugin)
        return this
    }

    static path(s) {
        return path.resolve(this.projectDirectory, s)
    }

    /**
     * @private
     * @param options Compiler options
     * @return {Browserify}
     */
    createCompiler(options) {

        let o = Object.assign({}, incremental.args, {
            paths: [
                Compiler.projectDirectory + "/"
            ]
        })

        const compiler = browserify(o)
        incremental(compiler, { cacheFile: options.cacheFile })

        this.resourcify = resourceify()
        this.babelify = babelify.configure({
            "plugins": [
                ["@babel/plugin-proposal-class-properties", { loose: true }]
            ],
            sourceMaps: false
        })

        compiler.transform(this.babelify)
        compiler.transform(aliasify, {
            replacements: {
                "^/": function(path) {
                    return path.substr(1)
                }
            },
        })
        compiler.transform(folderify)
        compiler.plugin(this.resourcify.plugin)
        compiler.require(options.source, { entry: true })

        return compiler
    }

    list() {
        return new Promise((resolve, reject) => {
            let source = Compiler.path(this.options.source)
            let cacheFile = Compiler.path(this.options.cacheFile)

            this.compiler = this.createCompiler({
                source: source,
                cacheFile: cacheFile
            })

            this.compiler.bundle()
                .on('error', reject)
                .on('finish', async () => {
                    resolve(this.resourcify.entries)
                })
        })
    }

    compile() {
        return new Promise((resolve, reject) => {
            Timings.begin("Compiling scripts")

            let source = Compiler.path(this.options.source)
            let cacheFile = this.options.cacheFile ? Compiler.path(this.options.cacheFile) : null

            this.compiler = this.createCompiler({
                source: source,
                cacheFile: cacheFile
            })

            this.compiler.bundle()
                .on('data', (data) => this.result += data)
                .on('error', reject)
                .on('finish', async () => {
                    Timings.end()
                    await this.finished()
                    resolve()
                })
        })
    }

    /**
     * @async
     * @private
     * @return {Promise>}
     */

    async finished() {

        Timings.begin("Reading resources")

        await this.resourcify.readResources()

        Timings.end()

        for(let plugin of this.plugins) {
            await plugin.perform(this.resourcify.resources)
        }

        let destination = Compiler.path(this.options.destination)
        let dirname = path.dirname(destination)
        try {
            await fs.promises.access(dirname)
        } catch(error) {
            await fs.promises.mkdir(dirname, { recursive: true })
        }
        await fs.promises.writeFile(destination, this.result)
    }

    static async clearCache() {
        try {
            await fs.promises.unlink(cacheFile)
        } catch(e) {}
    }
}

module.exports = Compiler
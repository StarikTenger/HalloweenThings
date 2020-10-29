
const Compiler = require("../compiler/compiler");
const Collapser = require("../collapser");
const Timings = require("../timings");

async function compile() {
    async function bundle(options) {
        options = Object.assign({
            cacheFile: "build/cache/browserify-cache.json"
        }, options)

        let compiler = new Compiler(options)
        await compiler.compile()
    }

    await Timings.perform("Compiling", async () => {
        await Timings.perform("Compiling base", async () => {
            await bundle({
                source: "scripts/main.js",
                destination: "build/bundle.js"
            })
        })
    })
}

(async function perform() {
    Timings.begin("Building")
    await compile()

    Timings.begin("Collapsing")
    await Collapser.collapse(Compiler.path("build/bundle.js"))
    Timings.end()
    Timings.end()
})()

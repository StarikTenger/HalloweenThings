
const Compiler = require("../compiler/compiler");
const Collapser = require("../collapser");
const Timings = require("../timings");
const CSSPlugin = require("../compiler/plugins/css/cssplugin");
const GLSLPlugin = require("../compiler/plugins/glslplugin");

async function compile() {
    let cssPlugin = new CSSPlugin()

    async function bundle(options) {
        options = Object.assign({
            cacheFile: "build/cache/browserify-cache.json"
        }, options)

        let compiler = new Compiler(options)
        compiler.plugin(cssPlugin)
        compiler.plugin(new GLSLPlugin({
            placeholder: "shader-loader-placeholder"
        }))

        await compiler.compile()
    }

    await Timings.perform("Compiling", async () => {
        await Timings.perform("Compiling base", async () => {
            await bundle({
                source: "src/client/game/index.js",
                destination: "src/client/game/page/scripts/index.js"
            })
        })

        await Timings.perform("Compiling game", async () => {
            await bundle({
                source: "src/client/game/game.js",
                destination: "src/client/game/page/scripts/game.js"
            })
        })

        await cssPlugin.write(Compiler.path("src/client/game/page/styles/style.css"))
    })
}

(async function perform() {
    Timings.begin("Building")
    await compile()

    Timings.begin("Collapsing")
    await Collapser.collapse(Compiler.path("src/client/game/page/scripts/index.js"))
    await Collapser.collapse(Compiler.path("src/client/game/page/scripts/game.js"))
    Timings.end()
    Timings.end()
})()

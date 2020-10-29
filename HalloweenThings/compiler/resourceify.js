const path = require("path")
const CompilerCache = require("./compilecache")
const Compiler = () => require("./compiler/compiler")
const prefix = "/* @load-resource: "
const suffix = "*/"

function findResources(string, file) {
    return string.split("\n")
        .map(a => a.trim())
        .filter(a => a.startsWith(prefix) && a.endsWith(suffix))
        .map(a => {
            return a.substr(prefix.length, a.length - prefix.length - suffix.length).trim().replace(/["']/g, "")
        })
        .map(a => {
            if (a.startsWith("/"))
                return path.resolve(Compiler().projectDirectory, a.substr(1))
            return path.resolve(file, "..", a)
        }).map(a => { return {
            "caller": file,
            "resource": a
        }})
}

module.exports = function() {

    let result = {
        resources: [],
        entries: [],
        plugin: null
    }

    result.readResources = async function() {
        let cache = await CompilerCache.readCache("resourceify")

        for(let entry of result.entries) {
            let name = entry.file

            let resources

            if (await CompilerCache.shouldUpdate(name, cache)) {
                resources = findResources(entry.source, entry.file)
                CompilerCache.updateFile(name, cache, resources)
            } else {
                resources = CompilerCache.readCachedFile(name, cache)
            }

            if (resources.length)
                result.resources = result.resources.concat(resources)
        }

        await CompilerCache.writeCache("resourceify", cache)

        return result.resources
    }

    result.plugin = function (b, opts) {

        let depsStream = b.pipeline._streams.filter(stream => stream.label === "json")[0]
        depsStream.on('data', async function(entry) {
            result.entries.push(entry)
        })
    }

    return result
}
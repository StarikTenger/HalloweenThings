
const Compiler = require("../compiler/compiler")
const CompilerCache = require("../compilecache")

Compiler.clearCache()
CompilerCache.clear()

console.log("Build cache has been deleted")

class JSBuilder {
    static replace(string, map) {

        let lines = string.split("\n")

        for(let key in map) if(map.hasOwnProperty(key)) {
            let replace = `#${key}#`
            let target = map[key]
            for(let i = lines.length - 1; i >= 0; i--) {
                let line = lines[i]
                let index = line.search(/[^\s\\]/)

                let clear = line.trim()

                if((clear.startsWith("/*") && clear.endsWith("*/")) || clear.startsWith("//")) {
                    if(line.indexOf(replace) !== -1) {
                        lines[i] = line.substr(0, index) + target
                    }
                } else {
                    if(line.indexOf(replace) !== -1) {
                        lines[i] = lines[i].replace(replace, target)
                    }
                }
            }
        }

        return lines.join("\n")
    }
}

module.exports = JSBuilder
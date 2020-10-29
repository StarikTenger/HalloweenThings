
const collapse = require('bundle-collapser');
const fs = require("fs");

class Collapser {
    static async collapse(file) {
        return new Promise((resolve, reject) => {
            collapse(fs.readFileSync(file, 'utf8'))
                .pipe(fs.createWriteStream(file))
                .on("finish", resolve)
        })
    }
}

module.exports = Collapser
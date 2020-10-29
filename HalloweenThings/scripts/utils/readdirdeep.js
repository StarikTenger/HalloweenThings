
let fs = require('fs');
let path = require('path');

/**
 * @returns {Promise<Array<String>>}
 */
module.exports = async function readdirSync(p, a = [], c = "") {
    if (fs.statSync(p).isDirectory())
        await fs.readdirSync(p).map(async f => {
            let item = path.join(p, f)
            let dir = path.join(c, f)
            a.push(dir)

            await readdirSync(item, a, dir)
        })
    return a
}
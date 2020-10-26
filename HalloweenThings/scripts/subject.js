
const Vec2 = require("./vec2")

class Subject {
    constructor(pos) {
        this.type = 0; // See types in parameters.js
        if (pos)
            this.pos = pos;
        else
            this.pos = new Vec2(0, 0);
    }
}

module.exports = Subject
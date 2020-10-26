// Light source
class LightSource {
    constructor(pos, power) {
        if (pos)
            this.pos = pos.clone();
        else
            this.pos = new Vec2(0, 0);
        if (power)
            this.power = power;
        else
            this.power = 0;
    }
}

module.exports = LightSource
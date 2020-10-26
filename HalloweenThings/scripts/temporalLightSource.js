
const Vec2 = require("./vec2")

class TemporalLightSource {
    constructor(pos, power, lifespan) {
            if (pos)
                this.pos = pos.clone();
            else
                this.pos = new Vec2(0, 0);
            if (power)
                this.power = power;
            else
                this.power = 0;
            if (lifespan) {
                this.lifespan = lifespan;
                this.life = this.lifespan;
                this.initialPower = this.power;
            } else {
                this.life = 0;
                this.alive = 0;
            }

            this.alive = 1;
    }

    // Fading
    step(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.life = 0;
            this.alive = 0;
        }

        this.power = Math.floor(this.initialPower * this.life / this.lifespan)
    }
}

module.exports = TemporalLightSource
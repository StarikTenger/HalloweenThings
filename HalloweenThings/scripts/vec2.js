//// 2D vector ////
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(a) {
        return new Vec2(this.x + a.x, this.y + a.y);
    }

    minus(a) {
        return new Vec2(this.x - a.x, this.y - a.y);
    }

    mult(a) {
        return new Vec2(this.x * a.x, this.y * a.y);
    }

    div(a) {
        return new Vec2(this.x / a.x, this.y / a.y);
    }

    dist(a) {
        let x = this.x - a.x;
        let y = this.y - a.y;
        return Math.abs(x) + Math.abs(y);
    }

    clone() {
        return new Vec2(this.x, this.y)
    }
}

module.exports = Vec2
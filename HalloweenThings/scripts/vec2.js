
/**
 * 2D Vector
 */

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        Vec2.counter++
    }

    plus(a) {
        return new Vec2(this.x + a.x, this.y + a.y);
    }

    add(a) {
        this.x += a.x
        this.y += a.y
    }

    addScalars(x, y) {
        this.x += x
        this.y += y
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

    distToPosition(x, y) {
        x = this.x - x;
        y = this.y - y;
        return Math.abs(x) + Math.abs(y);
    }

    set(x, y) {
        this.x = x
        this.y = y
    }

    isZero() {
        return this.x === 0 && this.y === 0
    }

    lengthSquared() {
        return this.x ** 2 + this.y ** 2
    }

    length() {
        return Math.sqrt(this.lengthSquared())
    }

    clone() {
        return new Vec2(this.x, this.y)
    }
}

Vec2.counter = 0

module.exports = Vec2
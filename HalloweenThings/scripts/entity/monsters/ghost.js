
const Monster = require("../monster")
const Random = require("../../random")
const Anime = require("../../anime")
const Vec2 = require("../../vec2")

class Ghost extends Monster {
    constructor(config) {
        super(config);

        this.hp = Random.random(1, 3);
        this.horror = 0.3

        let standing_animation = new Anime(0.5, ANM_GHOST_STANDING);
        let moving_up_animation = new Anime(0.3, ANM_GHOST_MOVING_UP);
        let moving_down_animation = new Anime(0.3, ANM_GHOST_MOVING_DOWN);
        let moving_right_animation = new Anime(0.3, ANM_GHOST_MOVING_RIGHT);

        this.set_animations(standing_animation, [moving_up_animation, moving_down_animation, moving_right_animation]);
    }

    behavior() {
        super.behavior();
        // Movement
        let deltaPos = new Vec2(0, 0);
        let gridPosLeft = this.game.getCell(this.pos.plus(new Vec2(-1, 0)));
        let gridPosRight = this.game.getCell(this.pos.plus(new Vec2(+1, 0)));

        if (this.dir === LEFT && this.game.grid[gridPosLeft.x][gridPosLeft.y].obstacle) {
            this.dir = RIGHT;
            console.log('l');
        }
        if (this.dir === RIGHT && this.game.grid[gridPosRight.x][gridPosRight.y].obstacle) {
            this.dir = LEFT;
            console.log('r');
        }

        if (this.dir === LEFT) {
            deltaPos.x = -1;
        }
        else {
            deltaPos.x = 1;
        }


        let vel = 0.5;
        this.game.move(this, deltaPos.mult(new Vec2(vel, vel)), 0);
    }
}

module.exports = Ghost
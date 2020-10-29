
const Monster = require("../monster")
const Random = require("../../random")
const Anime = require("../../anime")
const Vec2 = require("../../vec2")

class Skeleton extends Monster {
    constructor(config) {
        super(config);

        this.hp = Random.random(2, 3);
        this.horror = 0.1
        this.seenRange = 100000;

        this.patrolDir = Random.random(1, 4);

        // let standing_animation = new Anime(0.5, ANM_SKELETON_STANDING);
        // let moving_up_animation = new Anime(0.3, ANM_SKELETON_MOVING_UP);
        // let moving_down_animation = new Anime(0.3, ANM_SKELETON_MOVING_DOWN);
        // let moving_right_animation = new Anime(0.3, ANM_SKELETON_MOVING_RIGHT);

        let standing_animation = new Anime(0.5, ANM_ZOMBIE_STANDING);
        let moving_up_animation = new Anime(0.3, ANM_ZOMBIE_MOVING_UP);
        let moving_down_animation = new Anime(0.3, ANM_ZOMBIE_MOVING_DOWN);
        let moving_right_animation = new Anime(0.3, ANM_ZOMBIE_MOVING_RIGHT);

        this.set_animations(standing_animation, [moving_up_animation, moving_down_animation, moving_right_animation]);
    }

    behavior() {
        super.behavior();

        // Movement
        let deltaPos = new Vec2(0, 0);
        let gridPosLeft = this.game.getCell(this.pos.plus(new Vec2(-1, 0)));
        let gridPosRight = this.game.getCell(this.pos.plus(new Vec2(+1, 0)));
        let gridPosUp = this.game.getCell(this.pos.plus(new Vec2(0, -1)));
        let gridPosDown = this.game.getCell(this.pos.plus(new Vec2(0, +1)));

        if (this.patrolDir === LEFT && this.game.grid[gridPosLeft.x][gridPosLeft.y].obstacle) {
            this.patrolDir = Random.random(1, 4);
        }
        if (this.patrolDir === RIGHT && this.game.grid[gridPosRight.x][gridPosRight.y].obstacle) {
            this.patrolDir = Random.random(1, 4);
        }
        if (this.patrolDir === UP && this.game.grid[gridPosUp.x][gridPosUp.y].obstacle) {
            this.patrolDir = Random.random(1, 4);
        }
        if (this.patrolDir === DOWN && this.game.grid[gridPosDown.x][gridPosDown.y].obstacle) {
            this.patrolDir = Random.random(1, 4);
        }

        if (this.patrolDir === LEFT) {
            deltaPos.x = -1;
        }
        else if (this.patrolDir === RIGHT) {
            deltaPos.x = 1;
        }
        else if (this.patrolDir === UP) {
            deltaPos.y = -1;
        }
        else if (this.patrolDir === DOWN) {
            deltaPos.y = 1;
        }


        let vel = 1;
        this.game.move(this, deltaPos.mult(new Vec2(vel, vel)), 0);
    }
}

module.exports = Skeleton
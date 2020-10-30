
const Monster = require("../monster")
const Random = require("../../random")
const Anime = require("../../anime")
const Vec2 = require("../../vec2")

class Bat extends Monster {
    constructor(config) {
        super(config);

        this.horror = 0.02
        this.hp = 1;
        this.level = 1;
        console.log("bat");

        let standing_animation = new Anime(0.5, ANM_BAT_MOVING);
        let moving_up_animation = new Anime(0.3, ANM_BAT_MOVING);
        let moving_down_animation = new Anime(0.3, ANM_BAT_MOVING);
        let moving_right_animation = new Anime(0.3, ANM_BAT_MOVING);

        this.set_animations(standing_animation, [moving_up_animation, moving_down_animation, moving_right_animation]);
    }

    // Bat dies after dealing damage
    dealDamage() {
        let dmg = super.dealDamage();
        if (dmg)
            this.game.hurt(this, 10);
        return dmg;
    }

    behavior() {
        super.behavior();
        // Movement
        let deltaPos = new Vec2(0, 0);
        // Check neighbor cells to find
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];
        for (let j = 0; j < 4; j++) {
            let pos1 = this.gridPos.plus(neighbors[j]);
            if (this.game.checkCell(pos1) || this.game.grid[pos1.x][pos1.y].obstacle)
                continue;
            if (this.game.grid[pos1.x][pos1.y].zombieNav > this.game.grid[this.gridPos.x][this.gridPos.y].zombieNav)
                deltaPos = deltaPos.plus(neighbors[j]);
        }

        let vel = 1;
        this.game.move(this, deltaPos.mult(new Vec2(vel, vel)), 0);
    }
}

module.exports = Bat

const Monster = require("../monster")
const Random = require("../../random")
const Anime = require("../../anime")

class Zombie extends Monster {
    constructor(config) {
        super(config);

        this.horror = 0.2
        this.hp = Random.random(2, 3);

        let standing_animation = new Anime(0.5, ANM_ZOMBIE_STANDING);
        let moving_up_animation = new Anime(0.3, ANM_ZOMBIE_MOVING_UP);
        let moving_down_animation = new Anime(0.3, ANM_ZOMBIE_MOVING_DOWN);
        let moving_right_animation = new Anime(0.3, ANM_ZOMBIE_MOVING_RIGHT);

        this.set_animations(standing_animation, [moving_up_animation, moving_down_animation, moving_right_animation]);
    }
}

module.exports = Zombie
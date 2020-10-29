
const Monster = require("../monster")
const Random = require("../../random")
const Anime = require("../../anime")
const Vec2 = require("../../vec2")

class Tentacle extends Monster {
    constructor(config) {
        super(config);

        this.hp = Random.random(3, 4);
        this.horror = 0.5

        let standing_animation = new Anime(0.5, ANM_WORM_STANDING);
        let moving_up_animation = new Anime(0.3, ANM_WORM_STANDING);
        let moving_down_animation = new Anime(0.3, ANM_WORM_STANDING);
        let moving_right_animation = new Anime(0.3, ANM_WORM_STANDING);

        this.set_animations(standing_animation, [moving_up_animation, moving_down_animation, moving_right_animation]);
    }
}

module.exports = Tentacle

const Monster = require("../monster")
const Random = require("../../random")
const Anime = require("../../anime")
const Vec2 = require("../../vec2")

class Tentacle extends Monster {
    constructor(config) {
        super(config);

        this.hp = Random.random(3, 4);
        this.horror = 0.5;
        this.level = 3;
        console.log("tentacle");

        // Spawns bat with that period
        this.batSpawnPeriod = 5;
        // Time to next bat spawn
        this.batSpawnTimer = this.batSpawnPeriod;

        let standing_animation = new Anime(0.5, ANM_WORM_STANDING);
        let moving_up_animation = new Anime(0.3, ANM_WORM_STANDING);
        let moving_down_animation = new Anime(0.3, ANM_WORM_STANDING);
        let moving_right_animation = new Anime(0.3, ANM_WORM_STANDING);

        this.set_animations(standing_animation, [moving_up_animation, moving_down_animation, moving_right_animation]);
    }

    behavior() {
        super.behavior();
        this.batSpawnTimer -= this.game.dt;
        if (this.batSpawnTimer < 0) {
            // Spawning a bat
            this.spawnSibling();
            this.batSpawnTimer = this.batSpawnPeriod;
        }
    }
}

module.exports = Tentacle
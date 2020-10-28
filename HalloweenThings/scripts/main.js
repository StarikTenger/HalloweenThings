
const Parameters = require("./parameters")
const Game = require("./game.js")
const Draw = require("./draw.js")
const Vec2 = require("./vec2.js")


window.addEventListener("load", function() {
    let game = new Game();
    let draw = new Draw(CTX);

    game.initialGeneration();
    game.generate();
    game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
    game.player.status = 4;

    window.game = game; // For checking from console

    function step() {
        Vec2.counter = 0

        game.step();
        draw.draw(game);

        // if (KEY_MINUS) {
        //     VOLUME = Math.max(0, VOLUME - 0.1);
        // }
        // if (KEY_PLUS) {
        //     VOLUME = Math.min(1, VOLUME + 0.1);
        // }

        if (game.RELOAD === 1) {
            SOUND_MUSIC.pause();
            SOUND_MUSIC.play();

            game = new Game();
            game.initialGeneration();
            game.generate();
            game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
        }

        // Рубрика эээкспериментыыы
        // console.log(Vec2.counter);
        Vec2.counter = 0
    }

    var interval = setInterval(step, DT * 1000);
})
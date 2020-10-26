
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



    function step() {
        window.game = game; // For checking from console

        game.step();
        draw.draw(game);

        if (KEY_MINUS) {
            VOLUME = Math.max(0, VOLUME - 0.1);
        }
        if (KEY_PLUS) {
            VOLUME = Math.min(1, VOLUME + 0.1);
        }

        // Previous keys
        KEY_W_PREV = KEY_W;
        KEY_A_PREV = KEY_A;
        KEY_S_PREV = KEY_S;
        KEY_D_PREV = KEY_D;
        KEY_X_PREV = KEY_X;
        KEY_F_PREV = KEY_F;
        KEY_1_PREV = KEY_1;
        KEY_2_PREV = KEY_2;
        KEY_UP_PREV = KEY_UP;
        KEY_DOWN_PREV = KEY_DOWN;
        KEY_LEFT_PREV = KEY_LEFT;
        KEY_RIGHT_PREV = KEY_RIGHT;

        if (game.RELOAD === 1) {
            SOUND_MUSIC.pause();
            SOUND_MUSIC.play();

            game = new Game();
            game.initialGeneration();
            game.generate();
            game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
        }
    }

    var interval = setInterval(step, DT * 1000);
})
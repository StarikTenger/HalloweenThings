var game = new Game();
var draw = new Draw(CTX);

game.initialGeneration();
game.generate();
game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
game.player.status = 4;

var myAudio = new Audio('music/main_theme.mp3'); 
myAudio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);
myAudio.play();

function step() {
    myAudio.volume = VOLUME;
    myAudio.play();
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

    if (game.RELOAD == 1) {
        game = new Game();
        game.initialGeneration();
        game.generate();
        game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
    }
}

var interval = setInterval(step, DT * 1000);
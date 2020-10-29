'use strict'
const Howl = require('howler').Howl;

//// CONSTANTS ////
// Directions
window.NONE = 0
window.RIGHT = 3;
window.DOWN = 2;
window.LEFT = 4;
window.UP = 1;

// Subjects' types
window.SBJ_HEAL = 1;
window.SBJ_OIL = 2;
window.SBJ_WHISKEY = 3;
window.SBJ_MATCHBOX = 4;
window.SBJ_AMMO = 5;

// Monsters' names






//// GAME PREFERENCES ////
window.DT = 0.050; // Tick time in seconds
window.CELL_SIZE = 8;
window.TEXTURE_SIZE = 8;

window.EPS = 0.0001;

// Limitations for player
window.LIMIT_HP = 3;
window.LIMIT_OIL = 10;
window.LIMIT_MIND = 10;
window.LIMIT_MATCHES = 3;

window.OIL_CONSUMPTION = 0.2;
window.DIST_LIGHT = 7;
window.DIST_LOAD = 12;

window.MONSTER_LIMIT = 16; // Maximum number of monsters
window.MONSTER_PERIOD = 1; // Time between monsters spawn

window.SUBJECT_LIMIT = 10; // Maximum number of subjects
window.SUBJECT_PERIOD = 1; // Time between subjects spawn

// Map parameters
window.MARGIN = 3; // Cells on map's sides, that are not changing
window.SIZE_X = 27 + MARGIN * 2;
window.SIZE_Y = 27 + MARGIN * 2;

// Music
window.VOLUME = 1;

// Sounds
// Loop
window.SOUND_MUSIC = new Howl({
    src: ['music/main_theme.mp3'],
    loop: true
});
window.SOUND_STEPS = new Howl({
    src: ['sounds/steps.wav'],
    loop: true});
// Single
window.SOUND_SHOOT = new Howl({src: ['sounds/shoot.wav'],});
window.SOUND_MATCH = new Howl({src: ['sounds/match.wav'],});
window.SOUND_PICKUP = new Howl({src: ['sounds/pickup.wav'],});
window.SOUND_DRINK = new Howl({src: ['sounds/drink.wav'],});
window.SOUND_OIL = new Howl({src: ['sounds/oil.wav'],});
window.SOUND_MATCHBOX = new Howl({src: ['sounds/match_item.wav'],});
window.SOUND_AMMO = new Howl({src: ['sounds/ammo.wav'],});
window.SOUND_DEATH = new Howl({src: ['sounds/death.wav'],});

// Generation
window.SPEC_GRAVE_RADIUS = 10;
window.HARDNESS = 0;

// consts
window.LIFE_ETERNAL = -12222;


//// DRAW PREFERENCES ////
window.SCALE = 10; // 1 Cell in px
while (64 * SCALE <= Math.min(window.innerHeight, window.innerWidth)) {
    SCALE += 1;
}
SCALE = 7;

// Canvas
window.SCREEN = document.getElementById("screen");
SCREEN.width = SCREEN.height = 128 * SCALE;
window.CTX = SCREEN.getContext("2d");

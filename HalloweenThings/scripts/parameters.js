'use strict'
const {Howl, Howler} = require('howler');

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

window.MNS_ZOMBIE = 1;
window.MNS_GHOST = 2;
window.MNS_TENTACLE = 3;

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

window.MONSTER_LIMIT = 4; // Maximum number of monsters
window.MONSTER_PERIOD = 7; // Time between monsters spawn

window.SUBJECT_LIMIT = 5.5; // Maximum number of subjects
window.SUBJECT_PERIOD = 1.65; // Time between subjects spawn

// Map parameters
window.MARGIN = 3; // Cells on map's sides, that are not changing
window.SIZE_X = 20 + MARGIN * 2;
window.SIZE_Y = 20 + MARGIN * 2;

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

// Images
function getImg(src) { // Load images
    let img = new Image();
    img.src = src;
    return img;
}

// Loading current imgs
window.IMGS_GROUND = [
    getImg("textures/grounds/ground1.png"),
    getImg("textures/grounds/ground2.png")
];

window.IMGS_COVERING = [
    getImg("textures/coverings/covering1.png"),
    getImg("textures/coverings/covering2.png"),
    getImg("textures/coverings/covering3.png"),
    getImg("textures/coverings/covering4.png"),
    getImg("textures/coverings/covering5.png"),
    getImg("textures/coverings/covering6.png"),
    getImg("textures/coverings/covering7.png"),
    getImg("textures/coverings/covering8.png")
];

window.IMGS_SPEC_GRAVE = [
    getImg("textures/spec_graves/spec_grave1.png"),
    getImg("textures/spec_graves/spec_grave2.png"),
    getImg("textures/spec_graves/spec_grave3.png")
];

window.IMGS_SPEC_MINI_GRAVE = [
    getImg("textures/spec_graves/spec_mini_grave1.png"),
    getImg("textures/spec_graves/spec_mini_grave2.png"),
    getImg("textures/spec_graves/spec_mini_grave3.png")
];

window.IMGS_GRAVE = [
    getImg("textures/graves/grave1.png"),
    getImg("textures/graves/grave2.png"),
    getImg("textures/graves/grave3.png"),
    getImg("textures/graves/grave4.png"),
    getImg("textures/graves/grave5.png"),
    getImg("textures/graves/grave6.png"),
    getImg("textures/graves/grave7.png"),
    getImg("textures/graves/grave8.png"),
    getImg("textures/graves/grave9.png"),
    getImg("textures/graves/grave10.png"),
    getImg("textures/graves/grave11.png"),
];

window.IMGS_GATES = [
    getImg("textures/gates1.png"),
    getImg("textures/gates2.png")
];

window.IMGS_MONSTER = [
    getImg("textures/monsters/monster1.png"),
    getImg("textures/monsters/monster2.png"),
    getImg("textures/monsters/monster3.png")
];

window.IMGS_SUBJECT = [
    getImg("textures/subjects/heal.png"),
    getImg("textures/subjects/oil.png"),
    getImg("textures/subjects/whiskey.png"),
    getImg("textures/subjects/matchbox.png"),
    getImg("textures/subjects/ammo.png")
];

// Player animation
window.ANM_PLAYER_STANDING = [
    getImg("textures/player/player_standing_0.png"),
    getImg("textures/player/player_standing_1.png")
];

window.ANM_PLAYER_MOVING_RIGHT = [
    getImg("textures/player/player_moving_right_0.png"),
    getImg("textures/player/player_moving_right_1.png")
];

window.ANM_PLAYER_MOVING_UP = [
    getImg("textures/player/player_moving_up_0.png"),
    getImg("textures/player/player_moving_up_1.png")
];

window.ANM_PLAYER_MOVING_DOWN = [
    getImg("textures/player/player_moving_down_0.png"),
    getImg("textures/player/player_moving_down_1.png")
];

// MONSTERS

window.ANM_ZOMBIE_STANDING = [
    getImg("textures/monsters/zombie_standing_0.png"),
    getImg("textures/monsters/zombie_standing_1.png")
];

window.ANM_ZOMBIE_MOVING_UP = [
    getImg("textures/monsters/zombie_moving_up_0.png"),
    getImg("textures/monsters/zombie_moving_up_1.png")
];

window.ANM_ZOMBIE_MOVING_DOWN = [
    getImg("textures/monsters/zombie_moving_down_0.png"),
    getImg("textures/monsters/zombie_moving_down_1.png")
];

window.ANM_ZOMBIE_MOVING_RIGHT = [
    getImg("textures/monsters/zombie_moving_right_0.png"),
    getImg("textures/monsters/zombie_moving_right_1.png")
];

// GATES
window.ANM_GATES = [
    getImg("textures/particles/gates/gates0.png"),
    getImg("textures/particles/gates/gates1.png"),
    getImg("textures/particles/gates/gates2.png"),
    getImg("textures/particles/gates/gates3.png")
];

window.ANM_GHOST_STANDING = [
    getImg("textures/monsters/ghost_standing_0.png"),
    getImg("textures/monsters/ghost_standing_1.png")
];

window.ANM_GHOST_MOVING_UP = [
    getImg("textures/monsters/ghost_moving_up_0.png"),
    getImg("textures/monsters/ghost_moving_up_1.png"),
    getImg("textures/monsters/ghost_moving_up_2.png"),
    getImg("textures/monsters/ghost_moving_up_3.png")

];

window.ANM_GHOST_MOVING_DOWN = [
    getImg("textures/monsters/ghost_moving_down_0.png"),
    getImg("textures/monsters/ghost_moving_down_1.png"),
    getImg("textures/monsters/ghost_moving_down_2.png"),
    getImg("textures/monsters/ghost_moving_down_3.png")
];

window.ANM_GHOST_MOVING_RIGHT = [
    getImg("textures/monsters/ghost_moving_right_0.png"),
    getImg("textures/monsters/ghost_moving_right_1.png"),
    getImg("textures/monsters/ghost_moving_right_2.png"),
    getImg("textures/monsters/ghost_moving_right_3.png"),
];

window.ANM_WORM_STANDING = [
    getImg("textures/monsters/worm_standing_0.png"),
    getImg("textures/monsters/worm_standing_1.png"),
    getImg("textures/monsters/worm_standing_2.png"),
    getImg("textures/monsters/worm_standing_3.png")
]

// ===================

window.IMG_MONSTER0 = getImg("textures/monsters/zombie_standing_0.png");
window.IMG_SHADOW = getImg("textures/shadow.png");
window.IMG_INTERFACE = getImg("textures/interface/interface.png");
window.IMG_INTERFACE_OVERLAY = getImg("textures/interface/interfaceOverlay.png");
window.IMG_MATCH = getImg("textures/interface/match.png");
window.IMG_MENTAL_DANGER = getImg("textures/interface/mental_danger.png");

// Endgame screens
window.IMG_DEAD = getImg("textures/interface/deathscreen.png");
window.IMG_DELIRIOUS = getImg("textures/interface/deliriumscreen.png");
window.IMG_WIN = getImg("textures/interface/winscreen.png");
window.IMG_START_SCREEN = getImg("textures/interface/startscreen.png");

// Sprite animations
window.ANM_BLOOD = [
    getImg("textures/particles/blood/blood0.png"),
    getImg("textures/particles/blood/blood1.png"),
    getImg("textures/particles/blood/blood2.png")
];

window.ANM_IGNITION_RED = [
    getImg("textures/particles/ignition/ignition_red_0.png"),
    getImg("textures/particles/ignition/ignition_red_1.png"),
    getImg("textures/particles/ignition/ignition_red_2.png"),
    getImg("textures/particles/ignition/ignition_red_3.png"),
    getImg("textures/particles/ignition/ignition_red_4.png"),
    getImg("textures/particles/ignition/ignition_red_5.png"),
];

window.ANM_IGNITION_GREEN = [
    getImg("textures/particles/ignition/ignition_green_0.png"),
    getImg("textures/particles/ignition/ignition_green_1.png"),
    getImg("textures/particles/ignition/ignition_green_2.png"),
    getImg("textures/particles/ignition/ignition_green_3.png"),
    getImg("textures/particles/ignition/ignition_green_4.png"),
    getImg("textures/particles/ignition/ignition_green_5.png"),
];

window.ANM_IGNITION_BLUE = [
    getImg("textures/particles/ignition/ignition_blue_0.png"),
    getImg("textures/particles/ignition/ignition_blue_1.png"),
    getImg("textures/particles/ignition/ignition_blue_2.png"),
    getImg("textures/particles/ignition/ignition_blue_3.png"),
    getImg("textures/particles/ignition/ignition_blue_4.png"),
    getImg("textures/particles/ignition/ignition_blue_5.png"),
];

window.ANM_IGNITION = [ANM_IGNITION_RED, ANM_IGNITION_GREEN, ANM_IGNITION_BLUE];

window.ANM_MATCH = [
    getImg("textures/particles/match/match0.png"),
    getImg("textures/particles/match/match1.png"),
    getImg("textures/particles/match/match2.png")
];

window.ANM_MATCH_BURNING = [
    getImg("textures/particles/match_burn/match_burn_0.png"),
    getImg("textures/particles/match_burn/match_burn_1.png"),
    getImg("textures/particles/match_burn/match_burn_2.png"),
    getImg("textures/particles/match_burn/match_burn_3.png"),
    getImg("textures/particles/match_burn/match_burn_4.png")
];

window.ANM_ACTIVE_GRAVE = [
    getImg("textures/particles/active_grave/active_grave_0.png"),
    getImg("textures/particles/active_grave/active_grave_1.png"),
    getImg("textures/particles/active_grave/active_grave_2.png"),
    getImg("textures/particles/active_grave/active_grave_3.png"),
    getImg("textures/particles/active_grave/active_grave_4.png")
];

window.ANM_PISTOL_SHOT = [
    getImg("textures/interface/pistol_shot/pistol_0.png"),
    getImg("textures/interface/pistol_shot/pistol_1.png"),
    getImg("textures/interface/pistol_shot/pistol_2.png"),
    getImg("textures/interface/pistol_shot/pistol_3.png"),
    getImg("textures/interface/pistol_shot/pistol_4.png")
];

window.ANM_TRACER_LEFT = [
    getImg("textures/particles/tracer/tracer_left.png")
];
window.ANM_TRACER_RIGHT = [
    getImg("textures/particles/tracer/tracer_right.png")
];
window.ANM_TRACER_UP = [
    getImg("textures/particles/tracer/tracer_up.png")
];
window.ANM_TRACER_DOWN = [
    getImg("textures/particles/tracer/tracer_down.png")
];

// Damage animation
window.ANM_DAMAGE = [
    getImg("textures/particles/damage/damage0.png"),
    getImg("textures/particles/damage/damage1.png"),
    getImg("textures/particles/damage/damage2.png"),
    getImg("textures/particles/damage/damage3.png")
];

//// KEY CONFIG ////
// Keys (0 - released, 1 - pressed)
window.KEY_W = 0; window.KEY_W_PREV = 0;
window.KEY_A = 0; window.KEY_A_PREV = 0;
window.KEY_S = 0; window.KEY_S_PREV = 0;
window.KEY_D = 0; window.KEY_D_PREV = 0;
window.KEY_X = 0; window.KEY_X_PREV = 0;
window.KEY_F = 0; window.KEY_F_PREV = 0;
window.KEY_1 = 0; window.KEY_1_PREV = 0;
window.KEY_2 = 0; window.KEY_2_PREV = 0;
window.KEY_UP = 0; window.KEY_UP_PREV = 0;
window.KEY_DOWN = 0; window.KEY_DOWN_PREV = 0;
window.KEY_LEFT = 0; window.KEY_LEFT_PREV = 0;
window.KEY_RIGHT = 0; window.KEY_RIGHT_PREV = 0;
window.KEY_ENTER = 0; window.KEY_ENTER_PREV = 0;
window.KEY_PLUS = 0; window.KEY_PLUS_PREV = 0;
window.KEY_MINUS = 0; window.KEY_MINUS_PREV = 0;

function checkKey(e, t) {
    if(e.keyCode == 87)
        KEY_W = t;	
    if(e.keyCode == 65)
        KEY_A = t;  
    if(e.keyCode == 83)
        KEY_S = t;
    if(e.keyCode == 68)
        KEY_D = t;
    if(e.keyCode == 88)
        KEY_X = t;
    if(e.keyCode == 70)
        KEY_F = t;
    if(e.keyCode == 49)
        KEY_1 = t;
    if(e.keyCode == 50)
        KEY_2 = t;
    if(e.keyCode == 37)
        KEY_LEFT = t;
    if(e.keyCode == 38)
        KEY_UP = t;
    if(e.keyCode == 39)
        KEY_RIGHT = t;
    if(e.keyCode == 40)
        KEY_DOWN = t;
    if (e.keyCode == 13)
        KEY_ENTER = t;
    if (e.keyCode == 189)
        KEY_MINUS = t;
    if (e.keyCode == 187)
        KEY_PLUS = t;
    
}

window.addEventListener('keydown', checkDown,false);
function checkDown(e) {
   
    // Checking for buttons pressed
    checkKey(e, 1);
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
    }
}

window.addEventListener('keyup', checkUp,false);
function checkUp(e) {
   
    // Checking for buttons pressed
    checkKey(e, 0);
}
'use strict'

//// CONSTANTS ////
// Directions
let NONE = 0
let RIGHT = 3;
let DOWN = 2;
let LEFT = 4;
let UP = 1;

// Subjects' types
let SBJ_HEAL = 1;
let SBJ_OIL = 2;
let SBJ_WHISKEY = 3;
let SBJ_MATCHBOX = 4;
let SBJ_AMMO = 5;

// Monsters' names

let MNS_ZOMBIE = 1;
let MNS_GHOST = 2;
let MNS_TENTACLE = 3;

//// GAME PREFERENCES ////
let DT = 0.050; // Tick time in seconds
let CELL_SIZE = 8;
let TEXTURE_SIZE = 8;

let EPS = 0.0001;

// Limitations for player
let LIMIT_HP = 3;
let LIMIT_OIL = 10;
let LIMIT_MIND = 10;
let LIMIT_MATCHES = 3;

let OIL_CONSUMPTION = 0.2;
let DIST_LIGHT = 7;
let DIST_LOAD = 12;

let MONSTER_LIMIT = 4; // Maximum number of monsters
let MONSTER_PERIOD = 7; // Time between monsters spawn

let SUBJECT_LIMIT = 5.5; // Maximum number of subjects
let SUBJECT_PERIOD = 1.65; // Time between subjects spawn

// Map parameters
let MARGIN = 3; // Cells on map's sides, that are not changing
let SIZE_X = 20 + MARGIN * 2;
let SIZE_Y = 20 + MARGIN * 2;

// Music
let VOLUME = 1;

// Generation
let SPEC_GRAVE_RADIUS = 10;
let HARDNESS = 0;

// consts
let LIFE_ETERNAL = -12222;


//// DRAW PREFERENCES ////
let SCALE = 10; // 1 Cell in px
while (64 * SCALE <= Math.min(window.innerHeight, window.innerWidth)) {
    SCALE += 1;
}
SCALE = 7;

// Canvas
let SCREEN = document.getElementById("screen");
SCREEN.width = SCREEN.height = 128 * SCALE;
let CTX = SCREEN.getContext("2d");

// Images
function getImg(src) { // Load images
    let img = new Image(); 
    img.src = src;
    return img;
}

// Loading current imgs
let IMGS_GROUND = [
    getImg("textures/grounds/ground1.png"),
    getImg("textures/grounds/ground2.png")
];

let IMGS_COVERING = [
    getImg("textures/coverings/covering1.png"),
    getImg("textures/coverings/covering2.png"),
    getImg("textures/coverings/covering3.png"),
    getImg("textures/coverings/covering4.png"),
    getImg("textures/coverings/covering5.png"),
    getImg("textures/coverings/covering6.png"),
    getImg("textures/coverings/covering7.png"),
    getImg("textures/coverings/covering8.png")
];

let IMGS_SPEC_GRAVE = [
    getImg("textures/spec_graves/spec_grave1.png"),
    getImg("textures/spec_graves/spec_grave2.png"),
    getImg("textures/spec_graves/spec_grave3.png")
];

let IMGS_SPEC_MINI_GRAVE = [
    getImg("textures/spec_graves/spec_mini_grave1.png"),
    getImg("textures/spec_graves/spec_mini_grave2.png"),
    getImg("textures/spec_graves/spec_mini_grave3.png")
];

let IMGS_GRAVE = [
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

let IMGS_GATES = [
    getImg("textures/gates1.png"),
    getImg("textures/gates2.png")
];

let IMGS_MONSTER = [
    getImg("textures/monsters/monster1.png"),
    getImg("textures/monsters/monster2.png"),
    getImg("textures/monsters/monster3.png")
];

let IMGS_SUBJECT = [
    getImg("textures/subjects/heal.png"),
    getImg("textures/subjects/oil.png"),
    getImg("textures/subjects/whiskey.png"),
    getImg("textures/subjects/matchbox.png"),
    getImg("textures/subjects/ammo.png")
];

// Player animation
let ANM_PLAYER_STANDING = [
    getImg("textures/player/player_standing_0.png"),
    getImg("textures/player/player_standing_1.png")
];

let ANM_PLAYER_MOVING_RIGHT = [
    getImg("textures/player/player_moving_right_0.png"),
    getImg("textures/player/player_moving_right_1.png")
];

let ANM_PLAYER_MOVING_UP = [
    getImg("textures/player/player_moving_up_0.png"),
    getImg("textures/player/player_moving_up_1.png")
];

let ANM_PLAYER_MOVING_DOWN = [
    getImg("textures/player/player_moving_down_0.png"),
    getImg("textures/player/player_moving_down_1.png")
];

// MONSTERS

let ANM_ZOMBIE_STANDING = [
    getImg("textures/monsters/zombie_standing_0.png"),
    getImg("textures/monsters/zombie_standing_1.png")
];

let ANM_ZOMBIE_MOVING_UP = [
    getImg("textures/monsters/zombie_moving_up_0.png"),
    getImg("textures/monsters/zombie_moving_up_1.png")
];

let ANM_ZOMBIE_MOVING_DOWN = [
    getImg("textures/monsters/zombie_moving_down_0.png"),
    getImg("textures/monsters/zombie_moving_down_1.png")
];

let ANM_ZOMBIE_MOVING_RIGHT = [
    getImg("textures/monsters/zombie_moving_right_0.png"),
    getImg("textures/monsters/zombie_moving_right_1.png")
];

// GATES
let ANM_GATES = [
    getImg("textures/particles/gates/gates0.png"),
    getImg("textures/particles/gates/gates1.png"),
    getImg("textures/particles/gates/gates2.png"),
    getImg("textures/particles/gates/gates3.png")
];

let ANM_GHOST_STANDING = [
    getImg("textures/monsters/ghost_standing_0.png"),
    getImg("textures/monsters/ghost_standing_1.png")
];

let ANM_GHOST_MOVING_UP = [
    getImg("textures/monsters/ghost_moving_up_0.png"),
    getImg("textures/monsters/ghost_moving_up_1.png"),
    getImg("textures/monsters/ghost_moving_up_2.png"),
    getImg("textures/monsters/ghost_moving_up_3.png")

];

let ANM_GHOST_MOVING_DOWN = [
    getImg("textures/monsters/ghost_moving_down_0.png"),
    getImg("textures/monsters/ghost_moving_down_1.png"),
    getImg("textures/monsters/ghost_moving_down_2.png"),
    getImg("textures/monsters/ghost_moving_down_3.png")
];

let ANM_GHOST_MOVING_RIGHT = [
    getImg("textures/monsters/ghost_moving_right_0.png"),
    getImg("textures/monsters/ghost_moving_right_1.png"),
    getImg("textures/monsters/ghost_moving_right_2.png"),
    getImg("textures/monsters/ghost_moving_right_3.png"),
];

let ANM_WORM_STANDING = [
    getImg("textures/monsters/worm_standing_0.png"),
    getImg("textures/monsters/worm_standing_1.png"),
    getImg("textures/monsters/worm_standing_2.png"),
    getImg("textures/monsters/worm_standing_3.png")
]

// ===================

let IMG_MONSTER0 = getImg("textures/monsters/zombie_standing_0.png");
let IMG_SHADOW = getImg("textures/shadow.png");
let IMG_INTERFACE = getImg("textures/interface/interface.png");
let IMG_INTERFACE_OVERLAY = getImg("textures/interface/interfaceOverlay.png");
let IMG_MATCH = getImg("textures/interface/match.png");
let IMG_MENTAL_DANGER = getImg("textures/interface/mental_danger.png");

// Endgame screens
let IMG_DEAD = getImg("textures/interface/deathscreen.png");
let IMG_DELIRIOUS = getImg("textures/interface/deliriumscreen.png");
let IMG_WIN = getImg("textures/interface/winscreen.png");
let IMG_START_SCREEN = getImg("textures/interface/startscreen.png");

// Sprite animations
let ANM_BLOOD = [
    getImg("textures/particles/blood/blood0.png"),
    getImg("textures/particles/blood/blood1.png"),
    getImg("textures/particles/blood/blood2.png")
];

let ANM_IGNITION_RED = [
    getImg("textures/particles/ignition/ignition_red_0.png"),
    getImg("textures/particles/ignition/ignition_red_1.png"),
    getImg("textures/particles/ignition/ignition_red_2.png"),
    getImg("textures/particles/ignition/ignition_red_3.png"),
    getImg("textures/particles/ignition/ignition_red_4.png"),
    getImg("textures/particles/ignition/ignition_red_5.png"),
];

let ANM_IGNITION_GREEN = [
    getImg("textures/particles/ignition/ignition_green_0.png"),
    getImg("textures/particles/ignition/ignition_green_1.png"),
    getImg("textures/particles/ignition/ignition_green_2.png"),
    getImg("textures/particles/ignition/ignition_green_3.png"),
    getImg("textures/particles/ignition/ignition_green_4.png"),
    getImg("textures/particles/ignition/ignition_green_5.png"),
];

let ANM_IGNITION_BLUE = [
    getImg("textures/particles/ignition/ignition_blue_0.png"),
    getImg("textures/particles/ignition/ignition_blue_1.png"),
    getImg("textures/particles/ignition/ignition_blue_2.png"),
    getImg("textures/particles/ignition/ignition_blue_3.png"),
    getImg("textures/particles/ignition/ignition_blue_4.png"),
    getImg("textures/particles/ignition/ignition_blue_5.png"),
];

let ANM_IGNITION = [ANM_IGNITION_RED, ANM_IGNITION_GREEN, ANM_IGNITION_BLUE];

let ANM_MATCH = [
    getImg("textures/particles/match/match0.png"),
    getImg("textures/particles/match/match1.png"),
    getImg("textures/particles/match/match2.png")
];

let ANM_MATCH_BURNING = [
    getImg("textures/particles/match_burn/match_burn_0.png"),
    getImg("textures/particles/match_burn/match_burn_1.png"),
    getImg("textures/particles/match_burn/match_burn_2.png"),
    getImg("textures/particles/match_burn/match_burn_3.png"),
    getImg("textures/particles/match_burn/match_burn_4.png")
];

let ANM_ACTIVE_GRAVE = [
    getImg("textures/particles/active_grave/active_grave_0.png"),
    getImg("textures/particles/active_grave/active_grave_1.png"),
    getImg("textures/particles/active_grave/active_grave_2.png"),
    getImg("textures/particles/active_grave/active_grave_3.png"),
    getImg("textures/particles/active_grave/active_grave_4.png")
];

let ANM_PISTOL_SHOT = [
    getImg("textures/interface/pistol_shot/pistol_0.png"),
    getImg("textures/interface/pistol_shot/pistol_1.png"),
    getImg("textures/interface/pistol_shot/pistol_2.png"),
    getImg("textures/interface/pistol_shot/pistol_3.png"),
    getImg("textures/interface/pistol_shot/pistol_4.png")
];

let ANM_TRACER_LEFT = [
    getImg("textures/particles/tracer/tracer_left.png")
];
let ANM_TRACER_RIGHT = [
    getImg("textures/particles/tracer/tracer_right.png")
];
let ANM_TRACER_UP = [
    getImg("textures/particles/tracer/tracer_up.png")
];
let ANM_TRACER_DOWN = [
    getImg("textures/particles/tracer/tracer_down.png")
];

// Damage animation
let ANM_DAMAGE = [
    getImg("textures/particles/damage/damage0.png"),
    getImg("textures/particles/damage/damage1.png"),
    getImg("textures/particles/damage/damage2.png"),
    getImg("textures/particles/damage/damage3.png")
];

//// KEY CONFIG ////
// Keys (0 - released, 1 - pressed)
let KEY_W = 0; let KEY_W_PREV = 0; 
let KEY_A = 0; let KEY_A_PREV = 0; 
let KEY_S = 0; let KEY_S_PREV = 0; 
let KEY_D = 0; let KEY_D_PREV = 0;
let KEY_X = 0; let KEY_X_PREV = 0;
let KEY_F = 0; let KEY_F_PREV = 0; 
let KEY_1 = 0; let KEY_1_PREV = 0;
let KEY_2 = 0; let KEY_2_PREV = 0;
let KEY_UP = 0; let KEY_UP_PREV = 0; 
let KEY_DOWN = 0; let KEY_DOWN_PREV = 0; 
let KEY_LEFT = 0; let KEY_LEFT_PREV = 0; 
let KEY_RIGHT = 0; let KEY_RIGHT_PREV = 0; 
let KEY_ENTER = 0; let KEY_ENTER_PREV = 0;
let KEY_PLUS = 0; let KEY_PLUS_PREV = 0;
let KEY_MINUS = 0; let KEY_MINUS_PREV = 0;

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

window.addEventListener('keydown',this.checkDown,false);
function checkDown(e) {
   
    // Checking for buttons pressed
    checkKey(e, 1);
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
    }
}

window.addEventListener('keyup',this.checkUp,false);
function checkUp(e) {
   
    // Checking for buttons pressed
    checkKey(e, 0);
}
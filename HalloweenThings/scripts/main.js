
const Parameters = require("./parameters")
const Game = require("./game.js")
const Draw = require("./draw.js")
const Texture = require("./texture.js")
const Vec2 = require("./vec2.js")


window.addEventListener("load", async function() {

    try {
        await Texture.download()
    } catch(exception) {
        console.error(exception)
        return;
    }
    
    // Скопировал сюда чтобы мозолило глаза
    // Ну и потому что Texture.named нельзя вызывать перед
    // загрузкой текстур

    // Loading current imgs
    window.IMGS_GROUND = [
        Texture.named("grounds/ground1"),
        Texture.named("grounds/ground2"),
        Texture.named("grounds/ground3"),
    ];

    window.ROOM_IMGS_GROUND = [
        Texture.named("grounds/room_ground_1"),
        Texture.named("grounds/room_ground_2")
    ];

    window.IMGS_COVERING = [
        Texture.named("coverings/covering1"),
        Texture.named("coverings/covering2"),
        Texture.named("coverings/covering3"),
        Texture.named("coverings/covering4"),
        Texture.named("coverings/covering5"),
        Texture.named("coverings/covering6"),
        Texture.named("coverings/covering7"),
        Texture.named("coverings/covering8")
    ];

    window.IMGS_SPEC_GRAVE = [
        Texture.named("spec_graves/spec_grave1"),
        Texture.named("spec_graves/spec_grave2"),
        Texture.named("spec_graves/spec_grave3")
    ];

    window.IMGS_SPEC_MINI_GRAVE = [
        Texture.named("spec_graves/spec_mini_grave1"),
        Texture.named("spec_graves/spec_mini_grave2"),
        Texture.named("spec_graves/spec_mini_grave3")
    ];

    // [vertical, left, right]
    window.IMGS_GRAVE = [
        [Texture.named("graves/grave2_s"), Texture.named("graves/grave2_l"), Texture.named("graves/grave2_r")],
        [Texture.named("graves/grave2_s"), Texture.named("graves/grave2_l"), Texture.named("graves/grave2_r")],
        [Texture.named("graves/grave2_s"), Texture.named("graves/grave2_l"), Texture.named("graves/grave2_r")],
        [Texture.named("graves/grave2_s"), Texture.named("graves/grave2_l"), Texture.named("graves/grave2_r")],
        [Texture.named("graves/grave2_s"), Texture.named("graves/grave2_l"), Texture.named("graves/grave2_r")]
    ];

    window.COLUMN_WIDTH = 4;
    window.COLUMN_HEIGHT = 6;
    window.IMGS_WALL = [
        [
            Texture.named("walls/wall"),
            Texture.named("walls/wall_top"),
            Texture.named("walls/wall"),
            Texture.named("walls/wall_top")
        ],
        [
            Texture.named("walls/column"),
            Texture.named("walls/column_top"),
            Texture.named("walls/wall"),
            Texture.named("walls/wall_top")
        ]
    ];

    window.IMGS_GATES = [
        Texture.named("gates1"),
        Texture.named("gates2")
    ];

    window.IMGS_MONSTER = [
        Texture.named("monsters/monster1"),
        Texture.named("monsters/monster2"),
        Texture.named("monsters/monster3"),
        Texture.named("monsters/monster2")
    ];

    window.IMGS_SUBJECT = [
        Texture.named("subjects/heal"),
        Texture.named("subjects/oil"),
        Texture.named("subjects/whiskey"),
        Texture.named("subjects/matchbox"),
        Texture.named("subjects/ammo")
    ];

    // Player animation
    window.ANM_PLAYER_STANDING = [
        Texture.named("player/player_standing_0"),
        Texture.named("player/player_standing_1")
    ];

    window.ANM_PLAYER_MOVING_RIGHT = [
        Texture.named("player/player_moving_right_0"),
        Texture.named("player/player_moving_right_1")
    ];

    window.ANM_PLAYER_MOVING_UP = [
        Texture.named("player/player_moving_up_0"),
        Texture.named("player/player_moving_up_1")
    ];

    window.ANM_PLAYER_MOVING_DOWN = [
        Texture.named("player/player_moving_down_0"),
        Texture.named("player/player_moving_down_1")
    ];

    //// MONSTERS ////

    // Zombie
    window.ANM_ZOMBIE_STANDING = [
        Texture.named("monsters/zombie_standing_0"),
        Texture.named("monsters/zombie_standing_1")
    ];

    window.ANM_ZOMBIE_MOVING_UP = [
        Texture.named("monsters/zombie_moving_up_0"),
        Texture.named("monsters/zombie_moving_up_1")
    ];

    window.ANM_ZOMBIE_MOVING_DOWN = [
        Texture.named("monsters/zombie_moving_down_0"),
        Texture.named("monsters/zombie_moving_down_1")
    ];

    window.ANM_ZOMBIE_MOVING_RIGHT = [
        Texture.named("monsters/zombie_moving_right_0"),
        Texture.named("monsters/zombie_moving_right_1")
    ];

    // Ghost
    window.ANM_GHOST_STANDING = [
        Texture.named("monsters/ghost_standing_0"),
        Texture.named("monsters/ghost_standing_1")
    ];

    window.ANM_GHOST_MOVING_UP = [
        Texture.named("monsters/ghost_moving_up_0"),
        Texture.named("monsters/ghost_moving_up_1"),
        Texture.named("monsters/ghost_moving_up_2"),
        Texture.named("monsters/ghost_moving_up_3")

    ];

    window.ANM_GHOST_MOVING_DOWN = [
        Texture.named("monsters/ghost_moving_down_0"),
        Texture.named("monsters/ghost_moving_down_1"),
        Texture.named("monsters/ghost_moving_down_2"),
        Texture.named("monsters/ghost_moving_down_3")
    ];

    window.ANM_GHOST_MOVING_RIGHT = [
        Texture.named("monsters/ghost_moving_right_0"),
        Texture.named("monsters/ghost_moving_right_1"),
        Texture.named("monsters/ghost_moving_right_2"),
        Texture.named("monsters/ghost_moving_right_3"),
    ];

    // Worm
    window.ANM_WORM_STANDING = [
        Texture.named("monsters/worm_standing_0"),
        Texture.named("monsters/worm_standing_1"),
        Texture.named("monsters/worm_standing_2"),
        Texture.named("monsters/worm_standing_3")
    ]

    // Spider
    window.ANM_SPIDER_MOVING = [
        Texture.named("monsters/spider_moving_0"),
        Texture.named("monsters/spider_moving_1"),
        Texture.named("monsters/spider_moving_2"),
    ];

    // Bat
    window.ANM_BAT_MOVING = [
        Texture.named("monsters/bat_moving_0"),
        Texture.named("monsters/bat_moving_1")
    ];

    // GATES
    window.ANM_GATES = [
        Texture.named("particles/gates/gates0"),
        Texture.named("particles/gates/gates1"),
        Texture.named("particles/gates/gates2"),
        Texture.named("particles/gates/gates3")
    ];

    // ===================

    window.IMG_MONSTER0 = Texture.named("monsters/zombie_standing_0");
    window.IMG_SHADOW = Texture.named("shadow");
    window.IMG_INTERFACE = Texture.named("interface/interface");
    window.IMG_INTERFACE_OVERLAY = Texture.named("interface/interfaceOverlay");
    window.IMG_MATCH = Texture.named("interface/match");
    window.IMG_MENTAL_DANGER = Texture.named("interface/mental_danger");

    // Endgame screens
    window.IMG_DEAD = Texture.named("interface/deathscreen");
    window.IMG_DELIRIOUS = Texture.named("interface/deliriumscreen");
    window.IMG_WIN = Texture.named("interface/winscreen");
    window.IMG_START_SCREEN = Texture.named("interface/startscreen");

    // Sprite animations
    window.ANM_BLOOD = [
        Texture.named("particles/blood/blood0"),
        Texture.named("particles/blood/blood1"),
        Texture.named("particles/blood/blood2")
    ];

    window.ANM_IGNITION_RED = [
        Texture.named("particles/ignition/ignition_red_0"),
        Texture.named("particles/ignition/ignition_red_1"),
        Texture.named("particles/ignition/ignition_red_2"),
        Texture.named("particles/ignition/ignition_red_3"),
        Texture.named("particles/ignition/ignition_red_4"),
        Texture.named("particles/ignition/ignition_red_5"),
    ];

    window.ANM_IGNITION_GREEN = [
        Texture.named("particles/ignition/ignition_green_0"),
        Texture.named("particles/ignition/ignition_green_1"),
        Texture.named("particles/ignition/ignition_green_2"),
        Texture.named("particles/ignition/ignition_green_3"),
        Texture.named("particles/ignition/ignition_green_4"),
        Texture.named("particles/ignition/ignition_green_5"),
    ];

    window.ANM_IGNITION_BLUE = [
        Texture.named("particles/ignition/ignition_blue_0"),
        Texture.named("particles/ignition/ignition_blue_1"),
        Texture.named("particles/ignition/ignition_blue_2"),
        Texture.named("particles/ignition/ignition_blue_3"),
        Texture.named("particles/ignition/ignition_blue_4"),
        Texture.named("particles/ignition/ignition_blue_5"),
    ];

    window.ANM_IGNITION = [ANM_IGNITION_RED, ANM_IGNITION_GREEN, ANM_IGNITION_BLUE];

    window.ANM_MATCH = [
        Texture.named("particles/match/match0"),
        Texture.named("particles/match/match1"),
        Texture.named("particles/match/match2")
    ];

    window.ANM_MATCH_BURNING = [
        Texture.named("particles/match_burn/match_burn_0"),
        Texture.named("particles/match_burn/match_burn_1"),
        Texture.named("particles/match_burn/match_burn_2"),
        Texture.named("particles/match_burn/match_burn_3"),
        Texture.named("particles/match_burn/match_burn_4")
    ];

    window.ANM_ACTIVE_GRAVE = [
        Texture.named("particles/active_grave/active_grave_0"),
        Texture.named("particles/active_grave/active_grave_1"),
        Texture.named("particles/active_grave/active_grave_2"),
        Texture.named("particles/active_grave/active_grave_3"),
        Texture.named("particles/active_grave/active_grave_4")
    ];

    window.ANM_PISTOL_SHOT = [
        Texture.named("interface/pistol_shot/pistol_0"),
        Texture.named("interface/pistol_shot/pistol_1"),
        Texture.named("interface/pistol_shot/pistol_2"),
        Texture.named("interface/pistol_shot/pistol_3"),
        Texture.named("interface/pistol_shot/pistol_4")
    ];

    window.ANM_TRACER_LEFT = [
        Texture.named("particles/tracer/tracer_left")
    ];
    window.ANM_TRACER_RIGHT = [
        Texture.named("particles/tracer/tracer_right")
    ];
    window.ANM_TRACER_UP = [
        Texture.named("particles/tracer/tracer_up")
    ];
    window.ANM_TRACER_DOWN = [
        Texture.named("particles/tracer/tracer_down")
    ];

    // Damage animation
    window.ANM_DAMAGE = [
        Texture.named("particles/damage/damage0"),
        Texture.named("particles/damage/damage1"),
        Texture.named("particles/damage/damage2"),
        Texture.named("particles/damage/damage3")
    ];

    window.Texture = Texture

    let game = new Game();
    let draw = new Draw(CTX);

    game.initialGeneration();
    game.generate();
    game.spawnPlayer(new Vec2(SIZE_X * 8 / 2, 10 + MARGIN * 8));
    game.player.status = 4;


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
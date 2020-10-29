const Animation = require("./animation")
const Anime = require("./anime")
const Cell = require("./cell")
const Deque = require("./deque")
const Entity = require("./entity/entity")
const LightSource = require("./light-source")
const Vec2 = require("./vec2")
const Subject = require("./subject")
const Random = require("./random")
const Maze = require("./maze")
const UserControls = require("./controls/user-controls")
const KeyboardController = require("./controls/keyboardcontroller")
const GamepadController = require("./controls/gamepad-controller")
const Player = require("./entity/player")

const Monster = require("./entity/monster")

/**
 * Main class that controls everything
 */

class Game {
    constructor() {
        // Filling grid
        this.grid = [];
        for (let x = 0; x < SIZE_X; x++) {
            this.grid.push([]);
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x].push(new Cell());
            }
        }

        // Setting player
        this.player = new Player({
            game: this
        });
        this.player.pos.set(10, 10);
        this.player.gridPos.set(0, 0);

        this.playerControls = new UserControls();
        this.keyboard = new KeyboardController();
        this.gamepad = new GamepadController();

        this.keyboard.startListening()
        this.gamepad.startListening()

        this.playerControls.setupKeyboard(this.keyboard)
        this.playerControls.setupGamepad(this.gamepad)

        this.playerControls.connectCharacterControls(this.player.controls)

        // Game progress
        this.spec_graves_visited = [0, 0, 0];
        this.spec_graves_visited_count = 0;
        this.gates_state = 0; // 1 - gates spawned, 2 - gates opened
        this.level = 0;

        // Spec graves cooldown
        this.specGraveCooldown = 5; // in sec
        this.specGraveTimer = this.specGraveCooldown;

        // Flickering
        this.flickeringCooldown = 0.1;
        this.flickeringTimer = this.flickeringCooldown;
        this.flickeringDelta = 0;
        this.flickeringMaxDelta = 0.5;
        this.flickeringD = 0.075;

        // Light
        this.spec_lights = [];
        this.temporalLightSources = [];

        // Monster array
        this.monsterTimer = 0;
        this.monsters = [];

        // Subjects array
        this.subjectTimer = 0;
        this.subjects = [];

        // Light sources array
        this.lightSources = [];

        this.animations = [];

        this.RELOAD = 0;

        this.mentalDanger = 0; // PLayer is taking mental damage
    }

    // Deals damage & makes sprite animation
    hurt(target, value) {
        if (target.protectionTimer === 0) {
            this.animations.push(new Animation(ANM_BLOOD, target.pos.plus(new Vec2(0, -8)), new Vec2(8, 8), 0.1));
            if (target instanceof Player) {
                this.animations.push(new Animation(ANM_DAMAGE, new Vec2(0, 0), new Vec2(64, 64), 0.3, 1));
            }
        }
        target.hurt(value);
    }

    // Checks is the cell is in bounds
    checkCell(pos) {
        return this.checkCellPosition(pos.x, pos.y)
    }

    checkCellPosition(x, y) {
        if (x < 0 || y < 0 || x >= SIZE_X || y >= SIZE_Y)
            return 1;
        return 0;
    }

    // Checks is the cell is in bounds and in margin
    checkMargin(pos) {
        if (pos.x < MARGIN || pos.y < MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN)
            return 1;
        return 0;
    }

    // In which cell is pos
    getCell(pos) {
        let cellPos = pos.div(new Vec2(8, 8));
        cellPos.x = Math.floor(cellPos.x);
        cellPos.y = Math.floor(cellPos.y);
        return cellPos;
    }

    // Gets visible light value for current cell
    getLight(pos) {
        return this.getLightPosition(pos.x, pos.y)
    }

    getLightPosition(x, y) {
        let val = 0;
        if (!this.checkCellPosition(x, y))
            val = Math.max(this.grid[x][y].light + DIST_LIGHT - DIST_LOAD, 0);
        return val;
    }

    // Choose random grave texture
    random_grave_type() {
        let graves_cnt = window.IMGS_WALL.length;
        return Random.normalRoll(1, graves_cnt, 10 - this.level * 3);
    }

    // Choose random ground texture
    random_ground_type() {
        return 1;
        let grounds_cnt = IMGS_GROUND.length;
        return Random.normalRoll(1, grounds_cnt, 3);
    }

    // Choose random ground covering texture
    //     random_covering_type() {
    //         let covering_cnt = IMGS_COVERING.length;
    //         return normalRoll(1, covering_cnt, 2);
    //     }

    // Choose random monster texture
    random_monster_type() {
        return 4;
        let monster_cnt = IMGS_MONSTER.length;
        return Random.normalRoll(1, monster_cnt, 1);
    }

    clever_covering_type() {
        return 0;

        // let roll = Random.random(1, 100);
        // let grass_cnt = 5;
        // let water_cnt = 2;
        // let blood_cnt = 1;
        // let sum = 0;
        //
        // if (roll < 90) { // Grass
        //     return Random.normalRoll(sum + 1, grass_cnt, 3);
        // } else {
        //     sum += grass_cnt;
        // }
        //
        // if (roll < 98) { // Water
        //     return Random.normalRoll(sum + 1, sum + water_cnt, 3);
        // } else {
        //     sum += water_cnt;
        // }
        //
        // if (roll < 100) {
        //     return Random.normalRoll(sum + 1, sum + blood_cnt, 3);
        // }
    }

    subject_type() {
        let type = Random.random(1, 100);
        if (type <= 10) {
            type = SBJ_HEAL;
        } else if (type <= 35) {
            type = SBJ_WHISKEY;
        } else if (type <= 60) {
            type = SBJ_OIL;
        } else if (type <= 80) {
            type = SBJ_MATCHBOX;
        } else {
            type = SBJ_AMMO;
        }

        return type;
    }

    // Generates map
    initialGeneration() {
        // Initial graves (in each cell with some chance)
        for (let x = MARGIN - 1; x < SIZE_X - (MARGIN - 1); x++) {
            let y = (MARGIN - 1);
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let x = (MARGIN - 1); x < SIZE_X - (MARGIN - 1); x++) {
            let y = SIZE_Y - (MARGIN - 1) - 1;
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let y = (MARGIN - 1); y < SIZE_Y - (MARGIN - 1); y++) {
            let x = (MARGIN - 1);
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
        for (let y = (MARGIN - 1); y < SIZE_Y - (MARGIN - 1); y++) {
            let x = SIZE_X - (MARGIN - 1) - 1;
            let cell = this.grid[x][y];
            cell.grave = 1;
            cell.obstacle = 1;
        }
    }

    // Generates gates (always in the top), check for player near
    gates(x) {
        // Check for existing gates
        let gatesFound = 0;
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                if (this.grid[x][y].gates)
                    gatesFound = 1;
            }
        }

        if (gatesFound || this.gates_state) { // We don't need one more gates
            if (this.gates_state === 0)
                this.gates_state = 1; // Gates spawned
            return;
        }

        // Set gates_state
        this.gates_state = 1;

        // Gates itself
        this.grid[x][MARGIN - 1].gates = 1;
        this.grid[x + 1][MARGIN - 1].gates = 2;
        // Clear space under
        this.grid[x][MARGIN].obstacle = 0;
        this.grid[x + 1][MARGIN].obstacle = 0;
        this.grid[x][MARGIN].grave = 0;
        this.grid[x + 1][MARGIN].grave = 0;
        // Light
        this.spec_lights.push(new LightSource(new Vec2(x * 8 + 8, MARGIN * 8 - 8), 3));
    }

    // Generates the map
    generate() {
        // Initial graves (in each cell with some chance)
        let specGravesNum = 0;
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                let cell = this.grid[x][y];
                if (cell.light > 0) // Forbidden zone
                    continue;
                cell.ground = this.random_ground_type();
                cell.covering = this.clever_covering_type();
                if (cell.grave < 0) {
                    this.spec_graves_visited[-cell.grave - 1] = 0;
                    specGravesNum++;
                }
            }
        }

        for (let x = MARGIN; x < SIZE_X - MARGIN; x++) {
            for (let y = MARGIN; y < SIZE_Y - MARGIN; y++) {
                let cell = this.grid[x][y];
                if (cell.light > 0) // Forbidden zone
                    continue;
                if (!Random.random(0, 10)) { // Grave
                    cell.grave = this.random_grave_type();
                    cell.obstacle = 1;
                    cell.covering = 0;
                } else {
                    cell.grave = 0;
                    cell.obstacle = 0;
                }
            }
        }

        // Apply maze
        let mazeField = Maze.generate(new Vec2(SIZE_X - MARGIN * 2 + 2, SIZE_Y - MARGIN * 2 + 2));
        for (let x = MARGIN; x < SIZE_X - MARGIN; x++) {
            for (let y = MARGIN; y < SIZE_Y - MARGIN; y++) {
                let cell = this.grid[x][y];
                cell.roomId = mazeField[x - MARGIN + 1][y - MARGIN + 1].roomId; // FIX IT
                if (cell.light > 0) // Forbidden zone
                    continue;
                if (mazeField[x - MARGIN + 1][y - MARGIN + 1].wall) { // Grave
                    cell.grave = this.random_grave_type();
                    cell.obstacle = 1;
                    cell.covering = 0;
                } else {
                    cell.grave = 0;
                    cell.obstacle = 0;
                }
            }
        }

        // Spec grave
        let spec_sum = this.spec_graves_visited[0] * this.spec_graves_visited[1] * this.spec_graves_visited[2];

        if (this.level < 3 && specGravesNum <= this.spec_graves_visited_count + 1 && spec_sum === 0) {
            let x0 = Random.random(MARGIN + 2, SIZE_X - MARGIN - 2);
            let y0 = Random.random(MARGIN + 2, SIZE_Y - MARGIN - 2);
            let cell = this.grid[x0][y0];

            for (let i = 0; i < 1000 && cell.light > 0; i++) {
                x0 = Random.random(MARGIN + 2, SIZE_X - MARGIN - 2);
                y0 = Random.random(MARGIN + 2, SIZE_Y - MARGIN - 2);
                cell = this.grid[x0][y0];
            }

            if (1) { // Spec grave!!!
                for (let x = x0 - 1; x <= x0 + 1; x++) {
                    for (let y = y0 - 1; y <= y0 + 1; y++) {
                        this.grid[x][y].obstacle = 0;
                        this.grid[x][y].grave = 0;
                    }
                }

                cell.grave = -this.level - 1;
                this.spec_graves_visited[-cell.grave - 1] = 1; // 1 - generated, 2 - visited
                cell.obstacle = 1;
                cell.covering = 0;
            }

            console.log('spec');
        }

        //// Cemetery gates ////
        if (this.spec_graves_visited_count >= 3)
            this.gates(Random.random(MARGIN + 1, SIZE_X - MARGIN - 2));

    }

    // Subjects-spawning management
    spawnSubjects() {
        //// Subjects (bonuses) ////
        this.subjectTimer -= DT; // dt
        // Despawn
        for (let i = 0; i < this.subjects.length; i++) {
            let subject = this.subjects[i];
            subject.gridPos = this.getCell(subject.pos);
            if (!subject.type || subject.pos.dist(this.player.pos) > 1000) {
                this.subjects.splice(i, 1);
            }
        }

        // Spawning new subjects
        for (let i = 0; i < 10; i++) { // We try to spawn subject for 10 times
            // Generate random point
            let pos = new Vec2(Random.random(MARGIN + 1, SIZE_X - MARGIN - 1), Random.random(MARGIN, SIZE_Y - MARGIN - 1));

            let neighbors = 0;
            neighbors += (this.grid[pos.x + 1][pos.y].grave > 0);
            neighbors += (this.grid[pos.x - 1][pos.y].grave > 0);
            neighbors += (this.grid[pos.x][pos.y + 1].grave > 0);
            neighbors += (this.grid[pos.x][pos.y - 1].grave > 0);

            // Checking for limitations
            if (neighbors !== 3) // We place sunbjects in the dead ends
                break;
            if (this.subjects.length >= SUBJECT_LIMIT) // Too much subjects
                break;
            if (this.subjectTimer > 0) // We can't spawn subjects to often
                break;
            if (this.grid[pos.x][pos.y].obstacle) // Cell is not empty
                continue;
            if (this.grid[pos.x][pos.y].light > DIST_LIGHT - 1) // Visible zone
                continue;
            if (pos.x <= MARGIN && pos.y <= MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN) // Out of cemetery
                continue;

            // Making a subject
            let subject = new Subject(pos.mult(new Vec2(8, 8)).plus(new Vec2(4, 4)));

            // Choosing type
            subject.type = this.subject_type();

            // Adding subject to array
            this.subjects.push(subject);

            // Timer
            this.subjectTimer = SUBJECT_PERIOD;
        }
    }

    // Moves object (collision)
    move(object, shift, flight) {
        let deltaPos = shift;
        let newPosX = object.pos.plus(new Vec2(0, 0));
        newPosX.x += deltaPos.x;
        let newPosY = object.pos.plus(new Vec2(0, 0));
        newPosY.y += deltaPos.y;
        let cellPosX = newPosX.div(new Vec2(8, 8)); // Cell
        let cellPosY = newPosY.div(new Vec2(8, 8)); // Cell
        cellPosX.x = Math.floor(cellPosX.x);
        cellPosX.y = Math.floor(cellPosX.y);
        cellPosY.x = Math.floor(cellPosY.x);
        cellPosY.y = Math.floor(cellPosY.y);
        if (cellPosX.x < 0 || cellPosX.y < 0 || cellPosX.x >= SIZE_X || cellPosX.y >= SIZE_Y || (!flight && this.grid[cellPosX.x][cellPosX.y].obstacle)) {
            deltaPos.x = 0;
        }
        if (cellPosY.x < 0 || cellPosY.y < 0 || cellPosY.x >= SIZE_X || cellPosY.y >= SIZE_Y || (!flight && this.grid[cellPosY.x][cellPosY.y].obstacle)) {
            deltaPos.y = 0;
        }
        object.pos = object.pos.plus(deltaPos);

        // Grid pos
        object.grid_pos = this.getCell(this.player.pos);
        return deltaPos.x || deltaPos.y;
    }

    // Player's movement & actions
    playerControl() {
        // Player movement
        // Check keys

        this.player.step(DT)

        if (this.keyboard.keyPressedOnce("Enter")) {
            this.RELOAD = 1;
        }

        //
        // //// WIN ////
        // if (this.player.pos.y < MARGIN * 8 - 8)
        //     this.player.status = 3;
    }

    // Monster management
    monstersControl() {
        //// Spawning & despawning ////
        this.monsterTimer -= DT;
        // Despawning monsters
        for (let i = 0; i < this.monsters.length; i++) {
            let monster = this.monsters[i];
            // Dead, too far or inappropriate level
            if (monster.hp <= 0 || monster.pos.dist(this.player.pos) > 1000 || monster.level > this.level) {
                // Drop items
                if (monster.hp <= 0 && Random.random(0, 99) < 70) { // Chance 70%
                    let sbj = new Subject(); // Dropped subject
                    sbj.type = this.subject_type();
                    sbj.pos = monster.pos;
                    this.subjects.push(sbj);
                }
                this.monsters.splice(i, 1);
            }
        }

        // Spawning new monsters
        // We try to spawn monster for 10 times
        for (let i = 0; i < 10; i++) {
            // Generate random point
            let pos = new Vec2(Random.random(MARGIN + 1, SIZE_X - MARGIN - 1), Random.random(MARGIN, SIZE_Y - MARGIN - 1));

            // Checking for limitations
            if (this.monsters.length >= MONSTER_LIMIT) // Too much monsters
                break;
            if (this.monsterTimer > 0) // We can't spawn monsters too often
                break;
            if (this.grid[pos.x][pos.y].obstacle) // Cell is not empty
                continue;
            if (this.grid[pos.x][pos.y].light > DIST_LIGHT - 1) // Visible zone
                continue;
            if (pos.x <= MARGIN && pos.y <= MARGIN || pos.x >= SIZE_X - MARGIN || pos.y >= SIZE_Y - MARGIN) // Out of cemetery
                continue;

            // Making a monster
            let monster = Monster.getRandomMonster(this)
            monster.pos = pos.mult(new Vec2(8, 8)).plus(new Vec2(4, 4));

            // Adding monster to array
            this.monsters.push(monster);

            // Timer
            this.monsterTimer = MONSTER_PERIOD;
        }

        //// Behavior ////
        for (let i = 0; i < this.monsters.length; i++) {
            // Get current monster
            let monster = this.monsters[i];
            monster.step(DT);
        }
    }

    // Generate light around player (& other objects)
    setLight() {
        // Add player pos to light source
        this.lightSources.push(new LightSource(this.player.pos, this.player.distLight + this.flickeringDelta));

        // Turning light off
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].light = 0;
            }
        }

        for (let i = 0; i < this.spec_lights.length; i++) {
            this.lightSources.push(this.spec_lights[i]);
        }

        // BFS deque
        let deque = new Deque();

        // Adding initial cells
        for (let i = 0; i < this.lightSources.length; i++) {
            // Current light source
            let lightSource = this.lightSources[i];
            let cellPos = this.getCell(lightSource.pos);
            for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {
                    let dist = lightSource.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                    if (this.checkCell(new Vec2(x, y)) || dist > 16)
                        continue;
                    this.grid[x][y].light = Math.max(this.grid[x][y].light, lightSource.power - DIST_LIGHT + DIST_LOAD + 1 - dist / 8);
                    deque.addBack(new Vec2(x, y));
                }
            }
        }

        // Temporal light sources
        for (let i = 0; i < this.temporalLightSources.length; i++) {
            // Current light source
            let lightSource = this.temporalLightSources[i];
            lightSource.step(DT);
            let cellPos = this.getCell(lightSource.pos);

            for (let x = cellPos.x - 1; x <= cellPos.x + 1; x++) {
                for (let y = cellPos.y - 1; y <= cellPos.y + 1; y++) {

                    let dist = lightSource.pos.dist(new Vec2(x * 8 + 4, y * 8 + 4));
                    if (this.checkCell(new Vec2(x, y)) || dist > 16)
                        continue;
                    this.grid[x][y].light = Math.max(this.grid[x][y].light, lightSource.power - DIST_LIGHT + DIST_LOAD + 1 - dist / 8);
                    deque.addBack(new Vec2(x, y));
                }
            }

            if (lightSource.alive === 0)
                this.temporalLightSources.splice(i, 1);
        }

        // Clean lightSources
        this.lightSources = [];

        // BFS itself
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];
        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if (this.grid[pos.x][pos.y].light < 0)
                this.grid[pos.x][pos.y].light = 0;
            if (this.grid[pos.x][pos.y].light <= 0)
                continue;

            let deltaLight = 1;
            if (this.grid[pos.x][pos.y].obstacle)
                deltaLight = 10;
            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || this.grid[pos1.x][pos1.y].light > this.grid[pos.x][pos.y].light - deltaLight)
                    continue;
                this.grid[pos1.x][pos1.y].light = this.grid[pos.x][pos.y].light - deltaLight;
                deque.addBack(pos1);
            }
        }
    }

    // Sprite animations
    manageAnimations() {
        // Step
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[i].step();
        }
        // Delete
        for (let i = 0; i < this.animations.length; i++) {
            if (!this.animations[i].alive) {
                this.animations.splice(i, 1);
                i--;
            }
        }
    }

    cooldowns() {
        // Spec graves
        this.specGraveTimer -= DT;
        if (this.specGraveTimer < 0)
            this.specGraveTimer = 0;

        // Flickering
        this.flickeringTimer -= DT;
        if (this.flickeringTimer <= 0) {
            this.flickeringTimer = this.flickeringCooldown;
            this.flickeringDelta += Random.random(-1, 1) * this.flickeringD;
            this.flickeringDelta = Math.min(Math.max(this.flickeringDelta, -this.flickeringMaxDelta), this.flickeringMaxDelta);
        }
    }

    // Pathfinding, DA HARDKOD NO VY VOOBSHE ETOT EBANYI PROEKT VIDELI, TUT V ODNOM ETOM FAILE 1000 STROK NAHUI
    pathfinding() {
        // ZOMBIE
        // Clearing navigating map
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].zombieNav = 0;
            }
        }
        // BFS deque
        let deque = new Deque();
        let x = Math.floor(this.player.pos.x / 8);
        let y = Math.floor(this.player.pos.y / 8);

        this.grid[x][y].zombieNav = DIST_LOAD + 1;
        deque.addBack(new Vec2(x, y));

        // BFS itself
        let neighbors = [
            new Vec2(1, 0),
            new Vec2(-1, 0),
            new Vec2(0, 1),
            new Vec2(0, -1)
        ];

        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if (this.grid[pos.x][pos.y].zombieNav < 0)
                this.grid[pos.x][pos.y].zombieNav = 0;
            if (this.grid[pos.x][pos.y].zombieNav <= 0)
                continue;

            let deltaNav = 1;
            if (this.grid[pos.x][pos.y].obstacle)
                deltaNav = 1000;
            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || (this.grid[pos1.x][pos1.y].zombieNav >= this.grid[pos.x][pos.y].zombieNav - deltaNav))
                    continue;
                this.grid[pos1.x][pos1.y].zombieNav = this.grid[pos.x][pos.y].zombieNav - deltaNav;
                deque.addBack(pos1);
            }
        }

        // GHOST

        // Clearing
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                this.grid[x][y].ghostNav = 0;
            }
        }
        // BFS deque
        deque = new Deque();
        x = this.getCell(this.player.pos).x;
        y = this.getCell(this.player.pos).y;

        this.grid[x][y].ghostNav = DIST_LOAD + 1;
        deque.addBack(new Vec2(x, y));

        // BFS itself
        while (deque.peekFront()) {
            let pos = deque.peekFront().clone();
            deque.removeFront();
            if (this.grid[pos.x][pos.y].ghostNav < 0)
                this.grid[pos.x][pos.y].ghostNav = 0;
            if (this.grid[pos.x][pos.y].ghostNav <= 0)
                continue;

            let deltaNav = 1;

            for (let i = 0; i < 4; i++) {
                let pos1 = pos.plus(neighbors[i]);
                if (this.checkCell(pos1) || (this.grid[pos1.x][pos1.y].ghostNav >= this.grid[pos.x][pos.y].ghostNav - deltaNav))
                    continue;
                this.grid[pos1.x][pos1.y].ghostNav = this.grid[pos.x][pos.y].ghostNav - deltaNav;
                deque.addBack(pos1);
            }
        }
    }

    // Function called in each iteration
    step() {
        this.gamepad.refresh()
        if (this.player.status === 0) { // If player is alive
            this.mentalDanger = 0;
            this.pathfinding();
            this.playerControl();
            this.monstersControl();
            this.setLight();
            //this.generate();
            this.spawnSubjects();
            this.manageAnimations();
            this.cooldowns();
        }
        if (this.keyboard.keyPressedOnce("Enter")) {
            this.RELOAD = 1;
        }
    }

    spawnPlayer(pos) {
        let gridPos = this.getCell(pos);

        this.player.pos = pos;
        this.player.gridPos = gridPos;

        // Clearing area
        for (let x = Math.max(0, gridPos.x - 1); x <= Math.min(SIZE_X, gridPos.x + 1); x++) {
            for (let y = Math.max(0, gridPos.y - 1); y <= Math.min(SIZE_Y, gridPos.y + 1); y++) {
                this.grid[x][y].grave = 0;
                this.grid[x][y].obstacle = 0;
            }
        }

        // Spawning gates
        this.gates(this.getCell(pos).x - 1);
    }
}

module.exports = Game
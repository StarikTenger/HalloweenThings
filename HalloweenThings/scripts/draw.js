
const Vec2 = require("./vec2")

// This class is responsible for drawing
class Draw {
    constructor(ctx) {
        this.ctx = ctx;

        this.cam = new Vec2(0, 0); // Camera position
        this.center = new Vec2(64, 64); // Screen center (здфнукы ы)
    }

    image(texture, x, y, w, h, flip) {
        // x = Math.round(x);
        // y = Math.round(y);
        // w = Math.round(w);
        // h = Math.round(h);

        if(!flip)
            flip = 0;

        this.ctx.save();
        let width = 1;
        if (flip) {
            this.ctx.scale(-1, 1);
            width = -1;
        }
        this.ctx.imageSmoothingEnabled = 0;
        this.ctx.drawImage(texture, width*(x + w * flip - this.cam.x + this.center.x) * SCALE, (y - this.cam.y + this.center.y) * SCALE, w * SCALE, h * SCALE);
        this.ctx.restore();
    }

    rect(x, y, w, h, color) {
        // x = Math.round(x);
        // y = Math.round(y);
        // w = Math.round(w);
        // h = Math.round(h);

        this.ctx.imageSmoothingEnabled = 0;
        this.ctx.fillStyle = color;
        this.ctx.fillRect((x - this.cam.x + this.center.x) * SCALE, (y - this.cam.y + this.center.y) * SCALE, w * SCALE, h * SCALE);
    }

    draw(game) {

        // Focusing camera
        this.cam = game.player.pos;
        this.center = new Vec2(64, 64);

        // Filling background
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, 10000, 10000);

        this.ySorted = [];

        // Grid
        for (let x = 0; x < SIZE_X; x++) {
            for (let y = 0; y < SIZE_Y; y++) {
                if(game.grid[x][y].light <= 0 && game.player.pos.distToPosition(x * 8 + 4, y * 8 + 4) > DIST_LIGHT * 2 * 8) // We don't see this cell
                   continue;
                let cell = game.grid[x][y];

                // Choosing room covering & wall (should be better in generate)
                if (cell.roomId) {
                    game.grid[x][y].ground = 3;
                    if (game.grid[x][y].grave > 0)
                        game.grid[x][y].grave = 2;
                }

                // Ground & covering
                if (cell.ground) {
                    this.ySorted.push([IMGS_GROUND[cell.ground - 1], x * CELL_SIZE, y * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE, 0, -5]);
                }
                if (cell.covering) {
                    this.ySorted.push([IMGS_COVERING[cell.covering - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, -4]);
                }

                // Gates
                if (cell.gates) {
                    if (game.gates_state === 1)
                        this.ySorted.push([IMGS_GATES[+cell.gates - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    continue;
                }

                // Drawing wall (yes, it's called grave, but it's a wall)
                if (cell.grave) {
                    if (cell.grave > 0) {
                        let column = IMGS_WALL[+cell.grave - 1][0];
                        let column_top = IMGS_WALL[+cell.grave - 1][1];
                        let wall = IMGS_WALL[+cell.grave - 1][2];
                        let wall_top = IMGS_WALL[+cell.grave - 1][3];

                        // Column top
                        this.ySorted.push([column_top,
                            x * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 ,
                            y  * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                            COLUMN_WIDTH, COLUMN_WIDTH, 0, (y + 1) * 8]);
                        // Wall top
                        if (game.grid[x + 1][y].grave > 0) {
                            this.ySorted.push([wall_top,
                                x * CELL_SIZE + (CELL_SIZE + COLUMN_WIDTH) / 2,
                                y * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                                CELL_SIZE - COLUMN_WIDTH, COLUMN_WIDTH, 0, (y + 1) * 8]);
                            this.ySorted.push([wall,
                                x * CELL_SIZE + (CELL_SIZE + COLUMN_WIDTH) / 2,
                                y * CELL_SIZE + (CELL_SIZE + COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                                CELL_SIZE - COLUMN_WIDTH, COLUMN_HEIGHT, 0, (y + 1) * 8]);
                        }
                        if (game.grid[x - 1][y].grave > 0) {
                            this.ySorted.push([wall_top,
                                x * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 - (CELL_SIZE - COLUMN_WIDTH),
                                y * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                                CELL_SIZE - COLUMN_WIDTH, COLUMN_WIDTH, 0, (y + 1) * 8]);
                            this.ySorted.push([wall,
                                x * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 - (CELL_SIZE - COLUMN_WIDTH),
                                y * CELL_SIZE + (CELL_SIZE + COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                                CELL_SIZE - COLUMN_WIDTH, COLUMN_HEIGHT, 0, (y + 1) * 8]);
                        }
                        if (game.grid[x][y + 1].grave > 0)
                            this.ySorted.push([wall_top,
                                x * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 ,
                                y  * CELL_SIZE + (CELL_SIZE + COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                                COLUMN_WIDTH, CELL_SIZE - COLUMN_WIDTH, 0, (y + 1) * 8]);
                        if (game.grid[x][y - 1].grave > 0)
                            this.ySorted.push([wall_top,
                                x * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 ,
                                y  * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 - (CELL_SIZE - COLUMN_WIDTH) -  COLUMN_HEIGHT,
                                COLUMN_WIDTH, CELL_SIZE - COLUMN_WIDTH, 0, (y + 1) * 8]);

                        // Columns
                        if (!(game.grid[x][y + 1].grave > 0))
                            this.ySorted.push([column,
                                x * CELL_SIZE + (CELL_SIZE - COLUMN_WIDTH) / 2 ,
                                y  * CELL_SIZE + (CELL_SIZE + COLUMN_WIDTH) / 2 -  COLUMN_HEIGHT,
                                COLUMN_WIDTH, COLUMN_HEIGHT, 0, (y + 1) * 8]);
                    } else { // Spec grave
                        this.ySorted.push([IMGS_SPEC_GRAVE[-cell.grave - 1], x * CELL_SIZE, (y - 1) * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, 0, (y + 1) * 8]);
                    }
                }
            }
        }

        // Player
        let cur_texture = game.player.getFrame();
        this.ySorted.push([cur_texture, game.player.pos.x - CELL_SIZE / 2, game.player.pos.y - 2 * CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE * 2, game.player.right === 0, game.player.pos.y]);

        // Monsters
        for (let i = 0; i < game.monsters.length; i++) {
            let monster = game.monsters[i];
            let frame = monster.getFrame();
            this.ySorted.push([frame, monster.pos.x - CELL_SIZE / 2, monster.pos.y - CELL_SIZE * 2, TEXTURE_SIZE, TEXTURE_SIZE * 2, monster.right === 0, monster.pos.y]);
        }

        // Subjects
        for (let i = 0; i < game.subjects.length; i++) {
            let subject = game.subjects[i];
            if (!subject || !subject.type) // Corrupted
                continue;
            this.ySorted.push([IMGS_SUBJECT[subject.type - 1], subject.pos.x - CELL_SIZE / 2, subject.pos.y - CELL_SIZE, TEXTURE_SIZE, TEXTURE_SIZE , 0, subject.pos.y]);
        }

        // Sprite animations
        for (let i = 0; i < game.animations.length; i++) {
            let animation = game.animations[i];
            if (animation.interface_bind) {
                continue;
            }
            let img = animation.getFrame();
            this.ySorted.push([img, animation.pos.x - CELL_SIZE / 2, animation.pos.y, animation.box.x, animation.box.y , 0, 1000]);
        }

        // Sorting objects by Y-pos
        this.ySorted.sort(function(a, b) {
            return a[6] - b[6];
        });

        // Drawing sorted objects
        for (let x = 0; x < this.ySorted.length; x++) {
            let a = this.ySorted[x];
            this.image(a[0], a[1], a[2], a[3], a[4], a[5]);
        }

        // Gradient light
        let pixelSize = 2; // Size of cell of light grid
        let vector = new Vec2(0, 0)
        for (let x1 = this.cam.x - 64; x1 <= this.cam.x + 64; x1 += pixelSize) {
            for (let y1 = this.cam.y - 64; y1 <= this.cam.y + 64; y1+= pixelSize) {
                let val = 0; // Light value
                let sum = 0; // Dist sum
                vector.x = x1
                vector.y = y1
                let cellX = Math.floor(x1 / 8)
                let cellY = Math.floor(y1 / 8)

                // Neighbor cells
                for (let x = cellX - 1; x <= cellX + 1; x++) {
                    for (let y = cellY - 1; y <= cellY + 1; y++) {
                        let dist = vector.distToPosition(x * 8 + 4, y * 8 + 4);
                        if (game.checkCellPosition(x, y) || dist >= 16)
                            continue;
                        val += game.getLightPosition(x, y) * (18 - dist);
                        sum += 18 - dist;
                    }
                }

                val /= sum;

                let alpha = (1 - (val / DIST_LIGHT));
                this.rect(x1, y1, pixelSize, pixelSize, "rgba(0,0,0," + alpha + ")");
            }
        }

        //// Interface ////
        this.cam = new Vec2(0, 0);
        this.center = new Vec2(0, 0);
        this.image(IMG_INTERFACE, 0, 0, 64 * 2, 64 * 2);

        // Mind
        this.rect(53 * 2, 55 * 2, game.player.mind * 10 / LIMIT_MIND * 2, 2, "rgb(0,100,200)");
        // Hp
        this.rect(18 * 2, 63 * 2, 2 * 2, - game.player.hp * 6 / LIMIT_HP * 2, "rgb(194, 29, 40)");
        // Oil
        this.rect(8 * 2, 63 * 2, 2 * 2, - game.player.oil * 6 / LIMIT_OIL * 2, "rgb(148, 133, 46)");
        // Matches
        for (let i = 0; i < game.player.matches; i++) {
            this.image(IMG_MATCH, (22 + i * 2)  * 2, 58 * 2, 2, 5 * 2);
        }
        // Ammo
        this.rect(2, 55 * 2, game.player.weapon.ammo * 5 / 5 * 2, 2, "rgb(0, 143, 39)");
        // Cooldown
        this.rect(2, 54 * 2, game.player.weapon.timeToCooldown * 10 / game.player.weapon.cooldownTime * 2 , 2, "rgb(0, 0, 0)");

        if (game.mentalDanger) {
            this.image(IMG_MENTAL_DANGER, 53 * 2, 49 * 2, 10 * 2, 5 * 2);
        }

        // Subjects
        for (let j = 0; j < 2; j++) {
            if (!game.player.subjects[j] || !game.player.subjects[j].type) // Empty slot
                continue;

            this.image(IMGS_SUBJECT[game.player.subjects[j].type - 1], (28 + j * 7)  * 2, 56 * 2, 8 * 2, 8 * 2)
        }

        // Spec Graves
        for (let i = 0; i < game.spec_graves_visited.length; i++) {
            if (game.spec_graves_visited[i] === 2) {
                this.image(IMGS_SPEC_MINI_GRAVE[i], (52 + 4 * i) * 2, 57 * 2, 3 * 2, 6 * 2);
            }
        }

        // Overlay
        this.image(IMG_INTERFACE_OVERLAY, 0, 0, 64 * 2, 64 * 2);

        // Animations
        for (let i = 0; i < game.animations.length; i++) {
            let animation = game.animations[i];
            if (!animation.interface_bind) {
                continue;
            }
            let img = animation.getFrame();
            this.image(img, animation.pos.x * 2, animation.pos.y * 2, animation.box.x * 2, animation.box.y * 2 , 0);
        }

        // Gameover screen
        if (game.player.status === 1) {
            this.image(IMG_DEAD, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 2) {
            this.image(IMG_DELIRIOUS, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 3) {
            this.image(IMG_WIN, 0, 0, 64 * 2, 64 * 2);
        }
        if (game.player.status === 4) {
            this.image(IMG_START_SCREEN, 0, 0, 64 * 2, 64 * 2);
        }
    }
}

module.exports = Draw
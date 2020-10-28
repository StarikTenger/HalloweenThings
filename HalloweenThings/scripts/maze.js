const Vec2 = require("./vec2.js")
const Random = require("./random.js")

class Maze {
    // Generates room
    static room(field, pos, size, index) {
        // Empty room with walls
        for (let x = pos.x; x < pos.x + size.x; x++) {
            for (let y = pos.y; y < pos.y + size.y; y++) {
                if (x === pos.x || y === pos.y || x === pos.x + size.x - 1 || y === pos.y + size.y - 1)
                    field[x][y].wall = 1;
                else
                    field[x][y].wall = 0;
                field[x][y].roomId = index;
            }
        }

        // Doors
        field[pos.x][pos.y + Math.floor(size.y / 2)].wall = 0;
        field[pos.x + size.x - 1][pos.y + Math.floor(size.y / 2)].wall = 0;
        field[pos.x + Math.floor(size.x / 2)][pos.y].wall = 0;
        field[pos.x + Math.floor(size.x / 2)][pos.y + size.y - 1].wall = 0;

        field[pos.x][pos.y + Math.floor(size.y / 2)].roomEnter = 1;
        field[pos.x + size.x - 1][pos.y + Math.floor(size.y / 2)].roomEnter = 1;
        field[pos.x + Math.floor(size.x / 2)][pos.y].roomEnter = 1;
        field[pos.x + Math.floor(size.x / 2)][pos.y + size.y - 1].roomEnter = 1;
    }

    // Generates maze width current size
    static generate(size) {
        let field = [];
        let walls = [];
        let counter = 0;

        // Generating grid
        for (let x = 0; x < size.x; x++) {
            field.push([]);
            for (let y = 0; y < size.y; y++) {
                let cell = { wall: 0, id: 0 };

                if (x === 0 || y === 0 || x === size.x - 1 || y === size.y - 1)
                    cell.wall = 1;
                else if ((x + 1) % 2 === 0 && (y + 1) % 2 === 0) {
                    cell.id = counter;
                    counter++;
                } else if (x % 2 === 0 && y % 2 !== 0 || y % 2 === 0 && x % 2 !== 0) {
                    cell.wall = 1;
                    walls.push(new Vec2(x, y));
                } else {
                    cell.wall = 1;
                }

                field[x].push(cell);
            }
        }

        // Shuffle walls
        for(let i = 0; i < walls.length; i++) {
            let place = walls[i];
            let n = Random.random(0, walls.length-1);
            walls[i] = walls[n];
            walls[n] = place;
        }

        // Deleting walls
        for (let i = 0; i < walls.length; i++) {
            let wall = walls[i];
            let id1, id2;
            if (wall.x % 2) {
                id1 = field[wall.x][wall.y - 1].id;
                id2 = field[wall.x][wall.y + 1].id;
            } else {
                id1 = field[wall.x - 1][wall.y].id;
                id2 = field[wall.x + 1][wall.y].id;
            }

            if (id1 === id2)
                continue;

            field[wall.x][wall.y].wall = 0;

            // Naive reindexation
            for (let x = 0; x < size.x; x++)
                for (let y = 0; y < size.y; y++)
                    if (field[x][y].id === id2)
                        field[x][y].id = id1;
        }

        // Deleting random walls
        for (let i = 0; i < walls.length; i++) {
            let wall = walls[i];
            if (Random.random(0, 99) < 5) // 5% chance
                field[wall.x][wall.y].wall = 0;
        }

        // Rooms
        let roomsNumber = 4;
        for (let i = 1; i <= roomsNumber; i++) {
            let roomSize = new Vec2(7, 7);
            this.room(field, new Vec2(
                Random.random(1, Math.floor((size.x - roomSize.x) / 2)) * 2,
                Random.random(1, Math.floor((size.y - roomSize.y) / 2)) * 2,
                  ), roomSize, i);
        }

        return field;
    }
}

module.exports = Maze
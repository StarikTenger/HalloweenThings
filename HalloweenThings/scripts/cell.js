// Cell on the grid
class Cell {
    constructor() {
        this.ground = 0;
        this.covering = 0;
        this.grave = 0;
        this.gates = 0; // 0 - none, 1 - left part, 2 - right part
        this.obstacle = 0; // 0 - player can pass, 1 - player can't pass
        this.type = 0; // For different texturing
        this.light = 0; // Illumination

        this.zombieNav = 0; // Used to navigate zombies
        this.ghostNav = 0; // Used to navigate zombies
    }
}

module.exports = Cell
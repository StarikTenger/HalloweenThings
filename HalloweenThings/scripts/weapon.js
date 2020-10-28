// Weapon
class Weapon {

    damage = 1
    ammoMax = 10
    ammo = 0
    cooldownTime = 0.75
    timeToCooldown = 0

    constructor() {
        this.ammo = this.ammoMax;
        this.timeToCooldown = this.cooldownTime;
    }
}

module.exports = Weapon
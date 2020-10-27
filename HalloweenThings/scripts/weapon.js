// Weapon
class Weapon {
    constructor() {
        this.damage = 1;
        // Ammo
        this.ammoMax = 10;
        this.ammo = this.ammoMax;
        // Cooldown
        this.cooldownTime = 0.75;
        this.timeToCooldown = this.cooldownTime;
    }
}

module.exports = Weapon
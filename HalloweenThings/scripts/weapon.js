// Weapon
class Weapon {
    constructor() {
        this.damage = 1;
        // Ammo
        this.ammoMax = 5;
        this.ammo = this.ammoMax;
        // Cooldown
        this.cooldownTime = 1;
        this.timeToCooldown = this.cooldownTime;
    }
}

module.exports = Weapon
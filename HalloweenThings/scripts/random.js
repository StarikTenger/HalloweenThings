
//// RANDOM ////

class Random {
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static random_float(min, max) {
        return (Math.random() * (max - min) + min);
    }

    static normalDistribution(min, max, iterations) {
        let sum = 0;
        for (let i = 0; i < iterations; i++)
            sum += this.random(min, max);
        return Math.round(sum / iterations);
    }

    static normalRoll(min, max, iterations) { // gives value from min to max with normal distribution
        let roll = this.normalDistribution(-max + min, +max - min, iterations);
        return Math.abs(roll) + min;
    }
}

module.exports = Random
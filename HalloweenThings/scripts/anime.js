class Anime {
    constructor(frame_time, frames) {
        this.frame_time = frame_time;
        this.frames = frames;
        this.frame = 0;
        this.frames_cnt = this.frames.length;
    }
}

module.exports = Anime
export default class Timer {

    lastTime : number;
    duration : number;

    constructor(duration : number, startTime? : number) {
        this.lastTime = startTime || 0;
        this.duration = duration;
    }

    isOver(time : number) {
        let over = false;
    
        if((time - this.lastTime) > this.duration) {
            over = true;
            this.lastTime = time;
        }
        return over;
    }
}
/**
 * The current time, in ms.
 */
export let currentTime : number = 0;
/**
 * The time in the previous frame, in ms.
 */
export let previousGameTime : number = 0;

/**
 * The difference in time between this and last frame, in ms.
 */
export let deltaTime : number = 0;

/**
 * Last time the frameCount was reset and realFPS set.
 */
export let lastTime : Date = new Date();
export let frameCount : number = 0;
export let realFPS  : number = 0;

/**
 * The period with which the fps is updated, in ms.
 */
export let fpsUpdateInterval : number = 1000;

export let update = function () : void {
    currentTime = new Date().getTime();
    deltaTime = (currentTime - previousGameTime);
    previousGameTime = currentTime;

    let nowTime = new Date();
    let diffTime = nowTime.getTime() - lastTime.getTime();

    if (diffTime >= fpsUpdateInterval) {
        realFPS = frameCount;
        frameCount = 0;
        lastTime = nowTime;
    }
    frameCount++;
}
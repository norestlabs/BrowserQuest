export enum Status {
    /**
     * The page showing the player's character and the play button
     */
    Intro,
    /**
     * While it's loading map and sprites
     */
    Loading,
    /**
     * The moment after clicking the play button, when the game has loaded the map and sprites
     */
    Ready,
    /**
     * After the game loaded, while it's trying to connect to the server
     */
    Connecting,
    /**
     * After connecting, while it's waiting for the server to send the welcome
     */
    WaitingWelcome,
    /**
     * While the player is playing
     */
    Started
}
/**
 * Whether the game has started at least once or not.
 * It's true by default, and is set to false once it starts.
 * 
 * @type {boolean}
 */
export let hasNeverStarted : boolean = true;
export let setHasNeverStarted = function (v : boolean) : void {
    hasNeverStarted = v;
}

export let currentStatus : Status = Status.Intro;
export let setCurrentStatus = function (s : Status) : void {
    currentStatus = s;
}
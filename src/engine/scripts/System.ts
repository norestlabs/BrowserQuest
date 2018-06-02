export interface System {
    s_name : string;
    enabled : boolean;
    /**
     * Called when the document is ready.
     * 
     * @memberof System
     */
    awake? () : void;
    /**
     * Called when the player receives its first "Welcome" from the server.
     * 
     * @memberof System
     */
    start? () : void;
    /**
     * Called every frame.
     * 
     * @memberof System
     */
    update? () : void;
    /**
     * Called when an event was broadcasted.
     * 
     * @memberof System
     */
    onNotify? (event : any) : void;
}

/**
 * A reference to the different stages of system execution.
 * 
 * @export
 * @enum {number}
 */
export enum SystemOrder {
    Input       = -5,
    Normal      = 0,
    Movement    = 10,
    PreRender   = 900,
    Render      = 1000,
    UIRender    = 1100,
    PostRender  = 2000,
    Late        = 3000
}

export let SystemPool : { [name : string] : [ { new(): System }, number, boolean ] } = {};

export let registerSystem = function (type: { new(): System }, order? : number ) {
    let t = new type();
    SystemPool[t.s_name] = [ type, order || SystemOrder.Normal, true ];
}
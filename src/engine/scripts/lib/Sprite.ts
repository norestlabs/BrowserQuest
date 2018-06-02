import {Rect} from "@common/position";

/**
 * Stores all information about an animation.
 * 
 * @interface Animation
 */
export interface Animation {
    /**
     * How many frames does this animation have.
     * 
     * @type {number}
     * @memberof Animation
     */
    length : number;
    /**
     * Which row in the spritesheet is this animation from.
     * 
     * @type {number}
     * @memberof Animation
     */
    row : number;
    /**
     * The time between frames of the animation.
     * 
     * @type {number}
     */
    speed : number;

    name : string;
}

/**
 * Sprite has Image, ImageRect (which part of the image is the sprite), ImageRectOffset. Is just a class, not a component.
 * 
 */
export default class Sprite {

    name : string;
    /**
     * Reference to the image that this sprite is from.
     * 
     * @type {HTMLImageElement}
     * @memberof Sprite
     */
    image : HTMLImageElement;
    /**
     * The offset and dimensions of this sprite.
     * 
     * @type {Rect}
     * @memberof Sprite
     */
    imageRect : Rect;
    isLoaded : boolean;
    
    // TODO: change to null
    animations : { [name : string] : Animation };

    constructor (name : string, image : HTMLImageElement, imageRect : Rect, alpha? : number) {
        this.name = name;
        this.image = image;
        this.imageRect = imageRect;
        this.isLoaded = false;
        this.animations = {};
    }

    public get HasAnimation () : boolean {
        return Object.keys(this.animations).length !== 0;
    }
}
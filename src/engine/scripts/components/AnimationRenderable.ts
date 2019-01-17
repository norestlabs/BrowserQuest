import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import {Coordinate} from "@common/position";
import Sprite, {Animation} from "@lib/Sprite";

/**
 * AnimationSystem will go through all sprites looking for animation
 * and once found, will update it.
 */
export default class AnimationRenderable implements Component {
    static c_name : string = "AnimationRenderable";
	static c_id : Bitfield;
    enabled = true;
     /**
     * The frame of the sprite we're using.
     * A position representing where it starts.
     * 
     * @type {Coordinate}
     * @memberof SpriteRenderer
     * @default (0,0)
     */
    frame : Coordinate = { x : 0, y : 0 };
    
    flipX : boolean = false;
    flipY : boolean = false;

    isAnimating : boolean = false;

    /**
     * Used by the renderer to increment the index.
     * Don't use this to know the current index of the animation.
     * Instead, use frame.x.
     * 
     * @type {number}
     * @memberof AnimationRenderable
     */
    currentAnimationIndexCount : number = 0;
    currentAnimationName : string = "";
    currentAnimation : Animation | null = null;
    lastAnimationTime : number = 0;
    count : number;

    loop : boolean = false;

    public OnAnimationEnded () {
        this.isAnimating = false;
        this.currentAnimationName = "";
        this.currentAnimationIndexCount = 0;
        this.currentAnimation = null;
    }

    public Reset () : void {
        this.isAnimating = false;
        this.currentAnimationName = "";
        this.currentAnimationIndexCount = 0;
        this.currentAnimation = null;
    }

    /**
     * Gets the position in the spritesheet of current animation.
     * Doesn't take into consideration the sheet's scale.
     * 
     * @param {Sprite} sprite 
     * @returns {Coordinate} 
     * @memberof AnimationRenderable
     */
    public GetSpritePosition (sprite : Sprite) : Coordinate {
        if (this.currentAnimation != null && sprite.animations[this.currentAnimationName]) {
            let spriteAnimationLength = sprite.animations[this.currentAnimationName].length;
            let givenAnimationIndex = this.frame.x;
            let index = givenAnimationIndex % spriteAnimationLength;
            
            let x = index * sprite.imageRect.width,
                y = this.frame.y * sprite.imageRect.height;
            return {x, y};
        }
        return { x : 0, y : 0 };
    }
}
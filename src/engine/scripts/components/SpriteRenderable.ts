import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import AnimationRenderable from "./AnimationRenderable";
import Sprite from "@lib/Sprite";

export default class SpriteRenderable implements Component {
    static c_name : string = "SpriteRenderable";
	static c_id : Bitfield;
    enabled = true;

    /**
     * The name of the sprite this is managing.
     */
    sprite : string | null = null;
    /**
     * The opacity of the sprite.
     */
    alpha : number = 1;

    public get isLoaded () {
        return this.sprite != null;
    }

    public setSprite (sprite : Sprite, animationRenderer? : AnimationRenderable) {
        // If sprite is null or undefined, throw error
        if (!sprite) {
            throw "Error: tried setting undefined sprite.";
        }

        this.sprite = sprite.name;

        if (animationRenderer) {
            // Reset animations
            // There could be a scheduled event after the animation that is currently playing, so has to clear the events
            // Also the frame settings have to be reset
            animationRenderer.Reset();
            // Set whether the sprite has animations or not
            animationRenderer.enabled = sprite.HasAnimation;
        }
    }
}
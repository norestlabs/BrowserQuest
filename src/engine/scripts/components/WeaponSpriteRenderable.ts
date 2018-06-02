/*import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import Sprite from "./../Sprite";

export default class WeaponSpriteRenderable implements Component {
    static c_name : string = "WeaponSpriteRenderable";
	static c_id : Bitfield;
    enabled = true;
    sprite : Sprite = null;
    alpha : number = 1;

    public get isLoaded () {
        return this.sprite != null;
    }

    public setSprite (sprite : Sprite) {
        this.sprite = sprite;
    }

    getAnimationByName(name : string) {
        let animation = null;
    
        if(name in this.sprite.animations) {
            animation = this.sprite.animations[name];
        }
        else {
            Logger.error("No animation called "+ name);
        }
        return animation;
    }
}*/
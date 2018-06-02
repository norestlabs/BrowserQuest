import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";
import GameTypes from "@common/gametypes";

export default class Identifiable implements Component {
    static c_name : string = "Identifiable";
	static c_id : Bitfield;
    enabled = true;

    id : number = -1;
    name : string = "";
    kind : GameTypes.Entities = GameTypes.Entities.None;

    public get defaultSpriteName () : string {
        if (GameTypes.isItem(this.kind)) {
            return "item-" + GameTypes.getKindAsString(this.kind);
        }
        else if (GameTypes.isChest(this.kind)) {
            return "chest";
        }
        else {
            let n = GameTypes.getKindAsString(this.kind);
            if (n !== null) return n;
            else return "";
        }
    }

    public toString () : string {
        return `(${this.id}-${this.kind}-${this.name})`;
    }

    public get isCharacter () : boolean {
        return GameTypes.isCharacter(this.kind);
    }

    public get isPlayer () : boolean {
        return GameTypes.isPlayer(this.kind);
    };

    public get isMob () : boolean {
        return GameTypes.isMob(this.kind);
    };

    public get isNpc () : boolean {
        return GameTypes.isNpc(this.kind);
    };

    public get isArmor () : boolean {
        return GameTypes.isArmor(this.kind);
    };

    public get isWeapon () : boolean {
        return GameTypes.isWeapon(this.kind);
    };

    public get isObject () : boolean {
        return GameTypes.isObject(this.kind);
    };

    public get isChest () : boolean {
        return GameTypes.isChest(this.kind);
    };

    public get isItem () : boolean {
        return GameTypes.isItem(this.kind);
    };

    public get isHealingItem () : boolean {
        return GameTypes.isHealingItem(this.kind);
    };

    public get isExpendableItem () : boolean {
        return GameTypes.isExpendableItem(this.kind);
    };
}
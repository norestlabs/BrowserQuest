import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Equipment implements Component {
    static c_name : string = "Equipment";
	static c_id : Bitfield;
    enabled = true;

    armorName : string = "clotharmor";
    weaponName : string = "sword1";

    public setArmor (newArmor : string) : void {
        this.armorName = newArmor;
    }

    public setWeapon (newWeapon : string) : void {
        this.weaponName = newWeapon;
    }
}
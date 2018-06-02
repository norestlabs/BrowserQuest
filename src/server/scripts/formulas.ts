import * as Utils from "@common/utils";

/**
 * Calculates the damage resulted from an attack with given weapon to a given armor.
 * @param weaponLevel The level of the attacking weapon.
 * @param armorLevel The level of the defending armor.
 */
export let dmg = function (weaponLevel : number, armorLevel : number) : number {
    let dealt = weaponLevel * Utils.randomInt(5, 10),
        absorbed = armorLevel * Utils.randomInt(1, 3),
        dmg =  dealt - absorbed;
    
    //console.log("abs: "+absorbed+"   dealt: "+ dealt+"   dmg: "+ (dealt - absorbed));
    if (dmg <= 0) {
        return Utils.randomInt(0, 3);
    }
    else {
        return dmg;
    }
}

/**
 * Returns the amount of HP the character will have with given armor.
 * @param armorLevel The level of the armor.
 */
export let hp = function (armorLevel : number) : number {
    let hp = 80 + ((armorLevel - 1) * 30);
    return hp;
}
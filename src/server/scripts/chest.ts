import * as Utils from "@common/utils";
import Types from "@common/gametypes";
import * as _ from "underscore";
import Item from "./item";

export default class Chest extends Item {

    items : number[];

    constructor (id : string, x : number, y : number) {
        super(id, Types.Entities.Chest, x, y);
    }
    
    setItems (items : number[]) : void {
        this.items = items;
    }
    
    getRandomItem () : number | null {
        let nbItems = _.size(this.items), item : number = null;

        if (nbItems > 0) {
            item = this.items[Utils.random(nbItems)];
        }
        return item;
    }
}
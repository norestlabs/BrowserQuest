import Entity from "./entity";
import Types from "@common/gametypes";

export default class Npc extends Entity {
    constructor(id : string, kind : Types.Entities, x : number, y : number) {
        super(id, "npc", kind, x, y);
    }
}
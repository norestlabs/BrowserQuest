import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Loader implements Component {
    static c_name : string = "Loader";
	static c_id : Bitfield;
    enabled = false;

    entities : number[] = [];
    callback : () => void = null;

    public addLoadable (id : number) : void {
        this.entities.push(id);
    }

    public clearLoadables () : void {
        this.entities = [];
    }

    public start () : void {
        this.enabled = true;
    }
    
    public stop () : void {
        this.clearLoadables();
        this.enabled = false;
        if (this.callback !== null) this.callback();
    }

}
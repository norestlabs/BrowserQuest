import Component from "@engine/Component";
import { Bitfield } from "@common/bitfield";

export default class Health implements Component {
    static c_name : string = "Health";
	static c_id : Bitfield;
    enabled = true;

    hp : number = 0;
    private _isDead : boolean = false;
    public get isDead () : boolean {
        return this._isDead;
    }
    maxhp : number = 0;

    isDying : boolean = false;

    public setmaxHitPoints (value : number) : void {
        this.hp = value;
        this.maxhp = value;
    }

    public die () : void {
        this.isDying = false;
        this._isDead = true;
    }

    public setAlive () : void {
        this.isDying = false;
        this._isDead = false;
        this.hp = this.maxhp;
    }
}
import Component, { NodeType, ComponentNode } from "@engine/Component";
import { Bitfield, createEmptyBitfield, addToBitfield, MaskTest } from "@common/bitfield";

export default class Entity {
    private _id : number = -1;
    public get id () {
        return this._id;
    }
    public set id (value : number) {
        this._id = value;
    }
    private _name : string = "";
    public get name () {
        return this._name;
    }
    private subentities : Array<Entity> = [];
    private _tag : string | null = null;
    public get tag () : string | null {
        return this._tag;
    }
    public set tag (value : string | null) {
        this._tag = value;
    }
    
    private _components : { [name : string] : Component } = {};
    private bits : Bitfield = createEmptyBitfield();
    public get components () {
        return this._components;
    }
    public clearComponents () {
        this._components = {};
    }

    private parent : number = -1;
    public getParent () : number {
        return this.parent;
    }
    public hasParent () : boolean {
        return this.parent !== -1;
    }

    constructor (name : string, parent : Entity | null) {
        this._name = name;
        if (parent !== null)
            parent.addEntity(this);
    }

    public addComponent <T extends Component> (type: { new(): T; c_name : string, c_id : Bitfield } ) : T {
        let c = new type();
        this._components[type.c_name] = c;
        addToBitfield(this.bits, type.c_id);
        return c as T;
    }

    /**
     * Tries to get the requested component. Returns **null** if couldn't find the component of given type.
     * @param type The type of the Component.
     */
    public getComponent <T extends Component> (type: { new(): T; c_name : string } ) : T | null {
        if (type.c_name in this._components) return this._components[type.c_name] as T;
        else return null;
    }

    public hasComponents (bits : Bitfield) : boolean {
        return MaskTest(this.bits, bits);
    }

    public getComponentNode <T extends ComponentNode> (bits : Bitfield) : NodeType<T> | null {
        if (this.hasComponents(bits)) return this.components as NodeType<T>;
        else return null;
    }

    public addEntity (e : Entity) : void {
        e.parent = this._id;
        this.subentities.push(e);
    }

    public removeEntity (e : Entity) : void {
        // If contains
        let index = -1;
        for (let i = 0, len = this.subentities.length; i < len; ++i) {
            if (this.subentities[i].id === e.id) {
                this.subentities[i].parent = -1;
                index = i;
                break;
            }
        }
        if (index != -1) {
            this.subentities.splice(index, 1);
        }
    }

    public getChildren () : Entity[] {
        return this.subentities;
    }

    public getChild (name : string) : Entity | null {
        for (let i = 0, len = this.subentities.length; i < len; ++i) {
            if (this.subentities[i]._name === name) return this.subentities[i];
        }
        return null;
    }

    public getChildByIndex (index : number) : Entity | null {
        if (this.subentities.length > index) return this.subentities[index];
        else return null;
    }

    public toString () : string {
        return `|${this.id}.${this.name}|`;
    }

    public initializeFromJSON (data : string) : void {
        let json : { [component : string] : { [attribute : string] : string } } = JSON.parse(data);
        for (let cname in json) {
            let component = this._components[cname];
            if (component != null) {
                for (let aname in json[cname]) {
                    if (component.hasOwnProperty(aname)) {
                        (<any>component)[aname] = json[cname][aname];
                    }
                }
            }
        }
    }
}
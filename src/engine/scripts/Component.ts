import { Bitfield, MaskTest, createEmptyBitfield, addToBitfield } from "@common/bitfield";

export default abstract class Component {
    static c_name : string;
    static c_id : Bitfield;
    enabled : boolean;
}

export interface ComponentType<T extends Component> {
    c_name : string;
    c_id : Bitfield;
    new(): T;
}

export interface GenericComponentType {
    c_name : string;
    c_id : Bitfield;
    new(): Component;
}

export type ComponentValue<T> = T extends ComponentType<infer U> ? U : T;

export let isComponent = function <T extends Component> (test : Component, c : ComponentType<T>) : test is T {
    return MaskTest((<GenericComponentType>test.constructor).c_id, c.c_id);
}

export interface ComponentNode {
    [index : string] : GenericComponentType
}
export type NodeType<U extends ComponentNode> = {
    [P in keyof U] : ComponentValue<U[P]>;
};

export let createBitfield = function (...components : GenericComponentType[]) : Bitfield {
    let bitfield : Bitfield = createEmptyBitfield();

    for (let i = 0, len = components.length; i < len; ++i) {
        let c = components[i];
        addToBitfield(bitfield, c.c_id);
    }
    return bitfield;
}
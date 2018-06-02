export type Bitfield = {
    _0 : number,
    _1 : number,
    _2 : number
};

export let createEmptyBitfield = function () : Bitfield {
    return {
        _0 : 0,
        _1 : 0,
        _2 : 0
    }
};

export let MaskTest = function (b : Bitfield, mask : Bitfield) {
    return (b._0 & mask._0) === mask._0 && 
        (b._1 & mask._1) === mask._1 && 
        (b._2 & mask._2) === mask._2;
}

let componentBitfieldCounter = 0;
export let getNextComponentBitfield = function () : Bitfield {
    let b = createEmptyBitfield();
    if (componentBitfieldCounter < 32) {
        b._0 = 1 << componentBitfieldCounter;
    }
    else if (componentBitfieldCounter < 64) {
        b._1 = 1 << componentBitfieldCounter - 32;
    }
    else if (componentBitfieldCounter < 96) {
        b._2 = 1 << componentBitfieldCounter - 64;
    }
    componentBitfieldCounter++;

    return b;
}

export let addToBitfield = function (b : Bitfield, newBits : Bitfield) {
    b._0 |= newBits._0;
    b._1 |= newBits._1;
    b._2 |= newBits._2;
}
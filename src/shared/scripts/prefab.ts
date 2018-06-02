export default interface Prefab {
    name : string,
    dir : string,
    tag : string,
    components : { [ component : string ] : { [ attribute : string ] : string } },
    parent : string,
    topParent: string,
    children : ChildPrefab[]
}

export interface ChildPrefab {
    name : string,
    path : string,
    tag : string,
    components : { [ component : string ] : { [ attribute : string ] : string } },
    children : ChildPrefab[],
    ref : string
}

export function isPrefabChild (object : Prefab | ChildPrefab) : object is ChildPrefab {
    return "ref" in object;
}
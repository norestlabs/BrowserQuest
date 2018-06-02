import * as Components from "@components/Components";
import Component, {ComponentType, GenericComponentType, createBitfield, ComponentNode, NodeType} from "@engine/Component";
import EntityIDGenerator from "@engine/EntityIDGenerator";
import DoublyLinkedList from "@lib/DoublyLinkedList";
import Entity from "@engine/Entity";
import * as _ from "underscore";
import GameTypes from "@common/gametypes";
import Prefab, {ChildPrefab} from "@common/prefab";
import * as Logger from "@lib/Logger";
import { getNextComponentBitfield } from "@common/bitfield";
import { Scene } from "@engine/ecs";

for (let key in Components) {
    (<typeof Component>(<any>Components)[key]).c_id = getNextComponentBitfield();
}

/**
 * Creates and sets up entities with their own settings.
 */
export module EntityFactory {

    export let prefabs : { [name : string] : Prefab } = {};
    export let arePrefabsLoaded = false;

    export function getTypedValue (value : string, key : string, source : any) {
        // Get type
        let type = typeof source[key];
        let tvalue : any = undefined;
        if (type === "boolean") tvalue = value === "true";
        else if (type === "number") tvalue = parseFloat(value);
        else if (type === "string") tvalue = value;
        return tvalue;
    }

    export function initializeFromPrefab (entity : Entity) {
        let prefab = prefabs[entity.name];
        if (prefab == null) return;
        _.each(prefab.components, (value, cname) => {
            let component = <any>entity.getComponent((<any>Components)[cname]);
            if (component != null) {
                _.each(value, (v, key) => {
                    let tvalue = getTypedValue(v, key, component);
                    if (tvalue != undefined && component.hasOwnProperty(key)) {
                        component[key] = tvalue;
                    }
                });
            }
        });
    }

    function getReferencedPrefab (ref : string) : Prefab | null {
        if (ref === "") return null;
        else {
            let path = ref.split("/");
            let prefabName = path[path.length - 1];
            if (prefabName in prefabs) return prefabs[prefabName];
            else return null;
        }
    }

    function setupPrefab (prefab : Prefab | ChildPrefab) {
        for (let i = 0, len = prefab.children.length; i < len; ++i) {
            let child = prefab.children[i];
            if (child.ref !== "") {
                let reference = getReferencedPrefab(child.ref);
                if (reference) {
                    for (let componentName in reference.components) {
                        child.components[componentName] = {};
                        for (let attributeName in reference.components[componentName]) {
                            child.components[componentName][attributeName] = reference.components[componentName][attributeName];
                        }
                    }
                    for (let i = 0, len = reference.children.length; i < len; ++i) {
                        let newChild : ChildPrefab = {
                            name : reference.children[i].name,
                            children : [],
                            components : {},
                            ref : reference.children[i].ref,
                            tag : reference.children[i].tag,
                            path : reference.children[i].path,
                        }
                        for (let componentName in reference.children[i].components) {
                            newChild.components[componentName] = {};
                            for (let attributeName in reference.children[i].components[componentName]) {
                                newChild.components[componentName][attributeName] = reference.children[i].components[componentName][attributeName];
                            }
                        }
                        child.children.push(newChild);
                    }
                    setupPrefab(child);
                }
            }
        }
    }

    function setupPrefabs () {
        for (let prefabName in prefabs) {
            let prefab = prefabs[prefabName];
            setupPrefab(prefab);
        }
    }

    export function initPrefabs (readyCallback : () => void) {
        let url = `${document.location.protocol}//${document.location.host}/prefabs`;
        $.get(url, function (data) {
            prefabs = data;
            setupPrefabs();
            arePrefabsLoaded = true;
            readyCallback();
        }, 'json');
    }

    export function setupScene (scene : Scene) : void {
        setupPrefab(scene.world);
    }
}

module EntityManager {
    let entities_c : { [component : string] : DoublyLinkedList<number> } = {};
    let entities_e : { [id : string] : Entity } = {};
    let entities_tag : { [tag : string] : number } = {};
    
    // Create World
    let world : Entity = new Entity("World", null);
    world.id = EntityIDGenerator();
    world.addComponent(Components.Transform);
    entities_e[world.id] = world;

    for (let c in Components) {
        entities_c[c] = new DoublyLinkedList((a : number, b : number) => a === b);
    }

    export let getEntitiesWithComponent = function <T extends Component> (type : ComponentType<T>) : DoublyLinkedList<number> {
        return entities_c[type.c_name];
    }

    export let getEntityWithName = function (n : string) : Entity | null {
        for (let id in entities_e) {
            let entity = entities_e[id];
            if (entity.name === n) return entity;
        }
        return null;
    }

    export let getEntitiesWithName = function (n : string) : Entity[] {
        let entities : Entity[] = [];
        for (let id in entities_e) {
            let entity = entities_e[id];
            if (entity.name === n) entities.push(entity);
        }
        return entities;
    }

    export let forEachEntityWithComponent = function <T extends Component> (type : ComponentType<T>, callback : (entity : Entity, component : T) => void) : void {
        let current = entities_c[type.c_name].First, next;
        let entity : Entity | null;
        while (current !== null) {
            next = current.next;
            entity = getEntityWithID(current.value);
            if (entity !== null)
                callback(entity, entity.getComponent(type));
            current = next;
        }
    }

    export let forEachEntityWithComponentNode = function <U extends ComponentNode> (main : GenericComponentType, callback : (entity : Entity, components : NodeType<U>) => void, ...components : GenericComponentType[]) : void {
        let current = entities_c[main.c_name].First, next;
        let entity : Entity | null;
        let bitfield = createBitfield(...components);
        while (current !== null) {
            next = current.next;
            entity = getEntityWithID(current.value);
            if (entity !== null) {
                if (entity.hasComponents(bitfield)) {
                    // Cheat
                    callback(entity, entity.components as NodeType<U>);
                }
            }
            current = next;
        }
    }

    export let getFirstEntityWithComponent = function <T extends Component> (c : ComponentType<T>) : Entity | null {
        let first = entities_c[c.c_name].First;
        if (first !== null) {
            let e = getEntityWithID(first.value);
            if (e !== null) return e;
        }
        Logger.log(`No Entity with Component ${c.c_name} was found.`, Logger.LogType.Warn);
        return null;
    }

    export let getFirstComponent = function <T extends Component> (c : ComponentType<T>) : T | null {
        let first = entities_c[c.c_name].First;
        if (first !== null) {
            let e = getEntityWithID(first.value);
            if (e !== null) return e.getComponent(c);
        }
        Logger.log(`Component ${c.c_name} wasn't found.`, Logger.LogType.Warn);
        return null;
    }

    export let getEntityWithTag = function (tag : string) : Entity | null {
        if (tag in entities_tag) return getEntityWithID(entities_tag[tag]);
        else {
            Logger.log(`Entity with Tag ${tag} wasn't found.`, Logger.LogType.Warn);
            return null;
        }
    }

    export let setEntityTag = function (entity : Entity, tag : string) : void {
        if (tag != null) {
            entity.tag = tag;
            entities_tag[entity.tag] = entity.id;
        }
    }

    export let getEntityWithID = function (id : string | number) : Entity | null {
        if (id in entities_e) return entities_e[id];
        else {
            Logger.log(`Entity with ID ${id} wasn't found.`, Logger.LogType.Warn);
            return null;
        }
    }

    export let createEntityFromPrefab = function (prefab : Prefab | ChildPrefab, parent : Entity) : Entity {
        let e = new Entity(prefab.name, parent);
        e.id = EntityIDGenerator();

        if (prefab != null) {
            _.each(prefab.components, (value, cname) => {
                let component = <any>e.addComponent((<any>Components)[cname]);
                if (component != null) {
                    _.each(value, (v, key) => {
                        let tvalue = EntityFactory.getTypedValue(v, key, component);
                        if (tvalue != undefined && component.hasOwnProperty(key)) {
                            component[key] = tvalue;
                        }
                    });
                    entities_c[cname].Add(e.id);
                }
            });
            setEntityTag(e, prefab.tag);

            for (let i = 0, len = prefab.children.length; i < len; ++i) {
                let child = prefab.children[i];
                createEntityFromPrefab(child, e);
            }
        }

        entities_e[e.id] = e;

        return e;
    }

    export let createEntityFromLoadedPrefab = function (entityName : string, parent : Entity | null, kind? : GameTypes.Entities, id? : number, name? : string) : Entity {
        let e = new Entity(entityName, parent !== null ? parent : world);
        e.id = EntityIDGenerator();

        let prefab = EntityFactory.prefabs[entityName];
        if (prefab != null) {
            _.each(prefab.components, (value, cname) => {
                let component = <any>e.addComponent((<any>Components)[cname]);
                if (component != null) {
                    _.each(value, (v, key) => {
                        let tvalue = EntityFactory.getTypedValue(v, key, component);
                        if (tvalue != undefined && component.hasOwnProperty(key)) {
                            component[key] = tvalue;
                        }
                    });
                    entities_c[cname].Add(e.id);
                }
            });
            setEntityTag(e, prefab.tag);

            for (let i = 0, len = prefab.children.length; i < len; ++i) {
                let child = prefab.children[i];
                createEntityFromPrefab(child, e);
            }
        }

        let identifiable = e.getComponent(Components.Identifiable);
        if (identifiable !== null && id) {
            identifiable.id = id;
            if (name !== undefined) identifiable.name = name;
        }

        entities_e[e.id] = e;

        return e;
    }

    export let reloadEntity = function (entity : Entity) : void {
        let prefab = EntityFactory.prefabs[entity.name];
        if (prefab != null) {
            _.each(prefab.components, (value, cname) => {
                let component = <any>entity.getComponent((<any>Components)[cname]);
                if (component !== null) {
                    _.each(value, (v, key) => {
                        let tvalue = EntityFactory.getTypedValue(v, key, component);
                        if (tvalue != undefined && component.hasOwnProperty(key)) {
                            component[key] = tvalue;
                        }
                    });
                }
            });

            let children = entity.getChildren();
            for (let i = 0, len = children.length; i < len; ++i) {
                reloadEntity(children[i]);
            }
        }
    }

    export let deleteEntity = function (entity : Entity) : boolean {
        if (entity == null) return false;

        for (let cname in entity.components) {
            let array = entities_c[cname];
            array.Remove(entity.id);
        }
        entity.clearComponents();

        // Delete children
        let children = entity.getChildren();
        for (let i = 0, len = children.length; i < len; ++i) {
            deleteEntity(children[i]);
            entity.removeEntity(children[i]);
        }

        if (entity.hasParent()) {
            let parent = getEntityWithID(entity.getParent());
            if (parent != null) {
                parent.removeEntity(entity);
            }
        }
        if (entity.tag !== null && entity.tag in entities_tag) {
            delete entities_tag[entity.tag];
        }
        delete entities_e[entity.id];
        return true;
    }
}

export default EntityManager;
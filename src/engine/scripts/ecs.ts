/**
 * ecs.ts
 * Creates the World System and serves as an intermediate between the code and the Entity-Component-System,
 * by wrapping the Awake, Start, Update and BroadcastEvent methods.
 * Also contains the definition of all GameEvents.
 */

import {System} from "@engine/System";
import EntityManager, { EntityFactory } from "@engine/EntityManager";

import WorldSystem from "@systems/WorldSystem";
import "@systems/Systems";

import * as Logger from "@lib/Logger";

import { GameEventsReturnType } from "@lib/GameEvents";
import Prefab from "@common/prefab";
import * as Utils from "@utils/utils";

let worldSystem = new WorldSystem();

export let systems : { [order : number] : Array<System> } = [];
export let orders : Array<number> = [];

export let Awake = function (sceneName : string) {
    EntityFactory.initPrefabs(function () {
        // Load scene
        $.getJSON(`${Utils.getUrl()}/scene`, { scene : sceneName }, loadScene);
    });
}
let loadScene = function (scene : Scene) {
    EntityFactory.setupScene(scene);
    EntityManager.createEntityFromPrefab(scene.world, null);
    worldSystem.awake();
    requestAnimationFrame(Start);
}

export let Start = function () {
    Logger.log("Game loop started.", Logger.LogType.Info);
    worldSystem.start();
    requestAnimationFrame(Update);
}

export let Update = function () {
    worldSystem.update();
    requestAnimationFrame(Update);
}

export let BroadcastEvent = function (event : GameEventsReturnType) {
    worldSystem.forEach((value : System) => {
        if (value.onNotify)
            value.onNotify(event);
    });
}

export interface Scene {
    name : string;
    id : number;

    world : Prefab;
}
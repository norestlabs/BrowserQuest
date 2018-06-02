import { System, SystemPool} from "@engine/System";
import Entity from "@engine/Entity";
import { BroadcastEvent, systems, orders } from "@engine/ecs";
import * as Time from "@lib/Time";
import * as Components from "@components/Components";
//import * as GameState from "@lib/GameState";
import EntityManager from "@engine/EntityManager";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent} from "@lib/GameEvents";

export default class WorldSystem implements System {
    s_name = "WorldSystem";
    enabled = true;

    public awake () : void {
        // Order the systems according to their SystemOrder
        for (let s in SystemPool) {
            let system = SystemPool[s][0];
            let order = SystemPool[s][1];

            if (!systems[order]) systems[order] = [];
            systems[order].push(new system());

            if (orders.indexOf(order) == -1)
                orders.push(order);
        }

        orders.sort((a : number, b : number) => {
            return a - b;
        });

        // Executes Awake
        for (let i = 0; i < orders.length; ++i) {
            let ssystems = systems[orders[i]];
            for (let j = 0; j < ssystems.length; ++j) {
                if (ssystems[j].enabled && ssystems[j].awake) ssystems[j].awake();
            }
        }
    }

    public start () : void {
        for (let i = 0; i < orders.length; ++i) {
            let ssystems = systems[orders[i]];
            for (let j = 0; j < ssystems.length; ++j) {
                if (ssystems[j].enabled && ssystems[j].start) ssystems[j].start();
            }
        }
    }

    public update () : void {
        Time.update();
        //if (GameState.currentStatus !== GameState.Status.Started) return;
        for (let i = 0; i < orders.length; ++i) {
            let ssystems = systems[orders[i]];
            for (let j = 0; j < ssystems.length; ++j) {
                if (ssystems[j].enabled && ssystems[j].update) ssystems[j].update();
            }
        }
    }

    public forEach (callback : (system : System) => void) : void {
        for (let i = 0; i < orders.length; ++i) {
            let ssystems = systems[orders[i]];
            for (let j = 0; j < ssystems.length; ++j) {
                callback(ssystems[j]);
            }
        }
        callback(this);
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Character_Remove)) {
            if (params.character.name !== "Player") {
                let identifiable = params.character.getComponent(Components.Identifiable);
                Logger.log(identifiable.id + " was removed", Logger.LogType.Info);
                this.removeEntity(params.character);
            }
        }
        else if (isEvent(params, GameEvents.Player_Loot)) {
            this.removeEntity(params.item);
        }
        else if (isEvent(params, GameEvents.Client_Destroy) || isEvent(params, GameEvents.Client_OnObsolete)) {
            this.removeEntity(params.entity);
        }
        else if (isEvent(params, GameEvents.Client_OnDespawn)) {
            if (params.entity.getComponent(Components.Identifiable).isItem) {
                this.removeEntity(params.entity);
            }
        }
    }

    private removeEntity (entity : Entity) : void {
        if (entity != null) {
            BroadcastEvent(GameEvents.Entity_Deleted.params(entity));
            EntityManager.deleteEntity(entity);
            Logger.log(`Entity deleted ${entity.toString()}`, Logger.LogType.Info);
        }
        else {
            Logger.log("Cannot remove entity because it's null.", Logger.LogType.Error);
        }
    }
}
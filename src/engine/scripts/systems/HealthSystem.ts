import { System, registerSystem} from "@engine/System";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import {Identifiable, Transform, Health, EntityGrids} from "@components/Components";
import * as Logger from "@lib/Logger";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class HealthSystem implements System {

    s_name = "HealthSystem";
    enabled = true;

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Character_Death)) {
            let identifiable = params.character.getComponent(Identifiable);
            Logger.log(identifiable.id + " is dead", Logger.LogType.Info);
    
            if (identifiable.isMob) {
                let transform = params.character.getComponent(Transform);
                // Keep track of where mobs die in order to spawn their dropped items
                // at the right position later.
                EntityManager.getEntityWithTag("Game").getComponent(EntityGrids).deathpositions[identifiable.id] = transform.GridPosition;
            }
    
            params.character.getComponent(Health).isDying = true;
        }
        else if (isEvent(params, GameEvents.Animation_Ended)) {
            if (params.animationName === "death") {
                BroadcastEvent(GameEvents.Character_Remove.params(params.origin));
            }
        }
    }
}

registerSystem(HealthSystem);
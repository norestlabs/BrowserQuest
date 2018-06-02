import { System, registerSystem} from "@engine/System";
import GameTypes from "@common/gametypes";
import {Position2D} from "@common/position";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import {BroadcastEvent} from "@engine/ecs";
import {Talk, Identifiable, MouseInput, Talkable} from "@components/Components";
import { GameEvents, isEvent} from "@lib/GameEvents";


export default class TalkSystem implements System {

    s_name = "TalkSystem";
    enabled = true;

    public start () : void {
        EntityManager.forEachEntityWithComponent(Talk, this.initEntity.bind(this));
    }

    private initEntity (entity : Entity, talk : Talk) : void {
        let dialogs = Talk.NpcTalk[GameTypes.getKindAsString(entity.getComponent(Identifiable).kind)];
        talk.count = dialogs.length;
        talk.dialogs = dialogs;
    }

    /**
     *
     */
    private makeNpcTalk(npc : Entity) : void {
        if (npc) {
            EntityManager.getEntityWithTag("Mouse").getComponent(MouseInput).previousClickPosition = new Position2D(undefined, undefined);
            let talk = npc.getComponent(Talk);
            let talkable = npc.getComponent(Talkable);

            let msg = talk.getChat();
            if (msg) {
                talkable.message = msg;
                talkable.time = 5000;
            }

            BroadcastEvent(GameEvents.NPC_Talk.params(npc, msg));
        }
    }

    public onNotify (params : any) : void {
        if (isEvent(params, GameEvents.Follow_ReachedTarget)) {
            let target = params.target;
            if (target.getComponent(Identifiable).isNpc) {
                this.makeNpcTalk(target);
            }
        }
    }
    
}

registerSystem(TalkSystem);
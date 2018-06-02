import { System, registerSystem, SystemOrder} from "@engine/System";
import * as Graphics from "@lib/Graphics";
import EntityManager from "@engine/EntityManager";
import {FlickeringFix} from "@components/Components";
import * as Time from "@lib/Time";

export default class PreventFlickeringSystem implements System {

    s_name = "PreventFlickeringSystem";
    enabled = true;

    public awake () : void {
        if (Graphics.isDesktop) this.enabled = false;
    }

    public update () : void {
        let game = EntityManager.getEntityWithTag("Game");
        let fix = game.getComponent(FlickeringFix);
        fix.currentTime += Time.deltaTime;
        if (fix.currentTime >= fix.duration) {
            Graphics.backgroundContext.fillRect(0, 0, 0, 0);
            Graphics.context.fillRect(0, 0, 0, 0);
            Graphics.foregroundContext.fillRect(0, 0, 0, 0);
            fix.currentTime = 0;
        }
    }

    
}

registerSystem(PreventFlickeringSystem, SystemOrder.PreRender);
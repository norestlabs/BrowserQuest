import { System, registerSystem} from "@engine/System";
import Entity from "@engine/Entity";
import EntityManager from "@engine/EntityManager";
import { Loader, Loadable } from "@components/Components";


export default class LoadSystem implements System {

    s_name = "LoadSystem";
    enabled = true;

    public update () : void {
        EntityManager.forEachEntityWithComponent(Loader, this.updateLoader);
    }

    // TODO: Loader only looks at its children
    private updateLoader = function (entity : Entity, loader : Loader) : void {
        if (loader.enabled) {
            let areAllLoaded = true;
            for (let i = 0, len = loader.entities.length; i < len; ++i) {
                let loadableEntity = EntityManager.getEntityWithID(loader.entities[i]);
                let loadable = loadableEntity.getComponent(Loadable);
                if (loadable !== null && !loadable.isLoaded) {
                    areAllLoaded = false;
                }
            }
            if (areAllLoaded) {
                loader.stop();
            }
        }
    }
}

registerSystem(LoadSystem);
import Component from "@engine/Component";
import * as Components from "@components/Components";
import * as _ from "underscore";
import Assets from "@utils/assets";
import Prefab, { ChildPrefab, isPrefabChild } from "@common/prefab";
import Logger from "@common/logger";

export default class ComponentList {
    private components : { [index : string] : { new(): Component; c_name : string } } = Components;
    private componentsInstanced : { [index : string] : Component } = {};
    private componentListElement : JQuery<HTMLElement> = $("#components-list");

    private componentListMemberTemplate : (...data : any[]) => string = null;

    private componentClickCallback : (filename : string) => void = null;

    public isReady : boolean = false;

    private allowedTypes = ["Boolean", "Number", "Position2D", "String", "Number"];

    constructor () {
        let self = this;
        $.get("../../" + Assets.PathToAsset("html/componentListMemberTemplate.html"), function (data) {
            self.componentListMemberTemplate = _.template(data);
            self.onTemplateLoaded();
            self.isReady = true;
        }, 'html');
        for (let cName in this.components) {
            this.componentsInstanced[cName] = new this.components[cName]();
        }
    }

    public checkPrefabs (prefabs : { [index : string] : Prefab }, saveCallback : (p : Prefab) => void) {
        for (let prefabName in prefabs) {
            this.checkPrefab(prefabs[prefabName], saveCallback);
        }
    }

    private checkPrefab (prefab : Prefab | ChildPrefab, saveCallback : (p : Prefab) => void) : boolean {
        let update = false;
        for (let pComponent in prefab.components) {
            let original = <any>this.componentsInstanced[pComponent];
            for (let pAttribute in prefab.components[pComponent]) {
                if (!original.hasOwnProperty(pAttribute)) {
                    Logger.log(`Attribute ${pAttribute} doesn't exist in component ${pComponent}, but is in prefab ${prefab.name}.`, Logger.LogType.Error);
                    if (confirm(`Attribute ${pAttribute} doesn't exist in component ${pComponent}, but is in prefab ${prefab.name}. Do you wish to remove it?`)) {
                        delete prefab.components[pComponent][pAttribute];
                        update = true;
                        Logger.log(`Attribute ${pAttribute} was removed from component ${pComponent} of prefab ${prefab.name}.`, Logger.LogType.Info);
                    }
                }
            }
            for (let attr in original) {
                if (original.hasOwnProperty(attr)) {
                    let t = original[attr] == null ? "object" : original[attr].constructor.name;
                    if (this.isAllowedType(t) && !prefab.components[pComponent].hasOwnProperty(attr)) {
                        Logger.log(`Attribute ${attr} doesn't exist in component ${pComponent} of prefab ${prefab.name}.`, Logger.LogType.Error);
                        if (confirm(`Attribute ${attr} doesn't exist in component ${pComponent} of prefab ${prefab.name}. Do you wish to add it?`)) {
                            prefab.components[pComponent][attr] = original[attr].toString();
                            Logger.log(`Attribute ${attr} was added to component ${pComponent} of prefab ${prefab.name}.`, Logger.LogType.Info);
                            update = true;
                        }
                    }
                }
            }
            for (let i = 0, len = prefab.children.length; i < len; ++i) {
                let child = prefab.children[i];
                update = update || this.checkPrefab(child, null);
            }
        }

        if (update && saveCallback !== null && !isPrefabChild(prefab)) {
            saveCallback(prefab);
        }

        return update;
    }

    public setComponentClickCallback (callback : (filename : string) => void) {
        this.componentClickCallback = callback;
    }
    
    public addComponent (componentName : string, prefab : Prefab | ChildPrefab) {
        if (componentName in prefab.components) return false;

        prefab.components[componentName] = {};
    
        // Add to prefab
        let component : any = this.componentsInstanced[componentName];
        for (let attr in component) {
            if (component.hasOwnProperty(attr)) {
                let t = component[attr] == null ? "object" : component[attr].constructor.name;
                if (this.isAllowedType(t)) {
                    prefab.components[componentName][attr] = component[attr].toString();
                }
            }
        }
        return true;
    }

    public isAllowedType (t : string) {
        return _.contains(this.allowedTypes, t);
    }

    public getAttributeType (componentName : string, attributeName : string) : string {
        let component = <any>this.componentsInstanced[componentName];
        return component[attributeName] == null ? "object" : component[attributeName].constructor.name;
    }

    private onTemplateLoaded () {
        this.componentListElement.empty();
        for (let cs in this.components) {
            let template = this.componentListMemberTemplate({name : cs});
            this.componentListElement.append(template);
        }
        let self = this;
        let buttons = this.componentListElement.find("[id^=component-list-]");
        buttons.addClass("disabled");
        buttons.on("click", function () {
            if (!$(this).hasClass("disabled")) {
                let componentName = $(this).text();
                if (self.componentClickCallback !== null)
                    self.componentClickCallback(componentName);
                $(this).addClass("disabled");
            }
        });
    }
}
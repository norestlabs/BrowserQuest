import Prefab, { ChildPrefab } from "@common/prefab";
import * as _ from "underscore";
import Assets from "@utils/assets";

export default class ComponentViewer {
    // Like previously
    public enabled : boolean = false;

    private viewerElement : JQuery<HTMLElement> = $("#viewer");

    private componentTemplate : (...data : any[]) => string = null;

    private componentClickCallback : (filename : string) => void = null;

    public isReady : boolean = false;

    constructor () {
        let self = this;
        $.get("../../" + Assets.PathToAsset("html/childTemplate.html"), function (data) {
            self.componentTemplate = _.template(data);
            self.isReady = true;
        }, 'html');
    }

    public setComponentClickCallback (callback : (componentName : string) => void) {
        this.componentClickCallback = callback;
    }

    public show (entity : Prefab | ChildPrefab) {
        this.viewerElement.empty();
        for (let componentName in entity.components) {
            this.viewerElement.append(this.componentTemplate({name : componentName}));
        }
        let self = this;
        this.viewerElement.find("[id^=viewer-]").on("click", function () {
            let componentName = $(this).find("p").text();
            if (self.componentClickCallback)
                self.componentClickCallback(componentName);
        });
    }
}
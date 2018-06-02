import Prefab, {ChildPrefab} from "@common/prefab";
import * as _ from "underscore";
import Assets from "@utils/assets";

export default class ChildrenViewer {
    // Like explorer
    public enabled : boolean = false;

    private viewerElement : JQuery<HTMLElement> = $("#viewer");

    private childTemplate : (...data : any[]) => string = null;

    private childClickCallback : (filename : string) => void = null;

    public isReady : boolean = false;

    constructor () {
        let self = this;
        $.get("../../" + Assets.PathToAsset("html/childTemplate.html"), function (data) {
            self.childTemplate = _.template(data);
            self.isReady = true;
        }, 'html');
    }

    public setChildClickCallback (callback : (childName : string) => void) {
        this.childClickCallback = callback;
    }

    public show (parent : Prefab | ChildPrefab) {
        this.viewerElement.empty();
        for (let i = 0, len = parent.children.length; i < len; ++i) {
            let child = parent.children[i];
            this.viewerElement.append(this.childTemplate({name : child.name}))
        }
        // To create new child
        this.viewerElement.append(this.childTemplate({name : "..new.."}));
        let self = this;
        this.viewerElement.find("[id^=viewer-]").on("click", function (event) {
            let childName = $(this).find("p").text();
            if (self.childClickCallback)
                self.childClickCallback(childName);
        });
    }
}
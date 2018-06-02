import Prefab, { ChildPrefab } from "@common/prefab";
import * as _ from "underscore";
import Assets from "@utils/assets";

export default class ExplorerManager {
    public currentDirectory : string = "";
    public currentFile : string = null;
    public currentPrefab : Prefab = null;
    public selectedFile : JQuery<HTMLElement> = null;

    public currentChild : ChildPrefab = null;

    public explorerElement : JQuery<HTMLElement> = $("#explorer");

    public prefabs : { [name : string] : Prefab } = null;

    private dirTemplate : (...data : any[]) => string = null;
    private fileTemplate : (...data : any[]) => string = null;

    private fileClickCallback : (filename : string) => void = null;

    public isReady : boolean = false;
    public refMode : boolean = false;

    constructor (p : { [name : string] : Prefab }) {
        this.prefabs = p;
        let self = this;
        $.get("../../" + Assets.PathToAsset("html/dirTemplate.html"), function (data) {
            self.dirTemplate = _.template(data);
        }, 'html');
        $.get("../../" + Assets.PathToAsset("html/fileTemplate.html"), function (data) {
            self.fileTemplate = _.template(data);
            self.isReady = true;
        }, 'html');
    }

    public getCurrentPrefab () {
        return this.currentPrefab;
    }

    public isPrefabInDir (prefab : Prefab, dir : string) {
        return prefab.dir === dir;
    }

    public isDirInDir (test : string, dir : string) {
        if (test.substring(0, dir.length) === dir) {
            // Check if is direct child
            let sub = test.substring(dir.length + 1);
            let split = sub.split("/");
            let n = split.length;
            return n === 1 && split[0] !== "";
        }
        return false;
    }

    public setFileClickCallback (callback : (filename : string) => void) {
        this.fileClickCallback = callback;
    }

    public createPrefab (n : string) : Prefab {
        let prefab : Prefab = {
            name : n,
            tag : "",
            topParent : "",
            parent : "",
            dir : this.currentDirectory,
            children : [],
            components : {}
        }
        let self = this;
        this.explorerElement.append(this.fileTemplate({name : n}));
        this.explorerElement.find("#explorer-file-" + n).on("click", function () {
            self.unselectFile();
            let filename = $(this).find("p").text();
            self.currentFile = filename;
            self.currentPrefab = self.prefabs[self.currentFile];
            self.selectFile($(this));
            // Open file in entity panel
            if (self.fileClickCallback !== null) {
                self.fileClickCallback(filename);
            }
        });
        this.prefabs[n] = prefab;
        this.currentFile = n;
        this.currentPrefab = prefab;

        return prefab;
    }

    public selectFile (element : JQuery<HTMLElement>) {
        if (!element.parent().hasClass("file-selected")) {
            element.parent().addClass("file-selected");
        }
        this.selectedFile = element;
    }

    public unselectFile () {
        if (this.selectedFile !== null) {
            this.selectedFile.parent().removeClass("file-selected");
            this.selectedFile = null;
        }
    }

    public loadCurrentDir () {
        this.explorerElement.empty();
        let dirs : string[] = [];
        let files : string[] = [];
        for (let p in this.prefabs) {
            if (this.isDirInDir(this.prefabs[p].dir, this.currentDirectory) && !_.contains(dirs, this.prefabs[p].dir))
                dirs.push(this.prefabs[p].dir);
            if (this.isPrefabInDir(this.prefabs[p], this.currentDirectory)) {
                files.push(this.prefabs[p].name);
            }
        }

        // If isn't root, put a folder to go back
        if (this.currentDirectory !== "")
            this.explorerElement.append(this.dirTemplate({name : ".."}));

        for (let i = 0, len = dirs.length; i < len; ++i) {
            let dirname = dirs[i];
            this.explorerElement.append(this.dirTemplate({name : dirname}));
        }
        for (let i = 0, len = files.length; i < len; ++i) {
            let filename = files[i];
            this.explorerElement.append(this.fileTemplate({name : filename}));
        }
        let self = this;
        this.explorerElement.find("[id^=explorer-dir-]").on("click", function(event) {
            let dirname = $(this).find("p").text();
            self.changeCurrentDir(dirname);
        });
        this.explorerElement.find("[id^=explorer-file-]").on("click", function (event) {
            let p = $(this).find("p");
            let filename = p.text();
            if (self.refMode) {
                if (self.currentChild !== null && filename in self.prefabs) {
                    let dest = self.currentChild;
                    let origin = self.prefabs[filename];

                    dest.ref = origin.dir !== "" ? "/" + origin.dir : "" + "/" + origin.name;
                    self.refMode = false;
                    let button = $("#reference-change-button");
                    button.text(`Change`);
                    let referenceText = $("#reference-text");
                    referenceText.text(dest.ref);
                }
            }
            else {
                self.unselectFile();
                self.currentFile = filename;
                self.currentPrefab = self.prefabs[self.currentFile];
                self.selectFile($(this));
                // Open file in entity panel
                if (self.fileClickCallback !== null) {
                    self.fileClickCallback(filename);
                }
            }
        });
    }

    public changeCurrentDir (newDir : string) {
        if (newDir === "..") {
            let index = this.currentDirectory.indexOf("/");
            if (index !== -1) {
                this.currentDirectory = this.currentDirectory.slice(0, index);
            }
            else {
                this.currentDirectory = "";
            }
        }
        else this.currentDirectory = newDir;
        this.loadCurrentDir();
    }
}
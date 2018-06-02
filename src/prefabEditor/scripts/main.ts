/**
 * Import jquery to add $ to window.
 */
import "jquery";
import "bootstrap";
import stringify from "json-stable-stringify";
import ExplorerManager from "./ExplorerManager";
import ComponentList from "./ComponentList";
import ComponentsViewer from "./ComponentsViewer";
import ChildrenViewer from "./ChildrenViewer";
import Assets from "@utils/assets";
import * as _ from "underscore";
import Prefab, {ChildPrefab, isPrefabChild} from "@common/prefab";
import "@common/bitfield";

$(document).ready(function () {
    let explorerManager : ExplorerManager = null;
    let componentList : ComponentList = null;
    let componentsViewer : ComponentsViewer = null;
    let childrenViewer : ChildrenViewer = null;

    let entityNameInput = $("#entity-name");
    let entityTagInput = $("#entity-tag");
    let entityComponentsButton = $("#entity-components-button");
    let entityChildrenButton = $("#entity-children-button");
    let modalCloseButton = $("#modal-close");
    let saveButton = $("#save-button");
    let entityNameSaveButton = $("#entity-name-save-button");
    let entityTagSaveButton = $("#entity-tag-save-button");
    let addButton = $("#add-button");
    let refButton = $("#ref-button");
    let childPathText = $("#child-path");
    let referenceText = $("#reference-text");
    let changeReferenceButton = $("#reference-change-button");
    let backChildPathButton = $("#child-back-button");
    let currentPrefabName = $("#current-prefab-name");

    let isManagingChild = function () : boolean {
        return explorerManager.currentChild !== null;
    }

    let attributeTemplate : (...data : any[]) => string = null;
    $.get("../../" + Assets.PathToAsset("html/attributeTemplate.html"), function (data) {
        attributeTemplate = _.template(data);
    }, 'html');

    let onFileClick = function (filename : string) {
        // Open file in Entity Panel
        setPrefab(explorerManager.prefabs[filename]);
        showPrefab(explorerManager.prefabs[filename]);
    }
    let onComponentClick = function (componentName : string) {
        // Add component
        let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
        if (prefab !== null && componentList.addComponent(componentName, prefab)) {
            // Update view
            componentsViewer.show(prefab);
        }
    }
    let onEntityComponentClick = function (componentName : string) {
        // Edit component
        let modal = $("#component-edit-modal");
        modal.modal("show");
        modal.find("h4").text(componentName);
        let list = $("#modal-attribute-list");

        // Get current prefab's values
        let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
        let component = prefab.components[componentName];

        list.empty();
        for (let attr in component) {
            let t = componentList.getAttributeType(componentName, attr);
            if (!componentList.isAllowedType(t)) continue;
            list.append(attributeTemplate({
                attributeName : attr,
                attributeType : t,
                attributeDefault : component[attr]
            }));
        }
    }
    let onChildClick = function (childName : string) {
        // View child
        let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
        if (prefab === null) return;
        if (childName === "..new..") {
            // Create new child
            // TODO: Check if child with name "temp" already exists
            let path : string = `${isPrefabChild(prefab) ? (<ChildPrefab>prefab).path + "/" : "/"}${prefab.name}`;
            let child : ChildPrefab = {
                name : "temp",
                tag : "",
                path : path,
                children : [],
                components : {},
                ref : ""
            };
            prefab.children.push(child);
            childrenViewer.show(prefab);
        }
        else {
            for (let i = 0, len = prefab.children.length; i < len; ++i) {
                let c = prefab.children[i];
                if (c.name === childName) {
                    setPrefab(c);
                    childrenViewer.show(c);
                    break;
                }
            }
        }
    }

    let setCurrentPrefabFields = function (prefab : Prefab | ChildPrefab) {
        entityNameInput.val(prefab.name);
        entityTagInput.val(prefab.tag);
    }

    let setCurrentPrefabName = function (prefab : Prefab | ChildPrefab) {
        if (isPrefabChild(prefab)) {
            currentPrefabName.text(`${prefab.path.slice(1)}/${prefab.name}`);
        }
        else {
            currentPrefabName.text(`${prefab.name}`);
        }
    }

    let setCurrentChildFields = function (prefab : ChildPrefab) {
        childPathText.text(prefab.path);
        referenceText.text(prefab.ref);
        backChildPathButton.removeClass("disabled");
        changeReferenceButton.removeClass("disabled");
    }

    let unsetCurrentChildFields = function () {
        childPathText.text("");
        referenceText.text("");
        if (!backChildPathButton.hasClass("disabled"))
            backChildPathButton.addClass("disabled");
        if (!changeReferenceButton.hasClass("disabled"))
            changeReferenceButton.addClass("disabled");
    }

    let setPrefab = function (prefab : Prefab | ChildPrefab) {
        setCurrentPrefabName(prefab);
        setCurrentPrefabFields(prefab);

        if (isPrefabChild(prefab)) {
            explorerManager.currentChild = prefab;
            setCurrentChildFields(prefab);
        }
        else {
            explorerManager.currentChild = null;
            unsetCurrentChildFields();
        }
    }

    let resetViewer = function () {
        $("#viewer").empty();
        $("#viewer").append(`
            <h2>Components/Children Visualizer</h2>
            <h4>After selecting a Prefab, click on Components or Children.</h4>
        `);
    }

    let resetComponentsList = function () {
        let componentButtons = $("#components-list").find("[id^=component-list-]");
        componentButtons.each(function (index, element) {
            let e = $(element);
            if (!e.hasClass("disabled")) {
                e.addClass("disabled");
            }
        });
    }

    let showPrefab = function (prefab : Prefab | ChildPrefab) {
        resetViewer();
        resetComponentsList();
    }

    entityComponentsButton.on("click", function () {
        let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
        if (prefab !== null) {
            componentsViewer.show(prefab);
            let componentButtons = $("#components-list").find("[id^=component-list-]");
            componentButtons.each(function (index, element) {
                let e = $(element);
                let cName = e.text();
                if (cName in prefab.components) {
                    if (!e.hasClass("disabled")) e.addClass("disabled");
                }
                else e.removeClass("disabled");
            });
        }
    });
    entityChildrenButton.on("click", function () {
        let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
        if (prefab !== null)
            childrenViewer.show(prefab);
    });
    modalCloseButton.on("click", function () {
        // Get all attributes and save them to the prefab
        let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
        let list = $("#modal-attribute-list");
        let attributes = list.find("input");
        let modal = $("#component-edit-modal");
        attributes.each(function (index, element) {
            let attrValue = $(element).val().toString();
            let attrName = $(element).parent().attr("id").split("-")[1];
            prefab.components[modal.find("h4").text().toString()][attrName] = attrValue;
        });
    });
    entityNameSaveButton.on("click", function () {
        let n = entityNameInput.val().toString();
        if (n !== "") {
            let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
            if (prefab !== null) {
                prefab.name = n;
                currentPrefabName.text(n);
            }
        }
    });
    entityTagSaveButton.on("click", function () {
        let n = entityTagInput.val().toString();
        if (n !== "") {
            let prefab = explorerManager.currentChild || explorerManager.getCurrentPrefab();
            if (prefab !== null) {
                prefab.tag = n;
            }
        }
    });
    addButton.on("click", function () {
        let n = entityNameInput.val().toString();
        if (n !== "") {
            let prefab : Prefab = explorerManager.createPrefab(n);
            setPrefab(prefab);
            showPrefab(prefab);
        }
    });
    refButton.on("click", function () {
        explorerManager.refMode = !explorerManager.refMode;
        refButton.text(`Ref ${explorerManager.refMode ? `On` : `Off`}`);
    });
    changeReferenceButton.on("click", function (event) {
        let button = $(event.target);
        if (!button.hasClass("disabled")) {
            explorerManager.refMode = !explorerManager.refMode;
            button.text(explorerManager.refMode ? "Choose Ref" : "Change");
        }
    });

    let findChild = function (prefab : Prefab | ChildPrefab, childName : string) : ChildPrefab | null {
        for (let i = 0, len = prefab.children.length; i < len; ++i) {
            let child = prefab.children[i];
            if (child.name === childName) return child;
        }
        return null;
    }
    backChildPathButton.on("click", function (event) {
        let button = $(event.target);
        if (!button.hasClass("disabled")) {
            if (isManagingChild()) {
                let currentChildPath = explorerManager.currentChild.path;
                let splitPath = currentChildPath.split("/");
                // [0] = "", [last] = parent
                if (splitPath.length === 2) {
                    setPrefab(explorerManager.prefabs[explorerManager.currentFile]);
                    showPrefab(explorerManager.prefabs[explorerManager.currentFile]);
                }
                else {
                    let p : Prefab | ChildPrefab = explorerManager.currentPrefab;
                    for (let i = 1, len = splitPath.length; i < len; ++i) {
                        let element = splitPath[i];
                        p = findChild(p, element);
                    }
                    // p has parent
                    setPrefab(p);
                    showPrefab(p);
                }
            }
        }
    });

    let savePrefab = function (prefab : Prefab) {
        $.ajax({
            url: "/prefabs",
            type:"POST",
            data: stringify(prefab, {space: "\t"}),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success: function(data) {
                console.log(data);
            }
        });
    }

    let save = function () {
        // Update prefab's name
        if (explorerManager.currentPrefab === null || entityNameInput.val().toString() === "") return;
        let prefab = explorerManager.getCurrentPrefab();
        
        savePrefab(prefab);
    }

    saveButton.on("click", function () {
        save();
    });

    // Load stuff
    let url = `${document.location.protocol}//${document.location.host}/prefabs`;
    $.get(url, function (data) {
        explorerManager = new ExplorerManager(data);
        explorerManager.setFileClickCallback(onFileClick);

        let wait = window.setInterval(() => {
            if (explorerManager.isReady) {
                window.clearInterval(wait);
                explorerManager.loadCurrentDir();

                componentList = new ComponentList();
                componentList.setComponentClickCallback(onComponentClick);
                componentList.checkPrefabs(data, savePrefab);

                componentsViewer = new ComponentsViewer();
                componentsViewer.setComponentClickCallback(onEntityComponentClick);

                childrenViewer = new ChildrenViewer();
                childrenViewer.setChildClickCallback(onChildClick);
            }
        }, 300);
    }, 'json');
});
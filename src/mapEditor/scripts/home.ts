import "jquery";
import "bootstrap";

import * as Utils from "@utils/utils";
import { ServerMap, MapDataMessage } from "@common/GameMap";
import ClientMap from "@lib/ClientMap";

import * as Graphics from "@lib/Graphics";

let updateCanvasSize = function () {
    let width = $(window).width();
    width *= 0.9;
    $("#canvas").width(width);
}

let map = new ServerMap();

let checkReady = function () : void {
    let interval = window.setInterval(() => {
        if (Graphics.tilesetsLoaded && map.isMapLoaded) {
            map.isLoaded = true;
            window.clearInterval(interval);
            init();
        }
    }, 1000);
}

let init = function () {
    
}

$(document).ready(function () {
    updateCanvasSize();
    $(window).resize(function () {
        updateCanvasSize();
    });

    $.get(Utils.getUrl() + "/map", "edit", function (data) {
        let message = data as MapDataMessage;
        ClientMap.setup(message, null);
        map.initMap(message.data, checkReady);
    }, 'json');
});
/**
 * home.ts
 * Entry point of the program.
 * Initializes the utilities and sets up the libraries that will be used throughout the code.
 */

/**
 * Import jquery to add $ to window.
 */
import "jquery";

/**
 * Import util.
 */
import "@utils/utils";

import {Awake} from "@engine/ecs";

/**
 * Once the document is ready, we can begin the Systems' setup, by calling "Awake".
 */
$(document).ready(function() {
    Awake("GameScene");
});

// FIXME: If dies moving, selectedposition will stay there
// TODO: DeathKnight and Boss' idle animation should be default Down if doesn't have a target
// CHECK: Audio toggle wasn't working
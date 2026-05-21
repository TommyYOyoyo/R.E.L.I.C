/**
 * Boss level game file
 * @author Honglue Zheng
 */

import Phaser from "phaser";
import Player from "../player.js";
import { spawnWeirdos } from "../puzzles/threeWeirdos.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";
import { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup } from "../levelLoader.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

// Load level-specific assets
function loadAssets(scene) {
    // Load common assets shared across all levels
    loadCommonAssets(scene);

    /** @note ADD TO YOUR LEVEL - Load ruins tileset */
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset-extruded.png");
    /** @note ADD TO YOUR LEVEL - Load dungeon tileset */
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset-extruded.png");
    // Load background image collection
    
    scene.load.tilemapTiledJSON("bgCollection", "/assets/img/maps/bg_imgs.tmj");
    scene.load.image("bg2_1", "/assets/img/backgrounds/background_2/Plan_1.png");
    scene.load.image("bg2_2", "/assets/img/backgrounds/background_2/Plan_2.png");
    scene.load.image("bg2_3", "/assets/img/backgrounds/background_2/Plan_3.png");
    scene.load.image("bg2_4", "/assets/img/backgrounds/background_2/Plan_4.png");
    scene.load.image("bg2_5", "/assets/img/backgrounds/background_2/Plan_5.png");
    scene.load.image("bg3_1", "/assets/img/backgrounds/background_3/Plan_1.png");
    scene.load.image("bg3_2", "/assets/img/backgrounds/background_3/Plan_2.png");
    scene.load.image("bg3_3", "/assets/img/backgrounds/background_3/Plan_3.png");
    scene.load.image("bg3_4", "/assets/img/backgrounds/background_3/Plan_4.png");
    scene.load.image("bg3_5", "/assets/img/backgrounds/background_3/Plan_5.png");
    // Load map
    scene.load.tilemapTiledJSON("map", "/assets/img/maps/l2_map.tmj");
    scene.load.tilemapTiledJSON("bg", "/assets/img/maps/bg_2.tmj");

    // Load weirdos spritesheet
    scene.load.spritesheet("weirdoSheet", "/assets/img/Weirdos/Idle.png", {
        frameWidth: 231,
        frameHeight: 190
    });

    /** @note ADD TO YOUR LEVEL - Load enemy spritesheet */

    /** @note ADD TO YOUR LEVEL - Load musics & sfx */
    scene.load.audio("onceInALullaby", "/assets/sounds/musics/onceInALullaby.mp3");

    scene.load.image("chatBox", "/assets/img/chatBox.png");

    // Load enemy assets
    loadEnemyAssets(scene);
}

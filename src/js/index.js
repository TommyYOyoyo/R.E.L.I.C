/**
 * Main game file
 * @author Honglue Zheng, Ray Lam, Rui Qi Ren
 * @version beta
 */

import "../css/style.css";
import Phaser from "phaser";
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MainMenu } from "./mainMenu.js";
import { Level1 } from "./levels/level1.js";
import { Level2 } from "./levels/level2.js";
import { Level3 } from "./levels/level3.js";

const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
        mapWidth: window.innerWidth * 5,
        mapHeight: window.innerHeight * 3,
};

const speedDown = 300;

// Configurations for the game page (PHASER game engine)
const config = {
    // Engine
    type: Phaser.WEBGL,
    width: sizes.width,
    height: sizes.height,
    canvas: gameCanvas,
    pixelArt: true, // Improve texture quality
    // Physics configurations
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: speedDown },
            debug: true,
        },
    },
    scene: [
        MainMenu,
        Level1,
        Level2,
        Level3
    ],
    plugins: {
        scene: [
            // Game UI Plugin
            {
                key: 'rexUI',
                plugin: UIPlugin,
                mapping: 'rexUI'
            },
        ]
    },
};

const game = new Phaser.Game(config);

export { config };

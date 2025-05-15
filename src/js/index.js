/**
 * Main game file
 * @author everybody
 * @version beta
 */

import "../css/style.css";
import Phaser from "phaser";
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MainMenu } from "./MainMenu.js";
import { Level1 } from "./level1.js";
import { Level2 } from "./level2.js";
import { Level3 } from "./level3.js";

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
    // Physics configurations
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: speedDown },
            debug: false,
        },
    },
    scene: [MainMenu],
    plugins: {
        scene: [
            // Game UI Plugin
            {
                key: 'rexUI',
                plugin: UIPlugin,
                mapping: 'rexUI'
            },
        ]
    }
};

const game = new Phaser.Game(config);

export { config };

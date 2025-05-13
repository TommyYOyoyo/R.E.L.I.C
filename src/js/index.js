/**
 * Main game file
 * @author everybody
 * @version beta
 */

import "../css/style.css";
import Phaser from "phaser";
import { MainMenu } from "./MainMenu.js";
import { Level1 } from "./level1.js";
import { Level2 } from "./level2.js";

const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
        mapWidth: window.innerWidth * 5,
        mapHeight: window.innerHeight * 3,
};

const speedDown = 300;

const config = {
    type: Phaser.WEBGL,
    width: sizes.width,
    height: sizes.height,
    canvas: gameCanvas,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: speedDown },
            debug: false,
        },
    },
    scene: [MainMenu]
};

const game = new Phaser.Game(config);

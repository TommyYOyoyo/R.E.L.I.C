import "../css/style.css";
import Phaser from "phaser";
import { Level2, sizes } from "./level2.js";

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
    scene: [Level2]
};

const game = new Phaser.Game(config);

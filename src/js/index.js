import "../css/style.css";
import Phaser from "phaser";
import { Level1, sizes } from "./level1.js";

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
    scene: [Level1]
};

const game = new Phaser.Game(config);

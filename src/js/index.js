import "../css/style.css";
import Phaser from "phaser";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const speedDown = 300;

class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
    }

    preload() {
        this.load.image("bg", "../assets/img/background.png");
    }

    create() {
        this.add.image(0, 0, "bg");
    }

    update() {

    }
}

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
    scene: [GameScene]
};

const game = new Phaser.Game(config);
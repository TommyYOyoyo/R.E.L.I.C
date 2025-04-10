import "../css/style.css";
import Phaser from "phaser";

const speedDown = 300;
let platforms;
let bgTiles;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.player;
    }

    preload() {
        this.load.image("bg", "../../public/assets/img/Layers/back.png");
    }

    create() {
        const bg1 = this.add.image(0, 400, "bg");
        bg1.scale = 3;
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
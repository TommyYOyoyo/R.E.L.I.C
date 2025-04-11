import "../css/style.css";
import Phaser from "phaser";

const speedDown = 300;
let platforms;
const grassTileWidth = 64;
const grassTileHeight = 69;
let bgTiles = [];
const bgTileWidth1 = 960 * 3;
const bgTileHeight1 = 272 * 3;
const bgTileWidth2 = 1152 * 3;
const bgTileHeight2 = 272 * 3;

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

    // Preload all assets (init)
    preload() {
        this.load.image("bgBack", "../../public/assets/img/Layers/back.png");
        this.load.image("bgFront", "../../public/assets/img/Layers/front.png");
        const grassTile1 = this.load.image("grassTile1", "../../public/assets/img/Tiles/grassTile1.png");
        const grassTile2 = this.load.image("grassTile2", "../../public/assets/img/Tiles/grassTile2.png");
    }

    // Create all game objects
    create() {

        platforms = this.physics.add.staticGroup();

        // Load background pictures (independent layers)
        const bgBack = this.add.image(bgTileWidth1 / 2, bgTileHeight1 / 2, "bgBack");
        const bgFront = this.add.image(bgTileWidth2 / 2, bgTileHeight2 / 2, "bgFront");
        bgBack.scale = 3;
        bgFront.scale = 3;

        // Load grass floor
        for (let i = 0; i < sizes.mapWidth / grassTileWidth; i++) {
            const grassTile = `grassTile${Math.floor(Math.random() * 2) + 1}`;
            const grassTileX = i * grassTileWidth;
            this.add.image(grassTileX, sizes.height - grassTileHeight / 2, grassTile);
        }

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
/**
 * Level 2 game file
 * @author 
 * @version beta
 */

import Phaser from "phaser";
import { createMenu, removeMenu } from './mainMenu';

let platforms;
let floorTiles;
const grassTileWidth = 64;
const grassTileHeight = 69;
const bgTileWidth1 = 960 * 3;
const bgTileHeight1 = 272 * 3;
const bgTileWidth2 = 1152 * 3;
const bgTileHeight2 = 272 * 3;
let player;

const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
        mapWidth: window.innerWidth * 5,
        mapHeight: window.innerHeight * 3,
};

class Level2 extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.player;
        this.menuActive = false;
    }

    // Preload all assets (init)
    preload() {
        this.toggleMenu();

        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        this.load.image("bgBack", "../../public/assets/img/Layers/back.png");
        this.load.image("bgFront", "../../public/assets/img/Layers/front.png");
        this.load.image("grassTile1", "../../public/assets/img/Tiles/grassTile1.png");
        this.load.image("grassTile2", "../../public/assets/img/Tiles/grassTile2.png");

        // Load new keyboard keys
        this.keys = this.input.keyboard.addKeys({
            a:  Phaser.Input.Keyboard.KeyCodes.A,
            s:  Phaser.Input.Keyboard.KeyCodes.S,
            d:  Phaser.Input.Keyboard.KeyCodes.D,
            w:  Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    // Create all game objects
    create() {

        platforms = this.physics.add.staticGroup();
        floorTiles = this.physics.add.staticGroup();

        // Load background pictures (independent layers)
        const bgBack = this.add.image(bgTileWidth1 / 2, bgTileHeight1 / 2, "bgBack").setScale(3);
        const bgFront = this.add.image(bgTileWidth2 / 2, bgTileHeight2 / 2, "bgFront").setScale(3);

        // Load grass floor
        for (let i = 0; i < sizes.mapWidth / grassTileWidth; i++) {
            const grassTile = `grassTile${Math.floor(Math.random() * 2) + 1}`;
            const grassTileX = i * grassTileWidth;
            floorTiles.create(grassTileX, sizes.height - grassTileHeight / 2, grassTile);
        }

        // Load player
        player = this.physics.add.sprite(100, 450, 'dude');

        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        player.body.setGravityY(1000);
        this.physics.add.collider(player, floorTiles);

        /* Spritesheet animations -> TODO
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        */

    }

    // Game update loop
    update() {
        // Move left
        if (this.keys.a.isDown) {
            player.setVelocityX(-300);
        
            //player.anims.play('left', true);
        // Move right
        } else if (this.keys.d.isDown) {
            player.setVelocityX(300);
        
            //player.anims.play('right', true);
        // Stop x-axis movement
        } else {
            player.setVelocityX(0);
        }

        // Jump
        if (this.keys.w.isDown && player.body.touching.down) {
            player.setVelocityY(-600);
        }
    }

    // Menu toggler
    toggleMenu() {
        if (!this.menuActive) {
            createMenu(this);
            this.menuActive = true;
        } else {
            removeMenu(this);
            this.menuActive = false;
        }
    }
}

export { sizes, Level2 };

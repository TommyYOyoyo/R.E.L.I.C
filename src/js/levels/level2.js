/**
 * Level 2 game file
 * @author Honglue Zheng
 * @version beta
 */

import Phaser from "phaser";
//import { createMenu, removeMenu } from './MainMenu';

let player;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

// Load assets for the current level
function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    scene.load.image("grassTile1", "/assets/img/Tiles/grassTile1.png");
    scene.load.image("grassTile2", "/assets/img/Tiles/grassTile2.png");
}

class Level2 extends Phaser.Scene {
    constructor() {
        super("Level2");
        this.player;
    }

    // Preload all assets (init)
    preload() {
        //this.toggleMenu();

        // Load assets
        loadAssets(this);

        // Load new keyboard keys
        this.keys = this.input.keyboard.addKeys({
            a:  Phaser.Input.Keyboard.KeyCodes.A,
            s:  Phaser.Input.Keyboard.KeyCodes.S,
            d:  Phaser.Input.Keyboard.KeyCodes.D,
            w:  Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Load ruins tileset
        this.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset.png");
        // Load dungeon tileset
        this.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset.png");
        // Load background image collection
        this.load.tilemapTiledJSON("bgCollection", "/assets/img/backgrounds/Bg_images.tmj");
        this.load.image("bg2_1", "/assets/img/backgrounds/background_2/Plan_1.png");
        this.load.image("bg2_2", "/assets/img/backgrounds/background_2/Plan_2.png");
        this.load.image("bg2_3", "/assets/img/backgrounds/background_2/Plan_3.png");
        this.load.image("bg2_4", "/assets/img/backgrounds/background_2/Plan_4.png");
        this.load.image("bg2_5", "/assets/img/backgrounds/background_2/Plan_5.png");
        this.load.image("bg3_1", "/assets/img/backgrounds/background_3/Plan_1.png");
        this.load.image("bg3_2", "/assets/img/backgrounds/background_3/Plan_2.png");
        this.load.image("bg3_3", "/assets/img/backgrounds/background_3/Plan_3.png");
        this.load.image("bg3_4", "/assets/img/backgrounds/background_3/Plan_4.png");
        this.load.image("bg3_5", "/assets/img/backgrounds/background_3/Plan_5.png");
        // Load map
        this.load.tilemapTiledJSON("map", "/assets/img/maps/l2_map.tmj");
    }

    // Create all game objects
    create() {
        const scale = 3.5;

        // Map creation
        const map = this.add.tilemap("map");
        const bgMap = this.add.tilemap("bgCollection");

        // Loading background images
        const img1 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_3\/Plan_5.png", "bg3_5");
        const img2 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_3\/Plan_2.png", "bg3_2");
        const img3 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_3\/Plan_1.png", "bg3_1");
        const img4 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_3\/Plan_3.png", "bg3_3"); 
        const img5 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_3\/Plan_4.png", "bg3_4");
        const img6 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_2\/Plan_5.png", "bg2_5");
        const img7 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_2\/Plan_1.png", "bg2_1");
        const img8 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_2\/Plan_2.png", "bg2_2");
        const img9 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_2\/Plan_3.png", "bg2_3");
        const img10 = bgMap.addTilesetImage("..\/Tommy\/Programming\/cjeGD\/Informatique\/Relic\/public\/assets\/img\/backgrounds\/background_2\/Plan_4.png", "bg2_4");
        const sky = bgMap.createLayer("Sky", img1, 0, 0);
        const clouds = bgMap.createLayer("Clouds", img5, 0, 0);
        const bgenv1 = bgMap.createLayer("Background_environment(1)", [img4, img5], 0, 0);
        const bgenv2 = bgMap.createLayer("Background_environment(2)", [img1, img3, img4, img7, img8, img9, img10], 0, 0);
        const bgenv3 = bgMap.createLayer("Background_environment(3)", [img2, img4, img7, img8], 0, 0);
        
        // Load main tilesets
        const ruinSet = map.addTilesetImage("Ruins", "ruinSet");
        const dungeonSet = map.addTilesetImage("Dungeon", "dungeonSet");

        // Loading structures
        const walls = map.createLayer("Walls", [ruinSet, dungeonSet], 0, 0);
        const ground = map.createLayer("Ground", [dungeonSet, ruinSet], 0, 0);
        const decorations = map.createLayer("Decorations", [ruinSet, dungeonSet], 0, 0);

        // Set layer depth
        sky.setDepth(-5);
        clouds.setDepth(-4);
        bgenv1.setDepth(-3);
        bgenv2.setDepth(-2);
        bgenv3.setDepth(-1);
        walls.setDepth(0);
        decorations.setDepth(1);

        // Scale layers
        const layers = [sky, clouds, bgenv1, bgenv2, bgenv3, walls, ground, decorations];
        layers.forEach(layer => layer.setScale(scale).setOrigin(0, 0));

        // Get main camera
        const camera = this.cameras.main;

        // Load player
        player = this.physics.add.sprite(0, 0, 'dude');
        // Set player collision detection
        player.setCollideWorldBounds(true);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels*scale, map.heightInPixels*scale);

        // Player gravity
        player.body.setGravityY(1000);

        // Enable floor/wall collision detection, dealt by Phaser game engine
        this.physics.add.collider(player, ground);
        ground.setCollisionByExclusion(-1);
        
        // Camera movement and delimitation
        this.cameras.main.setBounds(0, 0, map.widthInPixels*scale, map.heightInPixels*scale);
        camera.startFollow(player);
    }

    // Game update loop
    update() {
        // Move left
        if (this.keys.a.isDown) {
            player.setVelocityX(-300);
        // Move right
        } else if (this.keys.d.isDown) {
            player.setVelocityX(300);
        // Stop x-axis movement
        } else {
            player.setVelocityX(0);
        }

        // Jump
        if (this.keys.w.isDown && player.body.onFloor()) {
            player.setVelocityY(-600);
        }
    }
}

export { Level2 };

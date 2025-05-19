/**
 * Level 2 game file
 * @author Honglue Zheng
 * @version beta
 */

import Phaser from "phaser";
import { loadPlayer, updatePlayerMovement, hitboxUpdater } from "../player.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

// Load assets for the current level
function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Load ruins tileset
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset.png");
    // Load dungeon tileset
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset.png");
    // Load background image collection
    scene.load.tilemapTiledJSON("bgCollection", "/assets/img/backgrounds/Bg_images.tmj");
    scene.load.image("bg2_1", "/assets/img/backgrounds/background_2/Plan_1.png");
    scene.load.image("bg2_2", "/assets/img/backgrounds/background_2/Plan_2.png");
    scene.load.image("bg2_3", "/assets/img/backgrounds/background_2/Plan_3.png");
    scene.load.image("bg2_4", "/assets/img/backgrounds/background_2/Plan_4.png");
    scene.load.image("bg2_5", "/assets/img/backgrounds/background_2/Plan_5.png");
    scene.load.image("bg3_1", "/assets/img/backgrounds/background_3/Plan_1.png");
    scene.load.image("bg3_2", "/assets/img/backgrounds/background_3/Plan_2.png");
    scene.load.image("bg3_3", "/assets/img/backgrounds/background_3/Plan_3.png");
    scene.load.image("bg3_4", "/assets/img/backgrounds/background_3/Plan_4.png");
    scene.load.image("bg3_5", "/assets/img/backgrounds/background_3/Plan_5.png");
    // Load map
    scene.load.tilemapTiledJSON("map", "/assets/img/maps/l2_map.tmj");

    // Load player spritesheet
    scene.load.spritesheet("playerSheet", "/assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });
}

class Level2 extends Phaser.Scene {
    constructor() {
        super("Level2");
        this.scaleMultiplier = 3.5;
        this.player;
        this.groundCollider;
        this.vineGroup;
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
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            f: Phaser.Input.Keyboard.KeyCodes.F
        });
    }

    // Create all game objects
    create() {       
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
        //const sky = bgMap.createLayer("Sky", img1, 0, 0);
        //const clouds = bgMap.createLayer("Clouds", img5, 0, 0);
        //const bgenv1 = bgMap.createLayer("Background_environment(1)", [img4, img5], 0, 0);
        //const bgenv2 = bgMap.createLayer("Background_environment(2)", [img1, img3, img4, img7, img8, img9, img10], 0, 0);
        //const bgenv3 = bgMap.createLayer("Background_environment(3)", [img2, img4, img7, img8], 0, 0);
        
        // Load main tilesets
        const ruinSet = map.addTilesetImage("Ruins", "ruinSet");
        const dungeonSet = map.addTilesetImage("Dungeon", "dungeonSet");

        // Loading structures
        const walls = map.createLayer("Walls", [ruinSet, dungeonSet], 0, 0);
        const ground = map.createLayer("Ground", [dungeonSet, ruinSet], 0, 0);
        const decorations = map.createLayer("Decorations", [ruinSet, dungeonSet], 0, 0);

        // Set layer depth
        //sky.setDepth(-5);
        //clouds.setDepth(-4);
        //bgenv1.setDepth(-3);
        //bgenv2.setDepth(-2);
        //bgenv3.setDepth(-1);
        walls.setDepth(0);
        decorations.setDepth(1);

        const objects = map.createFromObjects("Objects");
        
        // Create vines
        const vines = map.createFromObjects("Objects", {
            type: "Ladder",
        });

        const checkpoints = map.createFromObjects("Objects", {
            type: "Checkpoint",
        });

        this.spawnObjects(vines);
        this.spawnObjects(checkpoints);
        
        // Add vines to vineGroup
        this.vineGroup = this.physics.add.staticGroup();
        vines.forEach(vine => {
            this.vineGroup.add(vine);
        }); 

        // Scale layers
        const layers = [walls, ground, decorations];
        layers.forEach(layer => layer.setScale(this.scaleMultiplier).setOrigin(0, 0));

        // Get main camera
        const camera = this.cameras.main;

        loadPlayer(this);
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels*this.scaleMultiplier, map.heightInPixels*this.scaleMultiplier);

        // Enable floor/wall collision detection, dealt by Phaser game engine
        this.groundCollider = this.physics.add.collider(this.player, ground);
        ground.setCollisionByExclusion(-1);
        
        // Camera movement and delimitation
        this.cameras.main.setBounds(0, 0, map.widthInPixels*this.scaleMultiplier, map.heightInPixels*this.scaleMultiplier);
        camera.startFollow(this.player);

    }

    // Game update loop
    update() {
        // Check if player overlaps with the vines (enable climbing), or else disable player climbing
        if (this.physics.overlap(this.player, this.vineGroup)) {
            this.player.canClimb = true;
        } else {
            this.player.canClimb = false;
        }
        updatePlayerMovement(this);
        hitboxUpdater(this);
    }

    // Spawn all objects from tilemap, scale them and enable physics
    spawnObjects(objects) {
        // Scale vines and enable physics
        objects.forEach(element => {
            // Scale the vine sprite and position it accordingly
            element.setPosition(element.x * this.scaleMultiplier, element.y * this.scaleMultiplier);

            // Enable physics and scale collision body
            this.physics.add.existing(element, true);
            element.body.setSize(element.body.width * this.scaleMultiplier, element.body.height * this.scaleMultiplier);
        });
    }

}

export { Level2 };

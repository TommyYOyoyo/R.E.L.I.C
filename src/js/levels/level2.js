/**
 * Level 2 game file
 * @author Honglue Zheng
 * 
 * @note Improvements from 2025
 * - Added animated tiles
 * - R
 */

import Phaser from "phaser";
import Player from "../player.js";
import { spawnWeirdos } from "../puzzles/threeWeirdos.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";
import { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup } from "../levelLoader.js";
import AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    mapWidth: window.innerWidth * 5,
    mapHeight: window.innerHeight * 3,
};

// Load level-specific assets
function loadAssets(scene) {
    // Load animated tiles plugin
    scene.load.scenePlugin("animatedTiles", AnimatedTiles, "animatedTiles", "animatedTiles");

    // Load common assets shared across all levels
    loadCommonAssets(scene);

    /** @note ADD TO YOUR LEVEL - Load ruins tileset */
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset-extruded.png");
    /** @note ADD TO YOUR LEVEL - Load dungeon tileset */
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset-extruded.png");
    // Load background image collection
    
    scene.load.tilemapTiledJSON("bgCollection", "/assets/img/maps/bg_imgs.tmj");
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
    scene.load.tilemapTiledJSON("bg", "/assets/img/maps/bg_2.tmj");

    // Load weirdos spritesheet
    scene.load.spritesheet("weirdoSheet", "/assets/img/Weirdos/Idle.png", {
        frameWidth: 231,
        frameHeight: 190
    });

    /** @note ADD TO YOUR LEVEL - Load enemy spritesheet */

    /** @note ADD TO YOUR LEVEL - Load musics & sfx */
    scene.load.audio("onceInALullaby", "/assets/sounds/musics/onceInALullaby.mp3");

    scene.load.image("chatBox", "/assets/img/chatBox.png");

    // Load enemy assets
    loadEnemyAssets(scene);
}

class Level2 extends Phaser.Scene {
    constructor() {
        super("Level2");
        this.scaleMultiplier = 3.5;
        this.player;
        this.groundCollider;
        this.climbableGroup;
        this.ground;
        this.gameTick = 0;
        this.latestCheckpoint;
        this.nextCheckpoint;
        this.fragmentsReq = 9;
        this.isPaused = false; // Variable to stop game update loop
        this.weirdos = [];
    }

    // Preload all assets (init)
    preload() {
        // Load assets
        loadAssets(this);

        // Load standard keyboard keys
        loadKeyboardKeys(this);
    }

    // Create all game objects
    create() {
        // Fade in from black over 1 second
        this.cameras.main.fadeIn(2000, 0, 0, 0);
        
        // Map creation
        const map = this.add.tilemap("map");
        
        const bgMap = this.add.tilemap("bgCollection");

        const music = this.sound.add('onceInALullaby', {
            loop: true,
            volume: 0.25,
        });
        music.play();

        
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
        const Sky = bgMap.createLayer("Sky", img1, 0, 0).setScrollFactor(0.1);
        const Clouds = bgMap.createLayer("Clouds", img6, 0, 0).setScrollFactor(0.1);
        const Leaves = bgMap.createLayer("Leaves", [img5, img10], 0, 0).setScrollFactor(0.3);
        const Walls = bgMap.createLayer("Walls", [img9, img3, img4], 0, 0).setScrollFactor(0.5);
        const Supplement = bgMap.createLayer("Supplement", [img10, img4], 0, 0).setScrollFactor(0.5);
        const Supplement2 = bgMap.createLayer("Supplement_2", [img9], 0, 0).setScrollFactor(0.5);
        const Floor = bgMap.createLayer("Floor", [img8, img7, img2], 0, 0).setScrollFactor(0.75);
        const bgLayers = [Sky, Clouds, Leaves, Walls, Supplement, Supplement2, Floor];
        bgLayers.forEach(el => el.setScale(this.scaleMultiplier).setOrigin(0, 0));
        

        // Load main tilesets
        const ruinSet = map.addTilesetImage("Ruins", "ruinSet");
        const dungeonSet = map.addTilesetImage("Dungeon", "dungeonSet");
        const tilesetExtruded = map.addTilesetImage("Tileset-extruded", "ruinSet");

        // Loading structures
        const walls = map.createLayer("Walls", [ruinSet, dungeonSet, tilesetExtruded], 0, 0);
        const ground = map.createLayer("Ground", [dungeonSet, ruinSet, tilesetExtruded], 0, 0);
        const decorations = map.createLayer("Decorations", [ruinSet, dungeonSet, tilesetExtruded], 0, 0);
        const decorations2 = map.createLayer("Decorations2", [ruinSet, dungeonSet, tilesetExtruded], 0, 0);
        const vines = map.createLayer("Vines", [ruinSet, dungeonSet, tilesetExtruded], 0, 0);
        this.ground = ground;
        this.playerCollisionLayers = [ground];

        walls.setDepth(0);
        vines.setDepth(3);
        ground.setDepth(1);
        decorations.setDepth(1);
        decorations2.setDepth(0);
        
        // Create interactive objects from tilemap
        this.vines = map.createFromObjects("Objects", {
            type: "Ladder",
        });

        this.checkpoints = map.createFromObjects("Objects", {
            type: "Checkpoint",
        });

        this.fragments = map.createFromObjects("Objects", {
            type: "Fragment",
        });

        this.enemySpawns = map.createFromObjects("Objects", {
            type: "EnemySpawn",
        });

        this.levers = map.createFromObjects("Objects", {
            type: "Lever",
        });

        this.questSpawns = map.createFromObjects("Objects", {
            type: "Quest",
        });

        this.end = map.createFromObjects("Objects", {
            name: "end",
        });

        // Spawn all objects (using level loader utility)
        const objects = [this.vines, this.checkpoints, this.fragments, this.enemySpawns, this.levers, this.questSpawns, this.end];
        objects.forEach(element => {
            spawnObjects(element, this.scaleMultiplier, this);
        });

        // Object groups
        this.checkpointsGroup = this.physics.add.staticGroup();
        this.interactablesGroup = this.physics.add.staticGroup();
        this.enemySpawnsGroup = this.physics.add.staticGroup();
        this.leversGroup = this.physics.add.staticGroup();
        this.questSpawnsGroup = this.physics.add.staticGroup();
        this.climbableGroup = this.physics.add.staticGroup();

        // Add object collections to physics groups (using level loader utility)
        addToGroup(this.vines, this.climbableGroup);
        addToGroup(this.checkpoints, this.checkpointsGroup);
        addToGroup(this.fragments, this.interactablesGroup);
        addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        addToGroup(this.levers, this.leversGroup);
        addToGroup(this.questSpawns, this.questSpawnsGroup);
        addToGroup(this.end, this.interactablesGroup);

        // Scale layers
        const layers = [walls, ground, decorations, decorations2, vines];
        layers.forEach(layer => layer.setScale(this.scaleMultiplier).setOrigin(0, 0));

        // Get main camera
        const camera = this.cameras.main;

        // Initialize animated tiles
        this.animatedTiles.init(map);

        // Spawn player
        this.playerInstance = new Player(this);
        this.playerInstance.load();
        spawnWeirdos(this); // Spawn first quest
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels*this.scaleMultiplier, map.heightInPixels*this.scaleMultiplier);
        
        // Camera movement and delimitation
        this.cameras.main.setBounds(0, 0, map.widthInPixels*this.scaleMultiplier, map.heightInPixels*this.scaleMultiplier);
        camera.startFollow(this.player, true);

        createSkeleton(this, this.ground, 1, 75);
    }

    // Game update loop
    update() {
        if (this.isPaused) return;

        // Update game tick
        this.gameTick++;
        if (this.gameTick > 100000) this.gameTick = 0; // Prevent overflow

        this.playerInstance.update();
        this.playerInstance.hitboxUpdater();
        updateSkeleton(this)
    }

}

export { Level2 };

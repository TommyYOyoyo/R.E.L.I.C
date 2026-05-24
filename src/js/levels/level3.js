/**
 * Level 3 game file
 * @author Rui Qi Ren
 */

import Phaser from "phaser";
import Player from "../player.js";
import { runeSequenceLock } from "../puzzles/runeSequenceLock.js";
import { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup } from "../levelLoader.js";
// import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// Load level-specific assets
function loadAssets(scene) {
    // Load common assets shared across all levels
    loadCommonAssets(scene);

    // Load ruins tileset
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset-extruded.png");
    // Load dungeon tileset
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset-extruded.png");

    // Load map for Level 3
    scene.load.tilemapTiledJSON("map", "/assets/img/maps/l3_map.tmj");

    // Load musics and sound effects
    scene.load.audio("jailBreak", "/assets/sounds/musics/jailBreak.mp3");
}

class Level3 extends Phaser.Scene {
    constructor() {
        super("Level3");
        this.scaleMultiplier = 3.5;
        this.player;
        this.groundCollider;
        this.climbableGroup;
        this.ground;
        this.gameTick = 0;
        this.latestCheckpoint;
        this.nextCheckpoint;
    }

    // Preload all assets (init)
    preload() {
        // Load all game assets
        loadAssets(this);

        // Load standard keyboard keys
        loadKeyboardKeys(this);
    }

    // Create all game objects
    create() {
        // Fade in from black over 2 seconds
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // Map creation
        const map = this.add.tilemap("map");

        // Play background music
        const music = this.sound.add('jailBreak', {
            loop: true,
            volume: 0.25,
        });
        music.play();

        // Load main tilesets
        const ruinSet = map.addTilesetImage("ruins", "ruinSet");
        const dungeonSet = map.addTilesetImage("dungeon", "dungeonSet");

        // Loading map layers
        const background_back = map.createLayer("background_back", [ruinSet, dungeonSet], 0, 0);
        const background_ground = map.createLayer("background_ground", [ruinSet, dungeonSet], 0, 0)
        const ground = map.createLayer("ground", [dungeonSet, ruinSet], 0, 0);
        const decorations2 = map.createLayer("decorations2", [ruinSet, dungeonSet], 0, 0);
        const decorations1 = map.createLayer("decorations1", [ruinSet, dungeonSet], 0, 0);
        const interactables_not = map.createLayer("interactables_not", [ruinSet, dungeonSet], 0, 0);

        this.ground = ground; // Store reference to ground layer

        // Set layer depths for proper rendering order
        background_back.setDepth(-5)
        background_ground.setDepth(-4);
        ground.setDepth(0);
        decorations2.setDepth(-3);
        decorations1.setDepth(-2);
        interactables_not.setDepth(-1);

        // Create interactive objects from tilemap object layers
        this.checkpoints = map.createFromObjects("checkpoint_0", { type: "Checkpoint" });
        this.questSpawns = map.createFromObjects("puzzles", { type: "Quest" });
        this.ladders = map.createFromObjects("ladders", { type: "Ladder" });
        this.interactables = map.createFromObjects("interactables", { type: "interactables" });

        // Spawn and scale all objects from tilemap object layers (using level loader utility)
        const objects = [this.checkpoints, this.questSpawns, this.ladders, /*this.enemySpawns*/, this.interactables];
        objects.forEach(element => {
            spawnObjects(element, this.scaleMultiplier, this);
        });

        // Initialize physics groups for object collections
        this.climbableGroup = this.physics.add.staticGroup();
        this.questSpawnsGroup = this.physics.add.staticGroup();
        this.interactablesGroup = this.physics.add.staticGroup()
        this.checkpointsGroup = this.physics.add.staticGroup();

        // Add object collections to their respective physics groups (using level loader utility)
        addToGroup(this.ladders, this.climbableGroup);
        addToGroup(this.questSpawns, this.questSpawnsGroup);
        addToGroup(this.interactables, this.interactablesGroup);
        addToGroup(this.checkpoints, this.checkpointsGroup);

        // Scale visual map layers
        const layers = [background_back, background_ground, ground, decorations2, decorations1, interactables_not];
        layers.forEach(layer => layer.setScale(this.scaleMultiplier).setOrigin(0, 0));

        // Get main camera reference
        const camera = this.cameras.main;

        // --- PLAYER LOADING AND SCALING ---
        this.playerInstance = new Player(this);
        this.playerInstance.load(); // Call load which creates 'this.player'

        // Scale the player sprite (visual and physics body)
        if (this.player) {
            this.player.setScale(this.scaleMultiplier);
            console.log(`Player scaled to: ${this.scaleMultiplier}x`);
        } else {
            console.error("Error: Player object not found after loadPlayer call!");
        }
        // --- END PLAYER LOADING AND SCALING ---

        // Set world bounds for physics engine (must match scaled map size)
        this.physics.world.setBounds(0, 0, map.widthInPixels * this.scaleMultiplier, map.heightInPixels * this.scaleMultiplier);

        // Enable floor/wall collision detection for the player against the ground layer
        this.groundCollider = this.physics.add.collider(this.player, ground);
        ground.setCollisionByExclusion(-1);

        // Camera setup
        this.cameras.main.setBounds(0, 0, map.widthInPixels * this.scaleMultiplier, map.heightInPixels * this.scaleMultiplier);
        camera.startFollow(this.player);

        // this.physics.world.createDebugGraphic();
        // this.physics.world.debugGraphic.setDepth(999);
        // this.physics.world.debugGraphic.setAlpha(0.7);
        // --- END DEBUG ---
    }

    // Game update loop
    update() {
        this.gameTick++;
        if (this.gameTick > 100000) this.gameTick = 0;

        this.playerInstance.update();
        this.playerInstance.hitboxUpdater();
    }
}

export { Level3 };
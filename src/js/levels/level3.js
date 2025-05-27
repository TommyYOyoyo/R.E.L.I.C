/**
 * Level 3 game file
 * @author Rui Qi Ren
 * @version beta
 */

import Phaser from "phaser";
// Ensure loadPlayer, updatePlayer, and hitboxUpdater are correctly exported from player.js
import { loadPlayer, updatePlayer, hitboxUpdater } from "../player.js";
import { runeSequenceLock } from "../puzzles/runeSequenceLock.js";
// import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    //mapWidth: window.innerWidth * 5, // Not directly used in current map bounds, but good to have
    //mapHeight: window.innerHeight * 3, // Not directly used in current map bounds, but good to have
};

// Load assets for the current level
function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Load ruins tileset
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset.png");
    // Load dungeon tileset
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset.png");

    // Background image collection (commented out in your original code, so keeping it commented)
    /*
    scene.load.tilemapTiledJSON("bgCollection", "/assets/img/backgrounds/l2_map.tmj");
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
    */

    // Load map for Level 3
    scene.load.tilemapTiledJSON("map", "/assets/img/maps/l3_map.tmj");

    // Load player spritesheet
    // frameWidth and frameHeight should be the dimensions of a single frame in the spritesheet
    scene.load.spritesheet("playerSheet", "/assets/img/Player/spritesheet.png", {
        frameWidth: 50,  // Original width of one frame in the spritesheet
        frameHeight: 37 // Original height of one frame in the spritesheet
    });

    // Load musics and sound effects
    scene.load.audio("jailBreak", "/assets/sounds/musics/jailBreak.mp3");
    scene.load.audio("click", "/assets/sounds/sfx/click.mp3");
    scene.load.audio("climb", "/assets/sounds/sfx/climb.wav");
    scene.load.audio("hurt", "/assets/sounds/sfx/hurt.mp3");
    scene.load.audio("jump", "/assets/sounds/sfx/jump.wav");
    scene.load.audio("run", "/assets/sounds/sfx/step.mp3");
    scene.load.audio("teleport", "/assets/sounds/sfx/teleport.wav");
    scene.load.audio("landing", "/assets/sounds/sfx/landing.wav");
    scene.load.audio("attack", "/assets/sounds/sfx/attack.mp3");

    /** @note ADD TO YOUR LEVEL - interact key image */
    scene.load.image("questKey", "/assets/img/interactKey.png");
    // scene.load.image("fragment", "/assets/img/Fragment.png");

    // Load enemy assets
    // loadEnemyAssets(scene);
}

class Level3 extends Phaser.Scene {
    constructor() {
        super("Level3");
        this.scaleMultiplier = 3.5; // Define the global scale for the level
        this.player; // Declare player here
        this.groundCollider;
        this.climbableGroup;
        this.ground;
        this.gameTick = 0;
        this.latestCheckpoint; // Not currently used in the provided code
        this.nextCheckpoint;   // Not currently used in the provided code
        this.runeSequenceLock = [];
    }

    // Preload all assets (init)
    preload() {
        // Load all game assets
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
        // Fade in from black over 2 seconds
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // Map creation
        const map = this.add.tilemap("map");
        // const bgMap = this.add.tilemap("bgCollection"); // This line was commented out in your original code

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
        this.puzzles = map.createFromObjects("puzzles", { type: "Quest" });
        this.ladders = map.createFromObjects("ladders", { type: "Ladder" });
        // this.enemySpawns = map.createFromObjects("Objects", { type: "EnemySpawn" }); // Commented in your original
        this.interactables = map.createFromObjects("interactables", { type: "interactables" });

        // Spawn and scale all objects from tilemap object layers
        const objects = [this.checkpoints, this.puzzles, this.ladders, /*this.enemySpawns*/, this.interactables];
        objects.forEach(element => {
            this.spawnObjects(element);
        });

        // Initialize physics groups for object collections
        this.climbableGroup = this.physics.add.staticGroup();
        this.puzzlesGroup = this.physics.add.staticGroup();
        this.interactablesGroup = this.physics.add.staticGroup()
        // this.enemySpawnsGroup = this.physics.add.staticGroup() // Commented in your original
        this.checkpointsGroup = this.physics.add.staticGroup();

        // Add object collections to their respective physics groups
        this.addToGroup(this.ladders, this.climbableGroup);
        this.addToGroup(this.puzzles, this.puzzlesGroup);
        this.addToGroup(this.interactables, this.interactablesGroup);
        // this.addToGroup(this.enemySpawns, this.enemySpawnsGroup); // Commented in your original
        this.addToGroup(this.checkpoints, this.checkpointsGroup);

        // Scale visual map layers
        const layers = [background_back, background_ground, ground, decorations2, decorations1, interactables_not];
        layers.forEach(layer => layer.setScale(this.scaleMultiplier).setOrigin(0, 0));

        // Get main camera reference
        const camera = this.cameras.main;

        // --- PLAYER LOADING AND SCALING ---
        loadPlayer(this); // Call loadPlayer which creates 'this.player'
        // runeSequenceLock(this);

        // Scale the player sprite (visual and physics body)
        if (this.player) {
            this.player.setScale(this.scaleMultiplier);
            console.log(`Player scaled to: ${this.scaleMultiplier}x`);

            // Optional: Fine-tune player's hitbox if the auto-scaled one isn't perfect.
            // This example assumes original frame size is 50x37 from preload.
            // If the player's body looks too big/small in debug, adjust these ratios.
            // let originalPlayerFrameWidth = 50;
            // let originalPlayerFrameHeight = 37;
            // let scaledPlayerWidth = originalPlayerFrameWidth * this.scaleMultiplier;
            // let scaledPlayerHeight = originalPlayerFrameHeight * this.scaleMultiplier;

            // Example: Make hitbox 80% of the scaled visual width and 90% of scaled visual height.
            // this.player.body.setSize(scaledPlayerWidth * 0.8, scaledPlayerHeight * 0.9);
            // Example: Adjust offset to center the smaller hitbox
            // this.player.body.setOffset(scaledPlayerWidth * 0.1, scaledPlayerHeight * 0.05);

        } else {
            console.error("Error: Player object not found after loadPlayer call!");
        }
        // --- END PLAYER LOADING AND SCALING ---

        // Set world bounds for physics engine (must match scaled map size)
        this.physics.world.setBounds(0, 0, map.widthInPixels * this.scaleMultiplier, map.heightInPixels * this.scaleMultiplier);

        // Enable floor/wall collision detection for the player against the ground layer
        this.groundCollider = this.physics.add.collider(this.player, ground);
        ground.setCollisionByExclusion(-1); // All tiles in 'ground' layer are collidable except those with GID -1

        // Camera setup
        this.cameras.main.setBounds(0, 0, map.widthInPixels * this.scaleMultiplier, map.heightInPixels * this.scaleMultiplier);
        camera.startFollow(this.player);

        // createSkeleton(this, this.ground, 1, 75);

        // --- PHYSICS DEBUG GRAPHICS (CRUCIAL FOR TROUBLESHOOTING) ---
        // Ensure this is after all physics bodies (player, ground, etc.) are created.
        this.physics.world.createDebugGraphic();
        this.physics.world.debugGraphic.setDepth(999); // Set a high depth to ensure it's always visible on top
        this.physics.world.debugGraphic.setAlpha(0.7); // Make it semi-transparent
        // --- END DEBUG ---
    }

    // Game update loop
    update() {
        // Update game tick (for potential time-based events)
        this.gameTick++;
        if (this.gameTick > 100000) this.gameTick = 0; // Prevent overflow

        // Update player logic (movement, animations, etc.)
        updatePlayer(this);
        hitboxUpdater(this);
        // updateSkeleton(this)
        // Call hitboxUpdater only if you have specific dynamic hitbox adjustments based on animation/state
        // hitboxUpdater(this);
    }

    // Spawn all objects from tilemap, scale them and enable physics
    spawnObjects(objects) {
        objects.forEach(element => {
            element.setOrigin(0.5, 0.5); // Set origin to center for consistent scaling
            // Scale object position based on the global scale multiplier
            element.setPosition(element.x * this.scaleMultiplier, element.y * this.scaleMultiplier);

            // Enable physics for the element (static body)
            this.physics.add.existing(element, true); // 'true' makes it a static body

            // Scale the physics collision body
            // IMPORTANT: element.body.width/height initially come from Tiled's object size.
            // If Tiled exports objects with their unscaled pixel dimensions, then multiplying by
            // this.scaleMultiplier here is correct. If Tiled exports them already scaled relative
            // to your map's initial size, you might need to adjust this.
            element.body.setSize(element.body.width * this.scaleMultiplier, element.body.height * this.scaleMultiplier);
        });
    }

    // Add object to group
    addToGroup(objects, group) {
        // Add each object from the collection to the appropriate physics group
        objects.forEach(element => {
            group.add(element);
        });
        // Set group visibility (can be set to true for debugging specific group boundaries)
        group.setVisible(false);
    }
}

export { Level3 };
/**
 * Level 5 game file
 * @author Honglue Zheng
 * 
 * @note New level from 2025
 * - Added boss level setup
 * - Boss, enemies, and interactive objects
 * - Added sloped tiles collider for player
 * - Added spikes
 */

import Phaser from "phaser";
import Player from "../player.js";
import {
    loadCommonAssets,
    loadKeyboardKeys,
    spawnObjects,
    addToGroup,
} from "../levelLoader.js";
import {
    loadEnemyAssets,
    createSkeleton,
    updateSkeleton,
} from "../enemy.js";
import {
    loadFinalBossAssets,
    createFinalBossAnimations,
    spawnFinalBoss,
    updateFinalBoss,
} from "../finalBoss.js";
import { slopeHandler } from "../slopeHandler.js";
import AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.js';

function loadAssets(scene) {
    // Load animated tiles plugin
    scene.load.scenePlugin("animatedTiles", AnimatedTiles, "animatedTiles", "animatedTiles");

    // Load level-specific assets
    // Load common assets shared across all levels
    loadCommonAssets(scene);

    // Load tilesets
    scene.load.image("forestSet", "/assets/img/Forest_Pack/extruded-tileset.png");
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset-extruded.png");
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset-extruded.png");
    scene.load.image("arcadeSlopesSet", "/assets/img/ArcadeSlopes/extruded-tileset.png");

    // Backgrounds
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
    scene.load.tilemapTiledJSON("bg", "/assets/img/maps/bg_2.tmj");

    // Load map
    scene.load.tilemapTiledJSON("map", "/assets/img/maps/l5_map.tmj");

    // Load audio
    scene.load.audio("hide", "/assets/sounds/musics/hide.mp3");
    scene.load.audio("chaos-construct", "/assets/sounds/musics/CHAOS_CONSTRUCT.mp3");
    // SFX
    scene.load.audio("crit", "/assets/sounds/sfx/crit.mp3");
    scene.load.audio("ender", "/assets/sounds/sfx/ender.mp3");
    scene.load.audio("smash", "/assets/sounds/sfx/totem-pop.mp3");
    scene.load.audio("lever", "/assets/sounds/sfx/switch.mp3");
    scene.load.audio("gate", "/assets/sounds/sfx/gate.mp3");
    scene.load.audio("victory", "/assets/sounds/sfx/victory.mp3");

    // Load enemy and boss assets
    loadEnemyAssets(scene);
    loadFinalBossAssets(scene);
}

// Level 5 scene
class Level5 extends Phaser.Scene {
    constructor() {
        super("Level5");
        this.scaleMultiplier = 3.5;
        this.gameTick = 0;
        this.latestCheckpoint;
        this.nextCheckpoint;
        this.groundCollider;
        this.wallCollider0;
        this.wallCollider1;
        this.climbableGroup;
        this.checkpointGroup;
        this.enemySpawnsGroup;
        this.interactablesGroup;
        this.bossSpawnsGroup;
        this.ground;
        this.playerCollisionLayers = [];
        this.fragmentsReq = 0; // No fragments required for level 5 (boss level)
        this.enabledLevers = 0; // Lever counter for gate system
        this.isPaused = false;
        this.music;
    }

    preload() {
        // Preload all assets (init)
        loadAssets(this);

        // Load standard keyboard keys
        loadKeyboardKeys(this);
    }

    create() {
        // Fade in from black over 1 second
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // Load music
        let music = this.sound.add('hide', {
            loop: true,
            volume: 0.25,
        });
        this.music = music;
        this.music.play();

        // Map creation
        const map = this.add.tilemap("map");
        const forestSet = map.addTilesetImage("Forest", "forestSet", 16, 16, 1, 2);
        const dungeonSet = map.addTilesetImage("Dungeon", "dungeonSet", 16, 16, 1, 2);
        const ruinSet = map.addTilesetImage("Tileset-extruded", "ruinSet", 16, 16, 1, 2);
        const arcadeSlopesSet = map.addTilesetImage("arcade-slopes", "arcadeSlopesSet", 16, 16, 1, 2);

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
        const Sky = bgMap.createLayer("Sky", img1, 0, 0).setScrollFactor(0.1);
        const Clouds = bgMap.createLayer("Clouds", img6, 0, 0).setScrollFactor(0.1);
        const Leaves = bgMap.createLayer("Leaves", [img5, img10], 0, 0).setScrollFactor(0.3);
        const Walls = bgMap.createLayer("Walls", [img9, img3, img4], 0, 0).setScrollFactor(0.5);
        const Supplement = bgMap.createLayer("Supplement", [img10, img4], 0, 0).setScrollFactor(0.5);
        const Supplement2 = bgMap.createLayer("Supplement_2", [img9], 0, 0).setScrollFactor(0.5);
        const Floor = bgMap.createLayer("Floor", [img8, img7, img2], 0, 0).setScrollFactor(0.75);
        const bgLayers = [Sky, Clouds, Leaves, Walls, Supplement, Supplement2, Floor];
        bgLayers.forEach(el => el.setScale(7.2).setOrigin(0, 0));

        // Loading structures
        const alterable = map.createLayer("Alterable", [forestSet, dungeonSet, ruinSet], 0, 0);
        const wall0 = map.createLayer("Wall0", [forestSet, dungeonSet, ruinSet], 0, 0);
        const wall1 = map.createLayer("Wall1", [forestSet, dungeonSet, ruinSet], 0, 0);
        const ground = map.createLayer("Ground", [forestSet, dungeonSet, ruinSet], 0, 0);
        const collidable = map.createLayer("Collidable", [arcadeSlopesSet], 0, 0);
        const decorations = map.createLayer("Decorations", [forestSet, dungeonSet, ruinSet], 0, 0);
        const decorations2 = map.createLayer("Decorations 2", [forestSet, dungeonSet, ruinSet], 0, 0);
        const climbable = map.createLayer("Climbable", [forestSet, dungeonSet, ruinSet], 0, 0);

        // Scale layers
        [alterable, wall0, wall1, ground, collidable, decorations, decorations2, climbable].forEach((layer) => {
            if (layer) layer.setScale(this.scaleMultiplier).setOrigin(0, 0);
        });

        // Set layer depths
        if (wall0) wall0.setDepth(0);
        if (wall1) wall1.setDepth(1);
        if (ground) ground.setDepth(2);
        if (collidable) collidable.setAlpha(0);
        if (decorations) decorations.setDepth(5);
        if (decorations2) decorations2.setDepth(6);
        if (climbable) climbable.setDepth(3);
        if (alterable) alterable.setDepth(30);
        if (collidable) collidable.setCollisionByExclusion([-1], true);

        // Store alterable layer reference for gate removal
        this.alterableLayer = alterable;
        if (alterable) alterable.setCollisionByExclusion([-1], true);

        this.ground = collidable;
        // Climbable group for player overlap checks (same as Level2)
        this.climbableGroup = this.physics.add.staticGroup();
        this.playerCollisionLayers = [collidable];

        // Build a set of tile coordinates where climbable tiles exist
        // Used by the ground collider process callback to let the player phase through vine blocks
        this.climbableTileCoords = new Set();
        if (climbable) {
            map.forEachTile((tile) => {
                if (!tile || tile.index === -1) return;
                this.climbableTileCoords.add(`${tile.x},${tile.y}`);
                const cx = tile.getCenterX() * this.scaleMultiplier;
                const cy = tile.getCenterY() * this.scaleMultiplier;
                const w = tile.width * this.scaleMultiplier;
                const h = tile.height * this.scaleMultiplier;
                const rect = this.add.rectangle(cx, cy, w, h).setOrigin(0.5, 0.5).setVisible(false);
                this.physics.add.existing(rect, true);
                this.climbableGroup.add(rect);
            }, this, 0, 0, map.width, map.height, climbable);
        }

        // Create interactive objects from tilemap
        this.checkpoints = map.createFromObjects("Objects", { type: "Checkpoint" }) || [];
        this.enemySpawns = map.createFromObjects("Objects", { type: "EnemySpawn" }) || [];
        this.bossSpawns = map.createFromObjects("Objects", { type: "Boss" }) || [];
        this.fragments = map.createFromObjects("Objects", { type: "Fragment" }) || []; // Needed by player.js for claimed fragment cleanup
        // Load vine/ladder objects for climbing (same pattern as level2)
        this.vines = map.createFromObjects("Objects", { type: "Ladder" }) || [];

        // Levers kept separate for gate system tracking
        this.levers = map.createFromObjects("Objects", { type: "Lever" }) || [];
        this.levers.forEach((l) => { l._isLever = true; }); // Tag for detection in player.js
        this.levers.forEach((l, index) => {
            l._saveId = l.name && l.name.length ? l.name : `lever_${index}`;
        });

        // Other interactables (non-lever)
        this.interactables = [
            ...(map.createFromObjects("Objects", { type: "Control_room" }) || []),
            ...(map.createFromObjects("Objects", { type: "end" }) || []),
        ];

        // Gate marker objects to define the world-space bounds of each gate region
        this.gateMarkers = {
            entrance_0: (map.createFromObjects("Objects", { name: "entrance_0" }) || [])[0],
            gate0: (map.createFromObjects("Objects", { name: "gate0" }) || [])[0],
            gate1: (map.createFromObjects("Objects", { name: "gate1" }) || [])[0],
            final_gate: (map.createFromObjects("Objects", { name: "final_gate" }) || [])[0],
        };

        // Spawn all objects (using level loader utility)
        [this.checkpoints, this.enemySpawns, this.bossSpawns, this.fragments, this.vines, this.levers, this.interactables].forEach((elements) => {
            spawnObjects(elements, this.scaleMultiplier, this);
        });
        // Scale gate markers so their positions/sizes match world coordinates
        Object.values(this.gateMarkers).forEach((marker) => {
            if (marker) {
                marker.setPosition(marker.x * this.scaleMultiplier, marker.y * this.scaleMultiplier);
                marker.setVisible(false);
            }
        });

        // Object groups
        this.checkpointGroup = this.physics.add.staticGroup();
        this.enemySpawnsGroup = this.physics.add.staticGroup();
        this.bossSpawnsGroup = this.physics.add.staticGroup();
        this.interactablesGroup = this.physics.add.staticGroup();
        this.questSpawnsGroup = this.physics.add.staticGroup(); // needed by player.js

        // Add object collections to physics groups
        addToGroup(this.checkpoints, this.checkpointGroup);
        addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        addToGroup(this.bossSpawns, this.bossSpawnsGroup);
        addToGroup(this.fragments, this.interactablesGroup);
        addToGroup(this.levers, this.interactablesGroup); // Levers are interactable via F key
        addToGroup(this.interactables, this.interactablesGroup);
        addToGroup(this.vines, this.climbableGroup);

        // Restore lever progress from saved game state if present
        this._leverSaveState = [];
        const savedGame = JSON.parse(localStorage.getItem("lastGame") || "{}");
        const savedLeverStates = Array.isArray(savedGame.leverStates) ? savedGame.leverStates : [];
        if (savedLeverStates.length) {
            this._leverSaveState = savedLeverStates.slice();
            this.enabledLevers = savedLeverStates.length;

            this.levers.forEach((lever) => {
                if (savedLeverStates.includes(lever._saveId)) {
                    lever._activated = true;
                    lever.setAlpha(0.35);
                    lever.body.enable = false;
                }
            });

            const entranceMarker = this.gateMarkers.entrance_0;
            const entranceActivated = this.levers.some((lever) => {
                if (!lever._activated || !entranceMarker) return false;
                const dist = Phaser.Math.Distance.Between(
                    lever.x, lever.y,
                    entranceMarker.x, entranceMarker.y,
                );
                return dist < 80 * this.scaleMultiplier;
            });

            if (entranceActivated) {
                this._gate0Opened = true;
                if (this.gateMarkers.gate0) this.removeTilesInBounds(this.gateMarkers.gate0);
                if (this.gateMarkers.gate1) this.removeTilesInBounds(this.gateMarkers.gate1);
            }

            if (this.enabledLevers >= 2) {
                this._finalGateOpened = true;
                if (this.gateMarkers.final_gate) this.removeTilesInBounds(this.gateMarkers.final_gate);
            }
        }

        // Spawn player
        this.playerInstance = new Player(this);
        this.playerInstance.load();
        this.player.setScale(this.scaleMultiplier).setDepth(4);

        // Ground collider with process callback (skips collision on tiles that have vines)
        // so the player can phase through blocks with climbable tiles (same behavior as level2)
        // Destroy the default collider from player.js first, otherwise two colliders exist
        // and enterClimb() can only disable one, blocking vine phasing
        const climbableCoords = this.climbableTileCoords;
        if (this.groundCollider) this.groundCollider.destroy();
        this.groundCollider = collidable ? this.physics.add.collider(
            this.player, collidable, null,
            function (player, tile) {
                // Allow player to pass through collidable tiles at climbable positions
                if (climbableCoords.has(`${tile.x},${tile.y}`)) return false;
                return true;
            }
        ) : null;

        // Alterable layer collider — blocks player until gates are opened by levers
        if (alterable) {
            this.alterableCollider = this.physics.add.collider(this.player, alterable);
        }

        // Camera movement and delimitation
        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels * this.scaleMultiplier,
            map.heightInPixels * this.scaleMultiplier,
        );
        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels * this.scaleMultiplier,
            map.heightInPixels * this.scaleMultiplier,
        );
        this.cameras.main.startFollow(this.player, true);

        // Initialize animated tiles (sanitized for plugin)
        if (!this.animatedTiles) {
            console.error("AnimatedTiles plugin not available on this scene. Make sure scene.load.scenePlugin was called in preload.");
        } else {
            const mapForPlugin = {
                tilesets: map.tilesets,
                layers: (map.layers || []).map((l) => {
                    if (l && l.tilemapLayer) return l;
                    return Object.assign({}, l, { tilemapLayer: { type: "StaticTilemapLayer" } });
                }),
                width: map.width,
                height: map.height,
                widthInPixels: map.widthInPixels,
                heightInPixels: map.heightInPixels,
            };
            try {
                this.animatedTiles.init(mapForPlugin);
            } catch (e) {
                console.error("AnimatedTiles init failed:", e);
            }
        }

        if (collidable && this.enemies) this.physics.add.collider(this.enemies, collidable);

        // Spawn skeleton and boss
        createSkeleton(this, collidable || ground, 1, 100);
        if (collidable && this.enemies) this.physics.add.collider(this.enemies, collidable);

        createFinalBossAnimations(this);
        this.boss = spawnFinalBoss(this);
        if (this.boss) {
            if (collidable) this.physics.add.collider(this.boss, collidable);
        }

        // ==================== Lever / Gate system ====================
        // Track which gates have already been opened to prevent duplicate removals
        this._gate0Opened = false;
        this._finalGateOpened = false;

        /**
         * @note Called by player.js when a lever is activated (F key)
         * - If the activated lever is at the entrance_0 position -> open gate0 and gate1
         * - If both levers are activated -> open final_gate
         */

        this.onLeverActivated = (lever) => {
            const sm = this.scaleMultiplier;
            const markers = this.gateMarkers;

            // Check if this lever is at the entrance_0 position (within tolerance)
            if (!this._gate0Opened && markers.entrance_0) {
                const dist = Phaser.Math.Distance.Between(
                    lever.x, lever.y,
                    markers.entrance_0.x, markers.entrance_0.y,
                );
                if (dist < 80 * sm) {
                    // Remove alterable tiles spanning gate0 and gate1
                    this._gate0Opened = true;
                    if (markers.gate0) this.removeTilesInBounds(markers.gate0);
                    if (markers.gate1) this.removeTilesInBounds(markers.gate1);
                    this.sound.play("gate", { volume: 0.5 });
                }
            }

            // When both levers are enabled → open final_gate
            if (!this._finalGateOpened && this.enabledLevers >= 2) {
                this._finalGateOpened = true;
                if (markers.final_gate) this.removeTilesInBounds(markers.final_gate);
                this.sound.play("gate", { volume: 0.5 });
            }
        };
    }

    // Remove all tiles in the Alterable layer that fall within a gate marker's bounds
    // Gate markers are Tiled rectangle objects whose position/size define the gate region
    removeTilesInBounds(marker) {
        if (!this.alterableLayer || !marker) return;

        const sm = this.scaleMultiplier;
        // Marker world-space bounds (already scaled in create())
        const mx = marker.x;
        const my = marker.y;
        const mw = (marker.width || marker.displayWidth || 16) * sm;
        const mh = (marker.height || marker.displayHeight || 16) * sm;

        // Get all tiles within the marker's world-space region
        const tiles = this.alterableLayer.getTilesWithinWorldXY(mx - mw / 2, my - mh / 2, mw, mh);
        if (!tiles) return;

        // Remove each tile (set index to -1 and disable collision)
        tiles.forEach((tile) => {
            if (tile && tile.index !== -1) {
                tile.index = -1;
                tile.collideUp = false;
                tile.collideDown = false;
                tile.collideLeft = false;
                tile.collideRight = false;
                tile.setVisible(false);
            }
        });
    }

    update() {
        if (this.isPaused) return;

        // Update game tick
        this.gameTick++;
        if (this.gameTick > 100000) this.gameTick = 0;

        // Update player and enemies
        slopeHandler(this); // Run slope physics before player logic so body.blocked.down is set correctly
        this.playerInstance.update();
        this.playerInstance.hitboxUpdater();
        updateSkeleton(this);
        updateFinalBoss(this);
    }
}

export { Level5 };

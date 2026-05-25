/**
 * Level 5 / boss game file
 * @author Honglue Zheng
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
    loadBossAssets,
    createBossAnimations,
    spawnBoss,
    updateBoss,
} from "../knightBoss.js";

function loadAssets(scene) {
    loadCommonAssets(scene);
    scene.load.image("forestSet", "/assets/img/Forest_Pack/extruded-tileset.png");
    scene.load.image("dungeonSet", "/assets/img/Dungeon_Pack/Tileset-extruded.png");
    scene.load.image("ruinSet", "/assets/img/Ruins_Pack/Tileset-extruded.png");
    scene.load.tilemapTiledJSON("map", "/assets/img/maps/l5_map.tmj");
    loadEnemyAssets(scene);
    loadBossAssets(scene);
}

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
        this.isPaused = false;
    }

    preload() {
        loadAssets(this);
        loadKeyboardKeys(this);
    }

    create() {
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        const map = this.make.tilemap({ key: "map" });
        const forestSet = map.addTilesetImage("Forest", "forestSet", 16, 16, 1, 2);
        const dungeonSet = map.addTilesetImage("Dungeon", "dungeonSet", 16, 16, 1, 2);
        const extrudedSet = map.addTilesetImage("Tileset-extruded", "ruinSet", 16, 16, 1, 2);

        const wall0 = map.createLayer("Wall0", [forestSet, dungeonSet, extrudedSet], 0, 0);
        const wall1 = map.createLayer("Wall1", [forestSet, dungeonSet, extrudedSet], 0, 0);
        const ground = map.createLayer("Ground", [forestSet, dungeonSet, extrudedSet], 0, 0);
        const decorations = map.createLayer("Decorations", [forestSet, dungeonSet, extrudedSet], 0, 0);
        const decorations2 = map.createLayer("Decorations 2", [forestSet, dungeonSet, extrudedSet], 0, 0);

        [wall0, wall1, ground, decorations, decorations2].forEach((layer) => {
            if (layer) layer.setScale(this.scaleMultiplier).setOrigin(0, 0);
        });

        if (wall0) wall0.setDepth(0);
        if (wall1) wall1.setDepth(1);
        if (ground) ground.setDepth(2);
        if (decorations) decorations.setDepth(3);
        if (decorations2) decorations2.setDepth(4);

        if (wall0) wall0.setCollisionByExclusion([-1], true);
        if (wall1) wall1.setCollisionByExclusion([-1], true);
        if (ground) ground.setCollisionByExclusion([-1], true);

        this.ground = ground;
        this.playerCollisionLayers = [wall0, wall1, ground];

        this.vines = map.createFromObjects("Objects", { type: "Ladder" }) || [];
        this.checkpoints = map.createFromObjects("Objects", { type: "Checkpoint" }) || [];
        this.enemySpawns = map.createFromObjects("Objects", { type: "EnemySpawn" }) || [];
        this.bossSpawns = map.createFromObjects("Objects", { type: "Boss" }) || [];
        this.interactables = [
            ...(map.createFromObjects("Objects", { type: "Lever" }) || []),
            ...(map.createFromObjects("Objects", { type: "Control_room" }) || []),
            ...(map.createFromObjects("Objects", { type: "Control_gate" }) || []),
            ...(map.createFromObjects("Objects", { type: "Final_gate" }) || []),
            ...(map.createFromObjects("Objects", { type: "end" }) || []),
        ];

        [this.vines, this.checkpoints, this.enemySpawns, this.bossSpawns, this.interactables].forEach((elements) => {
            spawnObjects(elements, this.scaleMultiplier, this);
        });

        this.climbableGroup = this.physics.add.staticGroup();
        this.checkpointGroup = this.physics.add.staticGroup();
        this.enemySpawnsGroup = this.physics.add.staticGroup();
        this.bossSpawnsGroup = this.physics.add.staticGroup();
        this.interactablesGroup = this.physics.add.staticGroup();

        addToGroup(this.vines, this.climbableGroup);
        addToGroup(this.checkpoints, this.checkpointGroup);
        addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        addToGroup(this.bossSpawns, this.bossSpawnsGroup);
        addToGroup(this.interactables, this.interactablesGroup);

        this.playerInstance = new Player(this);
        this.playerInstance.load();
        this.player.setScale(this.scaleMultiplier).setDepth(11);

        this.wallCollider0 = wall0 ? this.physics.add.collider(this.player, wall0) : null;
        this.wallCollider1 = wall1 ? this.physics.add.collider(this.player, wall1) : null;
        this.groundCollider = ground ? this.physics.add.collider(this.player, ground) : null;

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

        if (wall0 && this.enemies) this.physics.add.collider(this.enemies, wall0);
        if (wall1 && this.enemies) this.physics.add.collider(this.enemies, wall1);
        if (ground && this.enemies) this.physics.add.collider(this.enemies, ground);

        createSkeleton(this, wall0 || ground, 1, 350);
        if (wall1 && this.enemies) this.physics.add.collider(this.enemies, wall1);
        if (ground && this.enemies) this.physics.add.collider(this.enemies, ground);

        createBossAnimations(this);
        this.boss = spawnBoss(this);
        if (this.boss) {
            if (wall0) this.physics.add.collider(this.boss, wall0);
            if (wall1) this.physics.add.collider(this.boss, wall1);
            if (ground) this.physics.add.collider(this.boss, ground);
        }
    }

    update() {
        if (this.isPaused) return;

        this.gameTick++;
        if (this.gameTick > 100000) this.gameTick = 0;

        this.playerInstance.update();
        this.playerInstance.hitboxUpdater();
        updateSkeleton(this);
        updateBoss(this);
    }
}

export { Level5 };

/**
 * Level 2.1 game file
 * @author Ray Lam 
 */

import Phaser from "phaser";
import { loadPlayer, updatePlayer, hitboxUpdater } from "../player.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";
import { loadBossAssets, createBossAnimations, spawnBoss, updateBoss, bossTakeDamage } from "../knightBoss.js";

function loadAssets(scene) {
    scene.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset-extruded.png");
    scene.load.image("ruinTileset", "assets/img/Ruins_Pack/Tileset-extruded.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l2.1_map.tmj");
    scene.load.spritesheet("playerSheet", "assets/img/Player/spritesheet.png", {
        frameWidth: 50,
        frameHeight: 37
    });
    scene.load.image("charm_1", "/assets/img/timecharm_1.png");
    scene.load.image("questKey", "/assets/img/interactKey.png");
    scene.load.image("fragment", "/assets/img/fragment.png");
    scene.load.image("heart", "/assets/img/heart.png");

    scene.load.audio("wellDead", "/assets/sounds/musics/wellDead.mp3");
    scene.load.audio("click", "/assets/sounds/sfx/click.mp3");
    scene.load.audio("climb", "/assets/sounds/sfx/climb.wav");
    scene.load.audio("hurt", "/assets/sounds/sfx/hurt.mp3");
    scene.load.audio("jump", "/assets/sounds/sfx/jump.wav");
    scene.load.audio("run", "/assets/sounds/sfx/step.mp3");
    scene.load.audio("teleport", "/assets/sounds/sfx/teleport.wav");
    scene.load.audio("landing", "/assets/sounds/sfx/landing.wav");
    scene.load.audio("attack", "/assets/sounds/sfx/attack.mp3");

    loadEnemyAssets(scene);
    loadBossAssets(scene);
}

class Level2_1 extends Phaser.Scene {
    constructor() {
        super("Level2.1");
        this.scaleMultiplier = 4;
        this.gameTick = 0;
        this.latestCheckpoint;
        this.nextCheckpoint;
        this.groundCollider;
        this.ground;
        this.skeletonsKilled = 0;
        this.climbableGroup;
    }

    preload() {
        loadAssets(this);
        this.keys = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            f: Phaser.Input.Keyboard.KeyCodes.F
        });
    }

    create() {
        const scale = this.scaleMultiplier;
        
        this.bg2 = this.add.image(0, 0, "bgLayer2")
            .setOrigin(0)
            .setScrollFactor(1)
            .setDepth(-2)
            .setScale(scale);

        const music = this.sound.add('wellDead', { loop: true, volume: 0.5 });
        music.play();

        const map = this.make.tilemap({ key: "map" });
        const TILE_SIZE = 16;
        const MARGIN = 1;
        const SPACING = 2;
        
        const tileset1 = map.addTilesetImage("Tileset", "dungeonTileset", TILE_SIZE, TILE_SIZE, MARGIN, SPACING);
        const tileset2 = map.addTilesetImage("Dungeon tileset", "ruinTileset", TILE_SIZE, TILE_SIZE, MARGIN, SPACING);
        
        const layers = {
            bg: map.createLayer("BG", [tileset1, tileset2]),
            bg2: map.createLayer("BG2", [tileset1, tileset2]),
            backwall3: map.createLayer("backwall3", [tileset1, tileset2]),
            backwall2: map.createLayer("backwall2", [tileset1, tileset2]),
            backwall: map.createLayer("backwall", [tileset1, tileset2]),
            deco: map.createLayer("deco", [tileset1, tileset2]),
            arenaWalls: map.createLayer("arenaWalls", [tileset1, tileset2]),
            collidables: map.createLayer("collidables", [tileset1, tileset2]),
            floor: map.createLayer("floor", [tileset1, tileset2])
        };

        Object.values(layers).forEach(layer => {
            if (layer) {
                layer.setScale(scale);
                layer.setOrigin(0, 0);
                layer.setPosition(0, 0);
                layer.setScrollFactor(1);
            }
        });

        layers.bg.setDepth(1);
        layers.bg2.setDepth(2);
        layers.backwall3.setDepth(3);
        layers.backwall2.setDepth(5);
        layers.backwall.setDepth(6);
        layers.deco.setDepth(4);
        layers.arenaWalls.setDepth(9);
        layers.collidables.setDepth(8);
        layers.floor.setDepth(10);
        
        this.ground = layers.floor;
        if (layers.collidables) layers.collidables.setCollisionByExclusion([-1], true);
        
        // Object pulls
        this.checkpoints = map.createFromObjects("interact", { type: "Checkpoint" });
        this.ladders = map.createFromObjects("interact", { type: "Ladder" });
        this.enemySpawns = map.createFromObjects("interact", { type: "EnemySpawn" });
        this.questSpawns = map.createFromObjects("interact", { type: "Quest" });
        this.chestSpawns = map.createFromObjects("interact", { type: "TCChest" });
        this.level2 = map.createFromObjects("interact", { type: "Portal" });
        this.knightActTriggers = map.createFromObjects("interact", { type: "KnightAct" }); // NEW: trigger zone

        // Spawn objects
        this.spawnObjects(this.checkpoints);
        this.spawnObjects(this.ladders);
        this.spawnObjects(this.enemySpawns);
        this.spawnObjects(this.questSpawns);
        this.spawnObjects(this.chestSpawns);
        this.spawnObjects(this.level2);
        this.spawnObjects(this.knightActTriggers); // NEW

        // Groups
        this.climbableGroup = this.physics.add.staticGroup();
        this.checkpointGroup = this.physics.add.staticGroup();
        this.enemySpawnsGroup = this.physics.add.staticGroup();
        this.questSpawnsGroup = this.physics.add.staticGroup();
        this.interactablesGroup = this.physics.add.staticGroup();
        this.knightActGroup = this.physics.add.staticGroup(); // NEW

        this.addToGroup(this.checkpoints, this.checkpointGroup);
        this.addToGroup(this.ladders, this.climbableGroup);
        this.addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        this.addToGroup(this.questSpawns, this.questSpawnsGroup);
        this.addToGroup(this.chestSpawns, this.interactablesGroup);
        this.addToGroup(this.level2, this.interactablesGroup);
        this.addToGroup(this.knightActTriggers, this.knightActGroup); // NEW

        // Player
        loadPlayer(this);
        this.player.setScale(scale).setDepth(10);
        this.groundCollider = this.physics.add.collider(this.player, layers.collidables);

        this.physics.world.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.startFollow(this.player);
       
        this.events.on('skeletonKilled', () => {
            this.skeletonsKilled++;
            console.log(`Skeletons killed: ${this.skeletonsKilled}`);
        });
        createSkeleton(this, layers.collidables, 1, 350);

        // Boss
        createBossAnimations(this);
        const boss = spawnBoss(this);
        if (boss) this.physics.add.collider(boss, layers.collidables);
    }

    update() {
        updateSkeleton(this);
        updateBoss(this);
        this.gameTick++;

        // Climb system
        if (this.physics.overlap(this.player, this.climbableGroup)) {
            this.player.canClimb = true;
        } else {
            this.player.canClimb = false;
            if (this.player.isClimbing) {
                this.player.isClimbing = false;
                this.groundCollider.active = true;
                this.player.body.setAllowGravity(true);
            }
        }
        
        updatePlayer(this);
        hitboxUpdater(this);
        updateSkeleton(this); // duplicate call – you can keep or remove

        // NEW: Check if player is inside any knightAct trigger zone
        const inKnightActZone = this.physics.overlap(this.player, this.knightActGroup);
        if (this.boss) this.boss.setHealthbarVisible(inKnightActZone);
    }

    spawnObjects(objects) {
        objects.forEach(element => {
            element.setOrigin(0.5, 0.5);
            element.setPosition(element.x * this.scaleMultiplier, element.y * this.scaleMultiplier);
            this.physics.add.existing(element, true);
            element.body.setSize(element.body.width * this.scaleMultiplier, element.body.height * this.scaleMultiplier);
        });
    }

    addToGroup(objects, group) {
        objects.forEach(element => group.add(element));
        group.setVisible(false);
    }
}

export { Level2_1 };
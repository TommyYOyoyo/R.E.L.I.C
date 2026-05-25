/**
 * Level 2.1 game file
 * @author Ray Lam
 */

import Phaser from "phaser";
import Player from "../player.js";
import { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup } from "../levelLoader.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";
import { loadBossAssets, createBossAnimations, spawnBoss, updateBoss } from "../knightBoss.js";

function loadAssets(scene) {
    loadCommonAssets(scene);
    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset-extruded.png");
    scene.load.image("bgLayer2", "assets/img/backgrounds/background_4/Plan_5.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l2.1_map.tmj");

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
        this.puzzleDoorLayer;
        this.puzzleDoorCollider;
        this.tutorialPuzzleGroup;
        this.puzzleSolved = false;
        this.puzzleActive = false;
    }

    preload() {
        loadAssets(this);
        loadKeyboardKeys(this);
    }

    create() {
        const scale = this.scaleMultiplier;

        this.bg2 = this.add.image(0, 0, "bgLayer2")
            .setOrigin(0)
            .setScrollFactor(0.0000000001)
            .setDepth(-2)
            .setScale(scale);

        const music = this.sound.add('wellDead', { loop: true, volume: 0.5 });
        music.play();

        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("Tileset", "dungeonTileset", 16, 16, 1, 2);

        const layers = {
            floor:       map.createLayer("floor", tileset, 0, 0),
            collidables: map.createLayer("collidables", tileset, 0, 0),
            BG:          map.createLayer("BG", tileset, 0, 0),
            BG2:         map.createLayer("BG2", tileset, 0, 0),
            backwall:    map.createLayer("backwall", tileset, 0, 0),
            deco:        map.createLayer("deco", tileset, 0, 0),
            puzzleDoor:  map.createLayer("puzzleDoor", tileset, 0, 0),
        };

        Object.values(layers).forEach(layer => {
            if (layer) {
                layer.setScale(scale).setOrigin(0, 0).setScrollFactor(1);
            }
        });

        if (layers.puzzleDoor) {
            layers.puzzleDoor.x = 0;
            layers.puzzleDoor.y = 0;
        }

        if (layers.BG) layers.BG.setDepth(1);
        if (layers.BG2) layers.BG2.setDepth(2);
        if (layers.backwall) layers.backwall.setDepth(6);
        if (layers.deco) layers.deco.setDepth(4);
        if (layers.collidables) layers.collidables.setDepth(8);
        if (layers.floor) layers.floor.setDepth(10);
        if (layers.puzzleDoor) layers.puzzleDoor.setDepth(11);

        if (layers.collidables) layers.collidables.setCollisionByExclusion([-1], true);
        if (layers.puzzleDoor) {
            layers.puzzleDoor.setCollisionByExclusion([-1], true);
            this.puzzleDoorLayer = layers.puzzleDoor;
        }

        this.ground = layers.floor;
        this.playerCollisionLayers = [layers.collidables, layers.puzzleDoor];

        // ---- Interactive objects ----
        this.checkpoints = map.createFromObjects("interact", { type: "Checkpoint" }) || [];
        this.ladders           = map.createFromObjects("interact", { type: "Ladder" }) || [];
        this.enemySpawns       = map.createFromObjects("interact", { type: "EnemySpawn" }) || [];
        this.knightActTriggers = map.createFromObjects("interact", { type: "KnightAct" }) || [];
        this.tutorialPuzzles   = map.createFromObjects("interact", { type: "tutorialPuzzle" }) || [];

        this.level2      = [];
        this.questSpawns = [];
        this.chestSpawns = [];

        spawnObjects(this.checkpoints,       scale, this);
        spawnObjects(this.ladders,           scale, this);
        spawnObjects(this.enemySpawns,       scale, this);
        spawnObjects(this.knightActTriggers, scale, this);
        spawnObjects(this.tutorialPuzzles,   scale, this);

        this.climbableGroup      = this.physics.add.staticGroup();
        this.checkpointGroup     = this.physics.add.staticGroup();
        this.enemySpawnsGroup    = this.physics.add.staticGroup();
        this.knightActGroup      = this.physics.add.staticGroup();
        this.tutorialPuzzleGroup = this.physics.add.staticGroup();

        addToGroup(this.checkpoints,       this.checkpointGroup);
        addToGroup(this.ladders,           this.climbableGroup);
        addToGroup(this.enemySpawns,       this.enemySpawnsGroup);
        addToGroup(this.knightActTriggers, this.knightActGroup);
        addToGroup(this.tutorialPuzzles,   this.tutorialPuzzleGroup);

        // ---- Player ----
        this.playerInstance = new Player(this);
        this.playerInstance.load();
        this.player.setScale(scale).setDepth(10);

        // Colliders (before spawn override so they exist)
        this.groundCollider = this.physics.add.collider(this.player, layers.collidables);
        if (this.puzzleDoorLayer) {
            this.puzzleDoorCollider = this.physics.add.collider(this.player, this.puzzleDoorLayer);
        }

        // ---- Force spawn at checkpoint_0 ----
        const checkpoint1 = this.checkpoints.find(cp => cp.name === "checkpoint_0"); //so that i can spawn at any checkpoint in map
        if (checkpoint1) {
            this.player.x = checkpoint1.x;
            this.player.y = checkpoint1.y - 10;
            // Force activation without relying on overlap
            this.activateCheckpoint(checkpoint1);
        }

        // ---- Checkpoint overlap detection (safe by name) ----
        this.physics.add.overlap(this.player, this.checkpointGroup, (player, checkpoint) => {
            // Only trigger if it's the correct next checkpoint (compare by name)
            if (this.nextCheckpoint && checkpoint.name === this.nextCheckpoint.name) {
                this.activateCheckpoint(checkpoint);
            }
        }, null, this);

        // Camera & world bounds
        this.physics.world.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.startFollow(this.player, true);

        this.events.on('skeletonKilled', () => {
            this.skeletonsKilled++;
            console.log(`Skeletons killed: ${this.skeletonsKilled}`);
        });
        createSkeleton(this, layers.collidables, 1, 350);

        createBossAnimations(this);
        this.boss = spawnBoss(this);
        if (this.boss) {
            this.physics.add.collider(this.boss, layers.collidables);
        }
    }

    // Called whenever the player touches the next checkpoint (or forced at start)
    activateCheckpoint(checkpoint) {
        // Avoid double activation
        if (this.latestCheckpoint === checkpoint) return;

        // Display "CHECKPOINT ENREGISTRÉ"
        const text = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            "CHECKPOINT ENREGISTRÉ",
            {
                fontFamily: "noita",
                fontSize: "100px",
                color: "#ffffff",
                backgroundColor: "rgba(0, 0, 0, 0)",
                padding: { left: 30, right: 30, top: 15, bottom: 15 },
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => text.destroy(),
        });

        // Update checkpoint state
        const currentIndex = this.checkpoints.indexOf(checkpoint);
        const nextIndex = currentIndex + 1;
        this.latestCheckpoint = checkpoint;
        localStorage.setItem(
            "lastGame",
            JSON.stringify({
                level: JSON.parse(localStorage.getItem("lastGame")).level,
                checkpoint: this.latestCheckpoint,
            })
        );

        // Set next checkpoint (keep last if no more)
        if (nextIndex < this.checkpoints.length) {
            this.nextCheckpoint = this.checkpoints[nextIndex];
        } else {
            this.nextCheckpoint = this.checkpoints[this.checkpoints.length - 1];
        }
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

        this.playerInstance.update();
        this.playerInstance.hitboxUpdater();

        const inKnightActZone = this.physics.overlap(this.player, this.knightActGroup);
        if (this.boss) {
            this.boss.setHealthbarVisible(inKnightActZone);
        }

        // Tutorial puzzle trigger
        if (!this.puzzleSolved && !this.puzzleActive &&
            this.tutorialPuzzleGroup &&
            this.physics.overlap(this.player, this.tutorialPuzzleGroup)) {
            this.startTutorialPuzzle();
        }
    }

    // ------------------ Multiplication Puzzle ------------------
    startTutorialPuzzle() {
        this.puzzleActive = true;

        this.time.delayedCall(200, () => {
            this.player.setVelocityX(0);
            this.player.setVelocityY(0);
            this.input.keyboard.enabled = false;
        });

        const a = Phaser.Math.Between(1, 10);
        const b = Phaser.Math.Between(1, 10);
        const correctAnswer = a * b;

        const div = document.getElementById("puzzleDiv");
        div.style.display = "block";
        div.innerHTML = `
            <div style="text-align:center; font-family:'noita'; color:white;">
                <h2>Combien font ${a} × ${b} ?</h2>
                <input type="number" id="multAnswer" style="font-size:24px; width:100px; text-align:center;">
                <br><br>
                <button id="submitMult" style="font-size:24px; padding:10px 30px;">Valider</button>
                <p id="feedback" style="color:red; margin-top:10px;"></p>
            </div>
        `;

        const submitBtn = document.getElementById("submitMult");
        const inputField = document.getElementById("multAnswer");
        const feedback = document.getElementById("feedback");

        const checkAnswer = () => {
            const userAnswer = parseInt(inputField.value, 10);
            if (userAnswer === correctAnswer) {
                feedback.innerHTML = "Correct ! La porte s'ouvre.";

                // Remove puzzle door
                this.puzzleDoorLayer.setVisible(false);
                if (this.puzzleDoorCollider) {
                    this.puzzleDoorCollider.destroy();
                    this.puzzleDoorCollider = null;
                }
                this.puzzleSolved = true;
                div.style.display = "none";
                this.input.keyboard.enabled = true;
                this.puzzleActive = false;
            } else {
                feedback.innerHTML = "Faux. Essayez encore.";
                inputField.value = "";
                inputField.focus();
            }
        };

        submitBtn.addEventListener("click", checkAnswer);
        inputField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") checkAnswer();
        });

        this.time.delayedCall(100, () => inputField.focus());
    }
}

export { Level2_1 };
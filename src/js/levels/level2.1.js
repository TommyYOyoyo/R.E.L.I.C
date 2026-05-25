/**
 * Level 2.1 game file
 * @author Ray Lam
 */

//FINISHED SUNDAY BTW I DONT KNOW MY TEAMATES
import Phaser from "phaser";
import Player from "../player.js";
import { loadCommonAssets, loadKeyboardKeys, spawnObjects, addToGroup } from "../levelLoader.js";
import { loadEnemyAssets, spawnSkeleton, createSkeleton, updateSkeleton } from "../enemy.js";
import { loadBossAssets, createBossAnimations, spawnBoss, updateBoss } from "../knightBoss.js";

//load level-specific assets
function loadAssets(scene) {
    loadCommonAssets(scene);

    scene.load.image("dungeonTileset", "assets/img/Dungeon_Pack/Tileset-extruded.png");
    scene.load.tilemapTiledJSON("map", "assets/img/maps/l2.1_map.tmj");

    scene.load.audio("wellDead", "/assets/sounds/musics/torrent.mp3");

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
    //pre-load all assets
    preload() {
        loadAssets(this);
        loadKeyboardKeys(this);
    }

    create() {
        //fade in (copied from tomtom)
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        const scale = this.scaleMultiplier;

        //music
        const music = this.sound.add('wellDead', { loop: true, volume: 0.2 });
        music.play();

        //map and tileset load
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("Tileset", "dungeonTileset", 16, 16, 1, 2);

        //layers
        const layers = {
            floor: map.createLayer("floor", tileset, 0, 0),
            collidables: map.createLayer("collidables", tileset, 0, 0),
            BG: map.createLayer("BG", tileset, 0, 0),
            BG2: map.createLayer("BG2", tileset, 0, 0),
            backwall: map.createLayer("backwall", tileset, 0, 0),
            deco: map.createLayer("deco", tileset, 0, 0),
            puzzleDoor: map.createLayer("puzzleDoor", tileset, 0, 0),
        };

        //scale & depth
        Object.values(layers).forEach(layer => {
            if (layer) {
                layer.setScale(scale).setOrigin(0, 0).setScrollFactor(1);
            }
        });

        if (layers.BG) layers.BG.setDepth(1);
        if (layers.BG2) layers.BG2.setDepth(2);
        if (layers.backwall) layers.backwall.setDepth(6);
        if (layers.deco) layers.deco.setDepth(4);
        if (layers.collidables) layers.collidables.setDepth(8);
        if (layers.floor) layers.floor.setDepth(10);
        if (layers.puzzleDoor) layers.puzzleDoor.setDepth(11);

        //collisions
        if (layers.collidables) layers.collidables.setCollisionByExclusion([-1], true);
        if (layers.puzzleDoor) {
            layers.puzzleDoor.setCollisionByExclusion([-1], true);
            this.puzzleDoorLayer = layers.puzzleDoor;
        }

        this.ground = layers.floor;

        //interact objects
        this.checkpoints = map.createFromObjects("interact", { type: "Checkpoint" }) || [];
        this.ladders = map.createFromObjects("interact", { type: "Ladder" }) || [];
        this.enemySpawns = map.createFromObjects("interact", { type: "EnemySpawn" }) || [];
        this.knightActTriggers = map.createFromObjects("interact", { type: "KnightAct" }) || [];
        this.tutorialPuzzles = map.createFromObjects("interact", { type: "tutorialPuzzle" }) || [];

        //spawn objects
        spawnObjects(this.checkpoints, scale, this);
        spawnObjects(this.ladders, scale, this);
        spawnObjects(this.enemySpawns, scale, this);
        spawnObjects(this.knightActTriggers, scale, this);
        spawnObjects(this.tutorialPuzzles, scale, this);

        //physics groups for interactables
        this.climbableGroup = this.physics.add.staticGroup();
        this.checkpointGroup = this.physics.add.staticGroup();
        this.enemySpawnsGroup = this.physics.add.staticGroup();
        this.knightActGroup = this.physics.add.staticGroup();
        this.tutorialPuzzleGroup = this.physics.add.staticGroup();
        //add interactables to physics groups
        addToGroup(this.checkpoints, this.checkpointGroup);
        addToGroup(this.ladders, this.climbableGroup);
        addToGroup(this.enemySpawns, this.enemySpawnsGroup);
        addToGroup(this.knightActTriggers, this.knightActGroup);
        addToGroup(this.tutorialPuzzles, this.tutorialPuzzleGroup);

        //player (tom tom code for checkpoints)
        this.playerInstance = new Player(this);
        this.playerInstance.load();
        this.player.setScale(scale).setDepth(10);

        //player and collidables layer collision
        this.groundCollider = this.physics.add.collider(this.player, layers.collidables);

        //puzzle door collider
        if (this.puzzleDoorLayer) {
            this.puzzleDoorCollider = this.physics.add.collider(this.player, this.puzzleDoorLayer);
        }

        //camera
        this.physics.world.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.setBounds(0, 0, map.widthInPixels * scale, map.heightInPixels * scale);
        this.cameras.main.startFollow(this.player);

        //skeleton creation
        this.events.on('skeletonKilled', () => {
            this.skeletonsKilled++;
        });
        createSkeleton(this, layers.collidables, 1, 350);

        //boss creation
        createBossAnimations(this);
        this.boss = spawnBoss(this);
        if (this.boss) {
            this.physics.add.collider(this.boss, layers.collidables);
        }
    }
    //gameloop update
    update() {
        updateSkeleton(this);
        updateBoss(this);
        this.gameTick++;

        //climbing
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

        //updates player
        this.playerInstance.update();
        this.playerInstance.hitboxUpdater();

        //boss healthbar
        const inKnightActZone = this.physics.overlap(this.player, this.knightActGroup);
        if (this.boss) {
            this.boss.setHealthbarVisible(inKnightActZone);
        }

        //tutorial puzzle trigger
        if (!this.puzzleSolved && !this.puzzleActive &&
            this.tutorialPuzzleGroup &&
            this.physics.overlap(this.player, this.tutorialPuzzleGroup)) {
            this.startTutorialPuzzle();
        }
    }

    //entire multiplication puzzle (CSS was copied from the other puzzles)
    startTutorialPuzzle() {
        this.puzzleActive = true;
        //variables
        const a = Phaser.Math.Between(1, 10);
        const b = Phaser.Math.Between(1, 10);
        const correctAnswer = a * b;

        const div = document.getElementById("puzzleDiv");
        div.style.display = "block";
        //CSS
        const style = document.createElement('style');
        style.setAttribute('data-puzzle-style', 'true');
        style.textContent = `
        #puzzleDiv {
            background-color: #1a1a1a;
            padding: 50px;
            border-radius: 3px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(255,255,255,0.05) inset;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 550px;
            min-height: 300px;
            position: relative;
        }
        #puzzleDiv * { font-family: minecraft; }
        #puzzleDiv #input {
            margin-top: 20px;
            width: 80%;
            height: 50px;
            font-size: 1.2em;
            border: 1px solid rgb(255,207,50);
            border-radius: 5px;
            background-color: #4a4a4a;
            color: white;
            text-align: center;
        }
        #puzzleDiv #confirm-button {
            padding: 15px 30px;
            font-size: 1.2em;
            background-color: #007bff;
            color: #e0e0e0;
            border: 2px solid #0056b3;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            margin-top: 20px;
        }
        #puzzleDiv #confirm-button:hover {
            background-color: #0056b3;
            transform: translateY(-2px);
        }
        #puzzleDiv #feedback {
            margin-top: 15px;
            font-size: 1.2em;
            color: #28a745;
            font-weight: bold;
            min-height: 1.2em;
            line-height: 1.2em;
        }
    `;
        document.head.appendChild(style);
        //UI
        div.innerHTML = `
        <div id="feedback" style="color:#996300;">Entrez le résultat de ${a} × ${b}</div>
        <input type="number" id="input" min="1" max="100" placeholder="Votre réponse">
        <button id="confirm-button">Confirmer</button>
    `;
        
        const feedbackDiv = document.getElementById("feedback");
        const inputField = document.getElementById("input");
        const confirmBtn = document.getElementById("confirm-button");
     
        const leavePuzzle = () => {
            div.style.display = "none";
            if (style && style.parentNode) style.parentNode.removeChild(style);
            this.input.keyboard.enabled = true;
            this.puzzleActive = false;
        };
        //answer logic (debugged with AI)
        const checkAnswer = () => {
            const guess = parseInt(inputField.value, 10);
            if (isNaN(guess)) {
                feedbackDiv.style.color = "#dc3545";
                feedbackDiv.textContent = "Veuillez entrer un nombre valide.";
                return;
            }

            if (guess === correctAnswer) {
                feedbackDiv.style.color = "#28a745";
                feedbackDiv.textContent = "Bravo! La porte s'ouvre.";

                //remove puzzle door
                this.puzzleDoorLayer.setVisible(false);
                if (this.puzzleDoorCollider) {
                    this.puzzleDoorCollider.destroy();
                    this.puzzleDoorCollider = null;
                }
                this.puzzleSolved = true;

                confirmBtn.disabled = true;
                confirmBtn.style.pointerEvents = "none";
                confirmBtn.style.backgroundColor = "#6a6a6a";
                this.input.keyboard.enabled = true;
                this.time.delayedCall(1500, leavePuzzle);
            } else {
                feedbackDiv.style.color = "#dc3545";
                feedbackDiv.textContent = "Mauvais!";
                inputField.value = "";
                inputField.focus();
            }
        };

        confirmBtn.addEventListener("click", checkAnswer);
        inputField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") checkAnswer();
        });

        this.time.delayedCall(100, () => inputField.focus());
    }
}

export { Level2_1 };
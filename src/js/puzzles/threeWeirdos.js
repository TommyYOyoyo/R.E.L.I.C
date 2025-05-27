/**
 * @author Honglue Zheng
 * @comment This file has real bad coding habits... such heresy...
 */

import { fragmentFind } from "../player.js";

const variations = [
    [
        {
            dialogue: "Je possède\nle fragment.\nIls mentent\ntous les deux.",
            correctAnswer: true
        },
        {
            dialogue: "La première\npersonne ment.\nC'est moi qui\na le fragment.",
            correctAnswer: false
        },
        {
            dialogue: "Aucun de nous\nn'est digne de\nconfiance...\nsauf moi.",
            correctAnswer: false
        }
    ],
    [
        {
            dialogue: "Si tu veux\nle fragment,\ntu devrais\nvenir avec\nmoi.",
            correctAnswer: false
        },
        {
            dialogue: "Fais-moi\nconfiance,\nj'ai le fragment.",
            correctAnswer: false
        },
        {
            dialogue: "Ils\n essayent de te\ntromper, c'est\nmoi qui l'ai!",
            correctAnswer: true
        },
    ]
];

function spawnWeirdos(scene) {
    // Create weirdo animation
    scene.anims.create({
        key: "weirdoIdle",
        frames: scene.anims.generateFrameNumbers("weirdoSheet", {
            frames: [0, 1, 2, 3, 4, 5]
        }),
        frameRate: 10,
        repeat: -1
    });

    let spawnX;
    let spawnY;
    // Fetch spawn coords
    scene.questSpawns.forEach(element => {
        if (element.name.startsWith("threeweirdos")) {
            spawnX = element.x - 100;
            spawnY = element.y - 50;
        }
    });

    // Spawn all three weirdos
    for (let i = 0; i < 3; i++) {
        // Spawn weirdo
        const weirdo = scene.physics.add.sprite(spawnX, spawnY, "weirdoSheet")
        .setScale(1.5).setOrigin(0.5, 0.5).setDepth(10).setSize(40*1.5, 70*1.5).setOffset(75, 36);

        weirdo.play("weirdoIdle", true); // Play idle animation

        scene.physics.add.collider(weirdo, scene.ground); // Make sure the three weirdos don't fall out of the map
        weirdo.body.setGravityY(500);

        scene.weirdos.push(weirdo);

        spawnX += 100; // Spawn weirdos in a row
        
        if (i == 2) weirdo.setFlipX(true); // Flip third weirdo
    }
}

function interactWithWeirdos(scene) {
    // Fetch if player has already completed the puzzle
    const record = localStorage.getItem('threeWeirdos');
    if (record == null) localStorage.setItem('threeWeirdos', "false");

    // Camera zoom animation
    scene.tweens.add({
        targets: scene.cameras.main,
        zoom: 2.5,
        duration: 2000,
        ease: 'Sine.InOut'
    });

    // Grab a random version of the dialogues
    const version = Math.floor(Math.random() * variations.length);
    let succeed = false;

    // Spawn weirdo dialogues
    setTimeout(() => {

        let weirdo1 = scene.weirdos[0];
        let weirdo2 = scene.weirdos[1];
        let weirdo3 = scene.weirdos[2];

        // Introduction dialogue
        const chatBox1 = scene.add.image(weirdo1.x, weirdo1.y - 100, "chatBox").setOrigin(0.5, 0.5).setScale(0.2).setDepth(100);
        const dialogue1 = scene.add.text(weirdo1.x + 3, weirdo1.y - 105, "Seul un de \n nous dit \n la vérité.", {
            fontSize: "10px",
            fontFamily: 'minecraft',
            color: "black"
        }).setOrigin(0.5, 0.5).setDepth(101);

        // Player has already completed the puzzle
        if (record == "true") {
            dialogue1.setText("Nous n'avons\nplus de \nfragements\npour toi.\nBonne chance\naventurier.");
            // Reenable keyboard input
            scene.input.keyboard.enabled = true;
            setTimeout(() => {
                revert(scene);
                dialogue1.destroy();
                chatBox1.destroy();
            }, 2000);
            return;
        }

        setTimeout(() => {
            // Intro dialogue 2
            dialogue1.setText("Le reste mentira.");

            setTimeout(() => {
                // First weirdo dialogue
                dialogue1.setText(variations[version][0].dialogue);

                // Second weirdo dialogue
                setTimeout(() => {
                    const chatBox2 = scene.add.image(weirdo2.x, weirdo2.y - 100, "chatBox").setOrigin(0.5, 0.5).setScale(0.2).setDepth(100);
                    const dialogue2 = scene.add.text(weirdo2.x + 3, weirdo2.y - 105, variations[version][1].dialogue, {
                        fontSize: "10px",
                        fontFamily: 'minecraft',
                        color: "black"
                    }).setOrigin(0.5, 0.5).setDepth(101);

                    // Third weirdo dialogue
                    setTimeout(() => {
                        const chatBox3 = scene.add.image(weirdo3.x, weirdo3.y - 100, "chatBox").setOrigin(0.5, 0.5).setScale(0.2).setDepth(100);
                        const dialogue3 = scene.add.text(weirdo3.x + 3, weirdo3.y - 105, variations[version][2].dialogue, {
                            fontSize: "10px",
                            fontFamily: 'minecraft',
                            color: "black"
                        }).setOrigin(0.5, 0.5).setDepth(101);

                        // Choice buttons
                        const buttons = scene.rexUI.add.buttons({
                            x : scene.player.currentInteractable.x,
                            y : scene.player.currentInteractable.y + 30,
                            orientation: "horizontal",
                            buttons: [
                                // Button index 1 properties
                                scene.rexUI.add.label({
                                    width: 100,
                                    height: 25,
                                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 3, 0x000000, 0.75),
                                    text: scene.add.text(0, 0, "1e choix", {
                                        fontSize: "16px",
                                        fontFamily: 'minecraft',
                                    }),
                                    align: "center"
                                }).setInteractive({ useHandCursor: true }), 
                                // Button index 2 properties
                                scene.rexUI.add.label({
                                    width: 100,
                                    height: 25,
                                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 3, 0x000000, 0.75),
                                    text: scene.add.text(0, 0, "2e choix", {
                                        fontSize: "16px",
                                        fontFamily: 'minecraft',
                                    }),
                                    align: "center"
                                }).setInteractive({ useHandCursor: true }), 
                                // Button index 3 properties
                                scene.rexUI.add.label({
                                    width: 100,
                                    height: 25,
                                    background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 3, 0x000000, 0.75),
                                    text: scene.add.text(0, 0, "3e choix", {
                                        fontSize: "16px",
                                        fontFamily: 'minecraft',
                                    }),
                                    align: "center"
                                }).setInteractive({ useHandCursor: true }),     
                            ],
                            space: { item: 25 }

                        }).layout().setDepth(101).on("button.click", (button) => {

                            scene.sound.play("click");

                            // Determine if player has the correct answer or not
                            switch (button.text) {
                                // 1st choice
                                case "1e choix":
                                    dialogue2.setText("...");
                                    dialogue3.setText("...");
                                    if (variations[version][0].correctAnswer) {
                                        dialogue1.setText("Bravo,\ntu as trouvé\nle fragment.");
                                        succeed = true;
                                    } else {
                                        dialogue1.setText("Tu t'es trompé.\nBonne chance\nla prochaine fois.");
                                    }
                                    break;

                                // 2nd choice
                                case "2e choix":
                                    dialogue1.setText("...");
                                    dialogue3.setText("...");
                                    if (variations[version][1].correctAnswer) {
                                        dialogue2.setText("Bravo,\ntu as trouvé\nle fragment.");
                                        succeed = true;
                                    } else {
                                        dialogue2.setText("Tu t'es trompé.\nBonne chance\nla prochaine fois.");
                                    }
                                    break;

                                // 3rd choice
                                case "3e choix":
                                    dialogue1.setText("...");
                                    dialogue2.setText("...");
                                    if (variations[version][2].correctAnswer) {
                                        dialogue3.setText("Bravo,\ntu as trouvé\nle fragment.");
                                        succeed = true;

                                    } else {
                                        dialogue3.setText("Tu t'es trompé.\nBonne chance\nla prochaine fois.");
                                    }
                                    break;

                                default:
                                    console.log("[Error] No correct answer were found in db.")
                                    break;
                            }

                            // Destroy all buttons to prevent abuse
                            buttons.destroy();

                            setTimeout(() => {
                                // If succeed, trigger fragment find animation
                                if (succeed) {
                                    fragmentFind(scene);
                                    localStorage.setItem('threeWeirdos', "true");
                                }
                                // Destroy all dialogues and chatboxes
                                const dialogues = [dialogue1, dialogue2, dialogue3];
                                const chatBoxes = [chatBox1, chatBox2, chatBox3];
                                dialogues.forEach((dialogue, index) => {
                                    dialogue.destroy();
                                    chatBoxes[index].destroy();
                                });
                                // Reenable keyboard input
                                scene.input.keyboard.enabled = true;
                                revert(scene);
                            }, 3000);

                        });

                    }, 3000);
                }, 3000);
            }, 3000)
        }, 3000);
    }, 1500);
}

// Function to revert to original game state
function revert(scene) {
    // Camera unzoom animation
    scene.tweens.add({
        targets: scene.cameras.main,
        zoom: 1,
        duration: 2000,
        ease: 'Sine.InOut'
    });
    scene.player.isInteractActive = false;
    scene.player.isInteractOpen = false;
}

export { spawnWeirdos, interactWithWeirdos };
/**
 * @author Ray Lam, Honglue Zheng
 */

import { shutdown, clearCache, startNewLevel } from "./utils.js";
import { Level1 } from "./levels/level1.js";
import { Level2 } from "./levels/level2.js";
import { Level3 } from "./levels/level3.js";
import Checkbox from "phaser3-rex-plugins/plugins/checkbox.js";

export default class PlayerUI {
    constructor(scene) {
        this.scene = scene;
        this.totalTime;
        this.timeCharms = [];
        this.level = this.scene.level;
        this.fragmentSlot;
        this.fragmentSlotPosition;
        this.inventoryBoxPosition;
        if (this.level == "Level1") {
            this.totalTime = 360;
        } else if (this.level == "Level2") {
            this.addTimeCharm("1"); // Add first time charm
            this.totalTime = 480;
        } else if (this.level == "Level3") {
            this.addTimeCharm("1"); // Add first time charm
            this.addTimeCharm("2");  // Add second time charm
            this.totalTime = 620;
        }
        this.createTimerText();
        this.createHealthBar();
        this.createInventoryUI();
        this.startCountdown();
    }

    // Create health bar
    createHealthBar() {
        // Add healthbar graphics
        this.backgroundBar = this.scene.add.graphics()
            .setScrollFactor(0) // Immobilize
            .setDepth(1000);
        this.healthBar = this.scene.add.graphics()
            .setScrollFactor(0) // Immobilize
            .setDepth(1000);

        // Add heart image
        this.heart = this.scene.add.image(0, 0, "heart")
            .setScrollFactor(0) // Immobilize
            .setDepth(1000);
        
        this.drawHealthBar(); // Draw healthbar
    }

    drawHealthBar() {
        const { width, height } = this.scene.cameras.main;
        const barWidth = 300;
        const barHeight = 30;
        const x = 60;
        const y = height - 50;
        const borderRadius = 5;
        const padding = 5; // Space between background bar and health bar

        // Position heart to the left of the health bar
        this.heart.setPosition(
            x - 25,       // 25px left of health bar
            y + (barHeight / 2)  // Centered vertically with health bar
        );

        // Background bar (full width)
        this.backgroundBar.clear()
            .fillStyle(0x2E2E2E) // Outer dark gray border
            .fillRoundedRect(x, y, barWidth, barHeight, borderRadius)
            .fillStyle(0x660000) // Inner red background
            .fillRoundedRect(
                x + padding, 
                y + padding, 
                barWidth - (padding * 2), 
                barHeight - (padding * 2), 
                borderRadius - (padding / 2)
            );

        // Calculate health width
        const healthWidth = Math.max(0, 
            (this.scene.player.health / this.scene.player.maxHealth) * 
            (barWidth - (padding * 2)) // Account for padding on both sides
        );

        // Actual health bar
        this.healthBar.clear()
            .fillStyle(this.getHealthColor())
            .fillRoundedRect(
                x + padding, 
                y + padding, 
                healthWidth, 
                barHeight - (padding * 2), 
                borderRadius - (padding / 2)
        );
    }

    // Healthbar colors
    getHealthColor() {
        if (this.scene.player.health == 10) return 0x00B306;
        if (this.scene.player.health < 10 && this.scene.player.health >= 5) return 0x50B300;
        if (this.scene.player.health == 4) return 0xA4B300;
        if (this.scene.player.health == 3) return 0xB38300;
        if (this.scene.player.health <= 2) return 0xB30000;
    }

    // Timer text
    createTimerText() {
        this.timerText = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            30,
            "00:30",
            {
                font: '50px noita',
                fill: '#EDC602',
                stroke: '#000000',
                strokeThickness: 2
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(51);
    }

    // Timer countdown
    startCountdown() {
        this.updateTimerText();
        
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if(this.timeUp) return; // Ignore if times up
                
                this.totalTime--;       // Decrement time
                this.updateTimerText();
                
                // Times up
                if(this.totalTime <= 0) {
                    this.timeUp = true;
                    this.scene.player.isDead = true;
                }
            },
            loop: true
        });
    }

    // Update timer text to minutes and seconds
    updateTimerText() {
        const minutes = Math.floor(this.totalTime / 60);
        const seconds = this.totalTime % 60;
        this.timerText.setText(
            `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`
        );
    }

    // Create the inventory UI for timecharms and time fragment
    createInventoryUI() {
        const { width, height } = this.scene.cameras.main;
        const slotSize = 50; // Unified size for all slots
        const boxWidth = 190; 
        const boxHeight = 160;
        const healthBarX = 60; // Health bar's x position
        
        // Position the inventory box above health bar
        const x = healthBarX - 45; 
        const y = height - 240; // Position above health bar
        
        // Calculate horizontal centering for slots
        const totalSlotsWidth = 3 * slotSize + 2 * 10; // 3 slots with 10px spacing
        const startX = x + (boxWidth - totalSlotsWidth)/2;

        // Main container box (centered)
        this.inventoryBox = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(1000)
            .fillStyle(0x222222, 0.8)
            .fillRoundedRect(x, y, boxWidth, boxHeight, 10)
            .lineStyle(2, 0xEDC602, 1)
            .strokeRoundedRect(x, y, boxWidth, boxHeight, 10);

        // Centered divider line
        const dividerY = y + boxHeight/2; // Exact center
        this.inventoryBox.lineStyle(1, 0xEDC602, 0.5)
            .lineBetween(x, dividerY, x + boxWidth, dividerY);

        // Temporal Fragments section (top centered)
        this.fragmentSlot = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(1001)
            .fillStyle(0x333333, 0.9)
            .fillRoundedRect(startX, y + 15, slotSize, slotSize, 5)
            .lineStyle(1, 0xEDC602, 0.7)
            .strokeRoundedRect(startX, y + 15, slotSize, slotSize, 5);

        // Fragment icon (centered in slot)
        this.fragmentIcon = this.scene.add.image(
            startX + slotSize/2, 
            y + 15 + slotSize/2, 
            'fragment'
        )
            .setScrollFactor(0)
            .setDepth(1002)
            .setScale(1.5);

        // Fragment counter (centered with slot)
        this.fragmentText = this.scene.add.text(
            startX + slotSize + 5, // Reduced spacing from 10 to 5
            y + 15 + slotSize/2, // Vertically centered
            'x0', 
            {
                font: '35px noita',
                fill: '#EDC602'
            }
        )
            .setOrigin(0, 0.5) // Left-aligned horizontally, centered vertically
            .setScrollFactor(0)
            .setDepth(1002);

        // Timecharms section (bottom centered)
        this.timeCharmSlots = [];
        for (let i = 0; i < 3; i++) {
            const slotX = startX + i * (slotSize + 10);
            const slotY = dividerY + 10; // 10px below divider
            
            const slot = this.scene.add.graphics()
                .setScrollFactor(0)
                .setDepth(1001)
                .fillStyle(0x333333, 0.9)
                .fillRoundedRect(slotX, slotY, slotSize, slotSize, 5)
                .lineStyle(1, 0xEDC602, 0.7)
                .strokeRoundedRect(slotX, slotY, slotSize, slotSize, 5);

            this.timeCharmSlots.push(slot);
        }

        // Store positions for later reference
        this.fragmentSlotPosition = {
            x: startX + slotSize/2,
            y: y + 15 + slotSize/2
        };
        
        this.inventoryBoxPosition = {
            x: x,
            y: y,
            width: boxWidth,
            height: boxHeight
        };
    }

    // Update the fragment counter
    updateFragmentCount(count) {
        this.fragmentText.setText(`x${count}`);
        localStorage.setItem(`${this.scene.level}.fragments`, count);
    }

    // Add timecharm to the inventory
    addTimeCharm(charmType) {
        if (this.timeCharms.length < 3) {
            this.timeCharms.push(charmType);
            this.updateTimeCharmDisplay();
        }
    }

    // Update the visual display of timecharms
    updateTimeCharmDisplay() {
        // Clear existing charm icons
        if (this.timeCharmIcons) {
            this.timeCharmIcons.forEach(icon => icon.destroy());
        }
        
        this.timeCharmIcons = [];
        
        // Calculate positions based on inventory box
        const { width, height } = this.scene.cameras.main;
        const slotSize = 50;
        const boxWidth = 190;
        const healthBarX = 60;
        const boxX = healthBarX - 45;
        const startX = boxX + (boxWidth - (3 * slotSize + 2 * 10)) / 2;
        const slotY = height - 240 + 90;
        
        // Add new charm icons in correct slots
        this.timeCharms.forEach((charm, index) => {
            const slotX = startX + index * (slotSize + 10);
            
            const icon = this.scene.add.image(
                slotX + slotSize/2, // Center in slot
                slotY + slotSize/2, // Center in slot
                `charm_${charm}`
            )
                .setScrollFactor(0)
                .setDepth(1002)
                .setScale(2); // Adjusted scale
            
            this.timeCharmIcons.push(icon);
        });
    }

    // Function to flash player's inventory border
    flashInventoryBorder(times = 3, flashColor = 0xFFFFFF, duration = 100) {
        if (!this.inventoryBox) return;

        const originalColor = 0xEDC602; // Original border color
        let flashCount = 0;

        // Flash for 3 times (default)
        const flash = () => {
            if (flashCount >= times) return;

            // Flash to color
            this.inventoryBox.clear()
                .fillStyle(0x222222, 0.8)
                .fillRoundedRect(
                    this.inventoryBoxPosition.x,
                    this.inventoryBoxPosition.y,
                    this.inventoryBoxPosition.width,
                    this.inventoryBoxPosition.height,
                    10
                )
                .lineStyle(2, flashColor, 1)
                .strokeRoundedRect(
                    this.inventoryBoxPosition.x,
                    this.inventoryBoxPosition.y,
                    this.inventoryBoxPosition.width,
                    this.inventoryBoxPosition.height,
                    10
                );

            // Use recursion to flash again after a certain duration
            this.scene.time.delayedCall(duration, () => {
                // Revert to original color
                this.inventoryBox.clear()
                    .fillStyle(0x222222, 0.8)
                    .fillRoundedRect(
                        this.inventoryBoxPosition.x,
                        this.inventoryBoxPosition.y,
                        this.inventoryBoxPosition.width,
                        this.inventoryBoxPosition.height,
                        10
                    )
                    .lineStyle(2, originalColor, 1)
                    .strokeRoundedRect(
                        this.inventoryBoxPosition.x,
                        this.inventoryBoxPosition.y,
                        this.inventoryBoxPosition.width,
                        this.inventoryBoxPosition.height,
                        10
                    );

                flashCount++;
                this.scene.time.delayedCall(duration, flash);
            });
        };

        flash();
    }

    // Player obtains a timecharm and passes to the next level
    createTimeCharm(scene) {

        scene.player.canMove = false;

        // Current level
        const currentLevelNum = this.level.substring(this.level.length - 1, this.level.length); // Last letter

        // Create next level
        const nextLevelText = scene.add.text(
            scene.cameras.main.centerX, // X: Center of screen
            scene.cameras.main.centerY - 50, // Y: Slightly above center
            'CHARME TEMPOREL ACQUIS!\nVEUILLEZ CLIQUER SUR\n"CONTINUER"\nPOUR LE PROCHAIN NIVEAU.', 
            {
                fontFamily: 'noita',
                fontSize: '80px',
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                padding: { left: 30, right: 30, top: 15, bottom: 15 },
                centerX: true,
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101);

        // Player has reached the required fragments count
        if (scene.player.fragmentsCount == scene.fragmentsReq){

            nextLevelText.setText('CHARME TEMPOREL ACQUIS!\nVEUILLEZ CLIQUER SUR\n"CONTINUER"\nPOUR LE PROCHAIN NIVEAU.');

            // Allow user to play next level when they click on continue
            localStorage.setItem("lastGame", JSON.stringify({
                level: `${this.level.substring(0, this.level.length - 1)}${parseInt(currentLevelNum) + 1}`,
                checkpoint: 0
            }));
            
            // Next level text flashing
            scene.tweens.add({
                targets: nextLevelText, 
                alpha: 0,           
                duration: 2000,
                delay: 2000,       
                onComplete: () => {
                    nextLevelText.destroy(); // Remove text after fade

                    switch (this.level) {
                        case "Level1":
                            this.addTimeCharm("1"); // Add first time charm
                            break;
                        case "Level2":
                            this.addTimeCharm("2");  // Add second time charm
                            break;
                        case "Level3":
                            this.addTimeCharm("3");  // Add third time charm
                            break;
                    }
                    // Update fragment count and inventory
                    scene.player.fragmentCount = 0;
                    this.updateFragmentCount(scene.player.fragmentCount);
                    this.flashInventoryBorder();

                    // Reload site
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            });
        // Player has not collected all temporal fragments yet
        } else {
            scene.player.isInteractActive = false;
            scene.player.isInteractOpen = false;

            nextLevelText.setText(`IL VOUS RESTE ${scene.fragmentsReq-scene.player.fragmentsCount} FRAGMENTS\nPOUR OBTENIR LA CHARME.`);

            scene.tweens.add({
                targets: nextLevelText, 
                alpha: 0,           
                duration: 2000,
                delay: 2000,       
                onComplete: () => {
                    nextLevelText.destroy(); // Remove text after fade
                    scene.player.canMove = true;
                }
            });
        }
    }
}
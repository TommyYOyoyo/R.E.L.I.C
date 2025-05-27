
export default class PlayerUI {
    constructor(scene) {
        this.scene = scene;
        this.totalTime;
        this.level = JSON.parse(localStorage.getItem('lastGame')).level;
        if (this.level == "Level1") {
            this.totalTime = 180;
        } else if (this.level == "Level2") {
            this.totalTime = 420;
        } else if (this.level == "Level3") {
            this.totalTime = 560;
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
                font: '20px noita',
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
    }

    // Add this method to update the fragment counter
    updateFragmentCount(count) {
        this.temporalFragments = count;
        this.fragmentText.setText(`x${count}`);
    }

    // Add this method to add a time charm to the inventory
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
        
        // Add new charm icons
        this.timeCharms.forEach((charm, index) => {
            const x = 60 + 35 + (index * 55);
            const y = this.scene.cameras.main.height - 160 + 70;
            
            const icon = this.scene.add.image(x, y, `charm_${charm}`)
                .setScrollFactor(0)
                .setDepth(1002)
                .setScale(0.8);
                
            this.timeCharmIcons.push(icon);
        });
    }
}

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
}
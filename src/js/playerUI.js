export default class PlayerUI {
    constructor(scene) {
        this.scene = scene;
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.totalTime = 300;
        this.timeUp = false;
        
        this.createTimerText();
        this.createHealthBar();
        this.startCountdown();
    }

    createHealthBar() {
        const { width, height } = this.scene.cameras.main;
        this.healthBar = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(30);
        
        this.drawHealthBar();
    }

    drawHealthBar() {
        const { width, height } = this.scene.cameras.main;
        const barWidth = 400;
        const barHeight = 25;
        const x = 20;
        const y = height - 50;

        this.healthBar.clear()
            .fillStyle(0x333333)
            .fillRoundedRect(x, y, barWidth, barHeight, 5)
            .fillStyle(this.getHealthColor())
            .fillRoundedRect(x, y, (this.currentHealth/this.maxHealth)*barWidth, barHeight, 5);
    }

    updateHealth(newHealth) {
        this.currentHealth = Phaser.Math.Clamp(newHealth, 0, this.maxHealth);
        this.drawHealthBar();
        
        // Show game over when health reaches zero
        if (this.currentHealth <= 0) {
            this.handleGameOver();
        }
    }

    getHealthColor() {
        if(this.currentHealth < 30) return 0xFF0000;
        if(this.currentHealth < 60) return 0xFFA500;
        return 0x00FF00;
    }

    createTimerText() {
        this.timerText = this.scene.add.text(
            this.scene.cameras.main.width/2, 
            30,
            '00:30',
            {
                font: '50px noita',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(51);
    }

    startCountdown() {
        this.updateTimerText();
        
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if(this.timeUp) return;
                
                this.totalTime--;
                this.updateTimerText();
                
                if(this.totalTime <= 0) {
                    this.timeUp = true;
                    this.handleGameOver();
                }
            },
            loop: true
        });
    }

    handleGameOver() {
        // Freeze game state
        this.scene.physics.pause();
        this.scene.sound.stopAll();

        // Update timer text
        this.timerText.setText("Game Over")
            .setOrigin(0.5)
            .setDepth(51);

        // Create full-black overlay
        this.blackOverlay = this.scene.add.rectangle(
            0, 0,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(50)
        .setAlpha(0);

        // Slow zoom in on timer (3 seconds)
        this.scene.cameras.main.zoomTo(2, 3000, 'Linear', true, (camera, progress) => {
            if (progress === 1) {
                this.showGameOverScreen();
            }
        });

        // Fade to black
        this.scene.tweens.add({
            targets: this.blackOverlay,
            alpha: 0.8,
            duration: 3000
        });
    }

    showGameOverScreen() {
        const { width, height } = this.scene.cameras.main;

        // Create panel background (fixed to screen)
        const panelBackground = this.scene.add.graphics()
            .fillStyle(0x000000, 0.9)
            .fillRoundedRect(width/2 - 250, height/2 - 150, 500, 300, 20)
            .setScrollFactor(0)
            .setDepth(50);

        // Create RETRY button (fixed to screen)
        const retryButton = this.scene.add.text(width/2, height/2 - 40, 'REESSAYER', {
            fontFamily: 'noita',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { left: 30, right: 30, top: 15, bottom: 15 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => retryButton.setBackgroundColor('#555555'))
        .on('pointerout', () => retryButton.setBackgroundColor('#444444'))
        .on('pointerdown', () => {
            this.scene.scene.restart();
        })
        .setDepth(51);

        // Create MENU button (fixed to screen)
        const menuButton = this.scene.add.text(width/2, height/2 + 40, 'RETOUR AU MENU', {
            fontFamily: 'noita',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { left: 30, right: 30, top: 15, bottom: 15 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => menuButton.setBackgroundColor('#555555'))
        .on('pointerout', () => menuButton.setBackgroundColor('#444444'))
        .on('pointerdown', () => {
            this.scene.scene.start('MainMenu');
        })
        .setDepth(51);

        // Fade in buttons
        retryButton.setAlpha(0);
        menuButton.setAlpha(0);
        panelBackground.setAlpha(0);
        
        this.scene.tweens.add({
            targets: [retryButton, menuButton, panelBackground],
            alpha: 1,
            duration: 1000
        });
    }

    updateTimerText() {
        const minutes = Math.floor(this.totalTime / 60);
        const seconds = this.totalTime % 60;
        this.timerText.setText(
            `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`
        );
    }
}
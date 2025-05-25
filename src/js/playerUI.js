export default class PlayerUI {
    constructor(scene) {
        this.scene = scene;
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.totalTime = 5;
        this.timeUp = false;
        
        this.createTimerText();
        this.createHealthBar();
        this.startCountdown();
    }

    createHealthBar() {
        const { width, height } = this.scene.cameras.main;
        this.healthBar = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(Number.MAX_SAFE_INTEGER - 10);
        
        this.drawHealthBar();
    }

    drawHealthBar() {
        const { width, height } = this.scene.cameras.main;
        const barWidth = 300;
        const barHeight = 25;
        const x = 20;
        const y = height - 50;

        this.healthBar.clear()
            .fillStyle(0x333333)
            .fillRoundedRect(x, y, barWidth, barHeight, 5)
            .fillStyle(this.getHealthColor())
            .fillRoundedRect(x, y, (this.currentHealth/this.maxHealth)*barWidth, barHeight, 5);
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
            '05:00',
            {
                font: '32px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(Number.MAX_SAFE_INTEGER);
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
                    this.handleTimeUp();
                }
            },
            loop: true
        });
    }

    handleTimeUp() {
        // Freeze game state
        this.scene.physics.pause();
        this.scene.sound.stopAll();
        
        // Update timer text
        this.timerText.setText("L'heros a pris trop de temps...")
            .setOrigin(0.5)
            .setDepth(Number.MAX_SAFE_INTEGER);

        // Create overlay
        this.blackOverlay = this.scene.add.rectangle(
            0, 0, 
            this.scene.cameras.main.width * 2, 
            this.scene.cameras.main.height * 2, 
            0x000000
        )
        .setOrigin(0)
        .setDepth(Number.MAX_SAFE_INTEGER - 5)
        .setAlpha(0);

        // Start sequence
        this.scene.tweens.add({
            targets: this.scene.cameras.main,
            zoom: 2,
            duration: 3000,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this.blackOverlay,
                    alpha: 0.9,
                    duration: 2000,
                    onComplete: () => this.showGameOverScreen()
                });
            }
        });
    }

    showGameOverScreen() {
        const { width, height } = this.scene.cameras.main;
        
        // Create centered game over panel
        this.gameOverPanel = this.scene.rexUI.add.buttons({
            x: width/2,
            y: height/2,
            orientation: 'vertical',
            buttons: [
                this.createMenuButton('RETOUR AU MENU', 'MainMenu'),
                this.createMenuButton('REESSAYER', this.scene.scene.key)
            ],
            space: { item: 20 }
        })
        .setDepth(Number.MAX_SAFE_INTEGER)
        .setAlpha(0)
        .layout();

        // Center the panel contents
        this.gameOverPanel.children.each(child => {
            child.setOrigin(0.5).setPosition(width/2, height/2);
        });

        // Fade in panel
        this.scene.tweens.add({
            targets: this.gameOverPanel,
            alpha: 1,
            duration: 1000
        });
    }

    createMenuButton(text, targetScene) {
        return this.scene.rexUI.add.label({
            width: 400,
            height: 80,
            background: this.scene.rexUI.add.roundRectangle(0,0,0,0, 20, 0x444444),
            text: this.scene.add.text(0,0, text, {
                fontSize: '32px',
                fontFamily: 'minecraft',
                color: '#FFFFFF'
            }),
            space: { left: 30, right: 30 },
            align: 'center'
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            this.scene.sound.play('hover');
            this.getElement('background').setFillStyle(0x666666);
        })
        .on('pointerout', () => {
            this.getElement('background').setFillStyle(0x444444);
        })
        .on('pointerdown', () => {
            this.scene.sound.play('click');
            this.scene.cameras.main.fadeOut(1000, 0, 0, 0);
            this.scene.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.scene.start(targetScene);
            });
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

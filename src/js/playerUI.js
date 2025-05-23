/**
 * @author Ray Lam
 * @version beta
 * @note Universal player functions
 * @comment I AM NOT DOING IT FULL JS ;-;
 */

export default class PlayerUI {
    constructor(scene) {
        this.scene = scene;
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.createHealthBar();
    }

    createHealthBar() {
        // Create health bar container with graphics for rounded corners
        this.healthBarContainer = this.scene.add.graphics();
        this.healthBar = this.scene.add.graphics();
        
        // Set positions and depth
        this.healthBarContainer.setPosition(20, 40)
            .setDepth(100)
            .setScrollFactor(0);
            
        this.healthBar.setPosition(20, 40)
            .setDepth(101)
            .setScrollFactor(0);

        // Draw the health bar elements
        this.drawHealthBar();
    }

    drawHealthBar() {
        const width = 700;
        const height = 25;
        const radius = 5;
        const healthWidth = (this.currentHealth / this.maxHealth) * width;

        // Clear previous drawings
        this.healthBarContainer.clear();
        this.healthBar.clear();

        // Draw background (container)
        this.healthBarContainer.fillStyle(0x555555, 1);
        this.healthBarContainer.fillRoundedRect(0, 0, width, height, radius);
        this.healthBarContainer.lineStyle(1, 0x000000, 0.3);
        this.healthBarContainer.strokeRoundedRect(0, 0, width, height, radius);

        // Draw health bar
        let healthColor;
        if (this.currentHealth < 30) {
            healthColor = 0xFF0000; // red
        } else if (this.currentHealth < 60) {
            healthColor = 0xFFA500; // orange
        } else {
            healthColor = 0xFF9100; // original color
        }
        
        this.healthBar.fillStyle(healthColor, 1);
        this.healthBar.fillRoundedRect(0, 0, healthWidth, height, radius);
    }

    changeHealth(amount) {
        this.currentHealth = Phaser.Math.Clamp(
            this.currentHealth + amount, 
            0, 
            this.maxHealth
        );

        // Redraw health bar with new values
        this.drawHealthBar();

        // Add smooth transition effect
        this.scene.tweens.add({
            targets: this.healthBar,
            scaleX: this.currentHealth / this.maxHealth,
            duration: 200,
            ease: 'Power1',
            onUpdate: () => {
                this.drawHealthBar(); // Redraw during tween
            }
        });
    }

    setHealth(health) {
        this.currentHealth = Phaser.Math.Clamp(health, 0, this.maxHealth);
        this.drawHealthBar();
    }
}
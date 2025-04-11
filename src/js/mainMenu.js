import Phaser from 'phaser';

const menuStyle = {
    title: {
        fontFamily: '"Press Start 2P"',
        fontSize: '48px',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4
    },
    button: {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2
    }
};

export function createMenu(scene) {
    const { width, height } = scene.cameras.main;
    
    // Create capture of current game state
    const rt = scene.add.renderTexture(0, 0, width, height)
        .setOrigin(0)
        .setDepth(999);

    // Draw all existing objects except potential previous menu elements
    scene.children.each(child => {
        if (child.type !== 'RenderTexture' && child.depth < 999) {
            rt.draw(child);
        }
    });

    // Apply blur using PostFX pipeline
    rt.postFX.addBlur(8, 8, 0.5, 2);
    
    // Add dark overlay
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6)
        .setOrigin(0)
        .setDepth(1000);
    
    // Create menu title
    const title = scene.add.text(width/2, height/2 - 150, 'R.E.L.I.C', menuStyle.title)
        .setOrigin(0.5)
        .setDepth(1001);
    
    // Create buttons
    const newGameButton = createButton(scene, width/2, height/2 - 30, 'New Game', () => {
        scene.scene.restart();
        removeMenu(scene);
    });
    
    const continueButton = createButton(scene, width/2, height/2 + 50, 'Continue', () => {
        removeMenu(scene);
    });
    
    // Store references
    scene.menuElements = { rt, overlay, title, newGameButton, continueButton };
    
    // Pause game
    scene.scene.pause();
    scene.input.keyboard.enabled = false;
}

export function removeMenu(scene) {
    if (!scene.menuElements) return;
    
    // Remove all menu elements
    Object.values(scene.menuElements).forEach(element => element.destroy());
    scene.menuElements = null;
    
    // Resume game
    scene.scene.resume();
    scene.input.keyboard.enabled = true;
}

function createButton(scene, x, y, text, callback) {
    const btn = scene.add.text(x, y, text, menuStyle.button)
        .setOrigin(0.5)
        .setDepth(1001)
        .setInteractive({ useHandCursor: true });
    
    // Hover effects
    btn.on('pointerover', () => {
        btn.setScale(1.1);
        btn.setColor('#FFD700');
    });
    
    btn.on('pointerout', () => {
        btn.setScale(1);
        btn.setColor('#FFFFFF');
    });
    
    btn.on('pointerdown', callback);
    
    return btn;
}
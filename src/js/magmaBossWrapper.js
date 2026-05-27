import MagmaBoss from "./finalBoss.js";

// No external assets required for logic-only boss; placeholder load function
function loadMagmaAssets(scene) {
    // If you later add a spritesheet, load it here, e.g.
    // Load the boss spritesheet so Phaser can display and animate frames.
    scene.load.spritesheet('magmaBoss', '/assets/img/magmaBoss.png', { frameWidth: 288, frameHeight: 166 });
}

function createMagmaAnimations(scene) {
    // noop for now — MagmaBoss uses its own animation logic
}

function spawnMagmaBoss(scene) {
    // find spawn point similar to knightSpawn/boss
    let spawnPoint = scene.enemySpawns?.find((sp) => sp.name === "knightSpawn");
    if (!spawnPoint) spawnPoint = scene.bossSpawns?.find((sp) => sp.name === "boss");
    if (!spawnPoint) spawnPoint = scene.bossSpawns?.[0];
    if (!spawnPoint) {
        console.error("magma boss spawn point not found");
        return null;
    }

    // spawnPoint coordinates are already scaled by `spawnObjects()` when created
    const x = spawnPoint.x;
    const y = spawnPoint.y;

    // Create logic instance (units in pixels). MagmaBoss expects position x,y and target
    const logic = new MagmaBoss({ x: x, y: y, target: scene.player });

    // Create a visible sprite for the boss using the loaded spritesheet
    const sprite = scene.add.sprite(x, y - logic.spriteHeight / 2, 'magmaBoss').setOrigin(0.5, 0.5).setDepth(20);
    scene.physics.add.existing(sprite);
    sprite.body.setCollideWorldBounds(true);
    sprite.body.setAllowGravity(true);

    // Compute number of columns (frames per row) in the spritesheet
    let cols = 1;
    try {
        const src = scene.textures.get('magmaBoss').getSourceImage();
        cols = Math.max(1, Math.floor(src.width / logic.spriteWidth));
    } catch (err) {
        // fallback
        cols = 10;
    }

    // Health UI
    const barWidth = 600, barHeight = 40;
    const barX = scene.cameras.main.width / 2, barY = scene.cameras.main.height - 70;
    const healthbarBg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000, 0.8).setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0).setVisible(false);
    const healthbarFill = scene.add.rectangle(barX, barY, barWidth, barHeight, 0xff4500, 1).setOrigin(0.5, 0.5).setDepth(101).setScrollFactor(0).setVisible(false);
    const nameText = scene.add.text(barX, barY - 40, "MAGMATRON", { fontSize: "28px", fontFamily: "monospace", color: "#ffffff", stroke: "#000000", strokeThickness: 4, fontWeight: "bold" }).setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0).setVisible(false);

    // Minimal hitboxes placeholders so player code which overlaps boss hitboxes doesn't crash
    const attackHitbox = scene.add.rectangle(x, y, 300, 200, 0xff0000, 0.0).setOrigin(0.5, 0.5);
    scene.physics.add.existing(attackHitbox);
    attackHitbox.body.setAllowGravity(false).setImmovable(true);

    const thrustHitbox = scene.add.rectangle(x, y, 200, 20, 0x00ff00, 0.0).setOrigin(0.5, 0.5);
    scene.physics.add.existing(thrustHitbox);
    thrustHitbox.body.setAllowGravity(false).setImmovable(true);

    const chargeHitbox = scene.add.rectangle(x, y, 300, 180, 0xffff00, 0.0).setOrigin(0.5, 0.5);
    scene.physics.add.existing(chargeHitbox);
    chargeHitbox.body.setAllowGravity(false).setImmovable(true);

    const comboHitbox = scene.add.rectangle(x, y, 300, 200, 0xff66ff, 0.0).setOrigin(0.5, 0.5);
    scene.physics.add.existing(comboHitbox);
    comboHitbox.body.setAllowGravity(false).setImmovable(true);

    // wrapper object to mimic knight boss interface where useful
    const boss = sprite;
    boss._magmaLogic = logic;
    boss._magmaCols = cols;
    boss._isMagmaBoss = true;
    boss.health = logic.hp;
    boss.maxHealth = logic.maxHp;
    boss.isDead = logic.dead;
    boss.healthbarBg = healthbarBg;
    boss.healthbarFill = healthbarFill;
    boss.nameText = nameText;
    boss.attackHitbox = attackHitbox;
    boss.thrustHitbox = thrustHitbox;
    boss.chargeHitbox = chargeHitbox;
    boss.comboHitbox = comboHitbox;

    boss.setHealthbarVisible = (visible) => {
        healthbarBg.setVisible(visible);
        healthbarFill.setVisible(visible);
        nameText.setVisible(visible);
        if (visible) {
            const percent = boss.health / boss.maxHealth;
            healthbarFill.width = barWidth * percent;
        }
    };

    // basic takeDamage adapter used by knightBoss.bossTakeDamage if delegated
    boss._magmaTakeDamage = (amount) => {
        logic.takeDamage(amount);
        boss.health = logic.hp;
        if (boss.health <= 0) boss.isDead = true;
    };

    scene.boss = boss;
    return boss;
}

function updateMagmaBoss(scene) {
    const boss = scene.boss;
    if (!boss || !boss._isMagmaBoss) return;

    const logic = boss._magmaLogic;
    const dt = scene.game.loop.delta / 1000; // seconds
    logic.target = scene.player; // update target reference
    logic.update(dt, { player: scene.player });

    // sync visual position
    boss.x = logic.x;
    boss.y = logic.y - logic.spriteHeight / 2;
    if (boss.body) {
        boss.body.x = boss.x - boss.displayWidth / 2;
        boss.body.y = boss.y - boss.displayHeight / 2;
    }

    // Animate sprite by mapping MagmaBoss animation frame to spritesheet frame index
    try {
        const anim = logic.animations[logic.state] || logic.animations.idle;
        const frameIdx = (anim.row * (boss._magmaCols || 1)) + logic.animFrame;
        if (typeof boss.setFrame === 'function') boss.setFrame(frameIdx);
        boss.setFlipX(logic.facing < 0);
    } catch (err) {
        // ignore animation mapping errors
    }

    // update hitboxes positions roughly
    boss.attackHitbox.x = boss.x;
    boss.attackHitbox.y = boss.y;
    boss.comboHitbox.x = boss.x;
    boss.comboHitbox.y = boss.y;
    boss.thrustHitbox.x = boss.x + (logic.facing < 0 ? -220 : 220);
    boss.thrustHitbox.y = boss.y + 40;
    boss.chargeHitbox.x = boss.x + (logic.facing < 0 ? -100 : 100);
    boss.chargeHitbox.y = boss.y;

    // sync health UI
    boss.health = logic.hp;
    boss.maxHealth = logic.maxHp;
    if (boss.healthbarBg.visible) {
        const barWidth = 600;
        const percent = boss.health / boss.maxHealth;
        boss.healthbarFill.width = barWidth * percent;
    }

    // handle death
    if (logic.dead && !boss._destroyed) {
        boss._destroyed = true;
        boss.destroy();
        boss.attackHitbox.destroy();
        boss.thrustHitbox.destroy();
        boss.chargeHitbox.destroy();
        boss.comboHitbox.destroy();
        boss.healthbarBg.destroy();
        boss.healthbarFill.destroy();
        boss.nameText.destroy();
        scene.boss = null;
    }
}

export { loadMagmaAssets, createMagmaAnimations, spawnMagmaBoss, updateMagmaBoss };

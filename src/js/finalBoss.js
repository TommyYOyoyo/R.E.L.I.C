/**
 * Final Boss — Calamité Temporelle, the Bringer of Death
 * @author Honglue Zheng
 * @note Final boss for level 5. Fully written this year in v2 as of 2026
 */

// Linear interpolation for boss difficulty scaling
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Play a boss SFX only when the sound key exists in the current scene cache.
function playBossSfx(scene, key, config = {}) {
    if (!scene || !scene.sound || !scene.cache || !scene.cache.audio) return;
    if (!scene.cache.audio.exists(key)) return;
    scene.sound.play(key, config);
}

// When player wins
function playVictorySequence(scene) {
    if (!scene || scene._finalBossVictoryPlayed) return;
    scene._finalBossVictoryPlayed = true;

    const { width, height } = scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const burstRadius = Math.max(width, height) * 1.35;

    if (scene.sound && scene.sound.get && scene.sound.get("chaos-construct")) {
        scene.sound.get("chaos-construct").stop();
    }

    if (scene.music && scene.music.stop) {
        scene.music.stop();
    }

    scene.sound.play("victory");

    // Burst effect
    const burst = scene.add.circle(centerX, centerY, 6, 0xffffff, 1)
        .setDepth(5000)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScrollFactor(0);

    // White wash effect
    const whiteWash = scene.add.rectangle(0, 0, width, height, 0xffffff, 0)
        .setOrigin(0)
        .setDepth(5001)
        .setScrollFactor(0);

    // Victory text
    const victoryText = scene.add.text(centerX, centerY, "Espace temporel restauré!", {
        fontFamily: "noita",
        fontSize: "150px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
    })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(5002)
        .setScrollFactor(0);

    scene.tweens.add({
        targets: burst,
        radius: burstRadius,
        alpha: 0,
        duration: 1400,
        ease: "Cubic.easeOut",
        onUpdate: () => {
            whiteWash.setAlpha(Math.min(1, burst.radius / burstRadius));
        },
        onComplete: () => {
            burst.destroy();
        },
    });

    scene.tweens.add({
        targets: whiteWash,
        alpha: 1,
        duration: 1500,
        ease: "Sine.easeOut",
    });

    scene.time.delayedCall(900, () => {
        scene.tweens.add({
            targets: victoryText,
            alpha: 1,
            duration: 500,
            ease: "Sine.easeOut",
        });
    });
}

// ─── ASSET LOADING ─────────────────────────────────────────────────────────────

// Load boss spritesheet
function loadFinalBossAssets(scene) {
    scene.load.spritesheet('finalBoss',
        '/assets/img/finalBoss/SpriteSheet/Bringer-of-Death-SpritSheet.png',
        { frameWidth: 140, frameHeight: 93 }
    );
}

// Create Phaser animation defs from the spritesheet
function createFinalBossAnimations(scene) {
    // Row 0: idle (frames 0–7)
    if (!scene.anims.exists('fbIdle')) {
        scene.anims.create({
            key: 'fbIdle',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });
    }

    // Row 1: walk (frames 8–15)
    if (!scene.anims.exists('fbWalk')) {
        scene.anims.create({
            key: 'fbWalk',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 8, end: 15 }),
            frameRate: 10,
            repeat: -1,
        });
    }

    // Run — same walk frames, faster
    if (!scene.anims.exists('fbRun')) {
        scene.anims.create({
            key: 'fbRun',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 8, end: 15 }),
            frameRate: 16,
            repeat: -1,
        });
    }

    // Row 2: attack/slam (frames 16–23)
    if (!scene.anims.exists('fbAttack')) {
        scene.anims.create({
            key: 'fbAttack',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 16, end: 23 }),
            frameRate: 8,
            repeat: 0,
        });
    }

    // Row 3: cast/summon (frames 24–31)
    if (!scene.anims.exists('fbCast')) {
        scene.anims.create({
            key: 'fbCast',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 24, end: 31 }),
            frameRate: 10,
            repeat: 0,
        });
    }

    // Row 4: death (frames 32–39)
    if (!scene.anims.exists('fbDeath')) {
        scene.anims.create({
            key: 'fbDeath',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 32, end: 39 }),
            frameRate: 7,
            repeat: 0,
        });
    }

    // Hurt — first 3 frames of row 4
    if (!scene.anims.exists('fbHurt')) {
        scene.anims.create({
            key: 'fbHurt',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 32, end: 34 }),
            frameRate: 8,
            repeat: 0,
        });
    }

    // Row 6: teleport portal start (frames 48–55)
    if (!scene.anims.exists('fbTeleport')) {
        scene.anims.create({
            key: 'fbTeleport',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 48, end: 55 }),
            frameRate: 12,
            repeat: 0,
        });
    }

    // Row 7: teleport portal end (frames 56–63)
    if (!scene.anims.exists('fbTeleportEnd')) {
        scene.anims.create({
            key: 'fbTeleportEnd',
            frames: scene.anims.generateFrameNumbers('finalBoss', { start: 56, end: 63 }),
            frameRate: 12,
            repeat: 0,
        });
    }
}

// ─── BOSS HEALTHBAR with animations ───────────────────────────────────────────────────────────

// Multi-layered healthbar with charge-up animation
function createHealthbar(scene) {

    const camW = scene.cameras.main.width;
    const camH = scene.cameras.main.height;
    const barWidth = 600, barHeight = 18;
    const barX = camW / 2;
    const barY = camH - 60;

    // Create the outline
    const borderGlow = scene.add.rectangle(barX, barY, barWidth + 12, barHeight + 12, 0xff6600, 0.6)
        .setOrigin(0.5, 0.5).setDepth(99).setScrollFactor(0).setVisible(false);
    const borderInner = scene.add.rectangle(barX, barY, barWidth + 6, barHeight + 6, 0x111111, 0.95)
        .setOrigin(0.5, 0.5).setDepth(99).setScrollFactor(0).setVisible(false);
    const bg = scene.add.rectangle(barX, barY, barWidth, barHeight, 0x1a1a1a, 0.9)
        .setOrigin(0.5, 0.5).setDepth(100).setScrollFactor(0).setVisible(false);
    const trail = scene.add.rectangle(barX, barY, barWidth, barHeight, 0xffcc44, 0.7)
        .setOrigin(0.5, 0.5).setDepth(101).setScrollFactor(0).setVisible(false);
    const fill = scene.add.rectangle(barX, barY, barWidth, barHeight, 0xff4500, 1)
        .setOrigin(0.5, 0.5).setDepth(102).setScrollFactor(0).setVisible(false);
    const shine = scene.add.rectangle(barX, barY - barHeight / 4, barWidth, barHeight / 4, 0xffffff, 0.15)
        .setOrigin(0.5, 0.5).setDepth(103).setScrollFactor(0).setVisible(false);

    // Text
    const nameText = scene.add.text(barX, barY - 30, "CALAMITÉ TEMPORELLE", {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#ffcc44",
        stroke: "#000000",
        strokeThickness: 5,
        fontWeight: "bold",
    }).setOrigin(0.5, 0.5).setDepth(104).setScrollFactor(0).setVisible(false);

    // Notches (graduations)
    const notches = [];
    for (let i = 1; i <= 3; i++) {
        const nx = barX - barWidth / 2 + (barWidth * i / 4);
        const notch = scene.add.rectangle(nx, barY, 2, barHeight + 4, 0x333333, 0.8)
            .setOrigin(0.5, 0.5).setDepth(103).setScrollFactor(0).setVisible(false);
        notches.push(notch);
    }

    // Return the object
    return {
        borderGlow, borderInner, bg, trail, fill, shine, nameText, notches,
        barWidth, barHeight, barX, barY,
        trailPercent: 1,
        chargePercent: 0,
        isCharging: false,
        chargeComplete: false,
        glowPulseTime: 0,
    };
}

// Healthbar update — handles charge-up animation, trail effect, and glow pulse
function updateFancyHealthbar(scene, boss, dt) {
    // Show healthbar when player gets close
    if (!boss.healthbarShown && !boss.isDead) {
        const player = scene.player;
        if (player) {
            const distYToBoss = Math.abs(player.y - boss.y);
            const distXToBoss = Math.abs(player.x - boss.x);
            if (distXToBoss < 600 && distYToBoss < 50) {
                // Play boss music
                if (scene.music && scene.music.key !== "chaos-construct") {
                    scene.music.stop();
                }
                if (!scene.music || scene.music.key !== "chaos-construct") {
                    scene.music = scene.sound.add("chaos-construct", {
                        loop: true,
                        volume: 0.25,
                    });
                }
                if (scene.music && !scene.music.isPlaying) {
                    scene.music.play();
                }
                boss.healthbarShown = true;
                boss.setHealthbarVisible(true);
            }
        }
    }

    if (!boss.healthbarShown) return; // Return early if healthbar not shown

    const h = boss.hb;                     // Reference to healthbar
    const camW = scene.cameras.main.width;
    const camH = scene.cameras.main.height;
    const barX = camW / 2;
    const barY = camH - 60;

    // Reposition all elements
    h.borderGlow.setPosition(barX, barY);
    h.borderInner.setPosition(barX, barY);
    h.bg.setPosition(barX, barY);
    h.trail.setPosition(barX, barY);
    h.fill.setPosition(barX, barY);
    h.shine.setPosition(barX, barY - h.barHeight / 4);
    h.nameText.setPosition(barX, barY - 30);
    for (let i = 0; i < h.notches.length; i++) {
        const nx = barX - h.barWidth / 2 + (h.barWidth * (i + 1) / 4);
        h.notches[i].setPosition(nx, barY);
    }

    // Charge-up animation (cubic ease-out)
    if (h.isCharging) {
        h.chargePercent += dt / 1.5;
        if (h.chargePercent >= 1) {
            h.chargePercent = 1;
            h.isCharging = false;
            h.chargeComplete = true;
        }
        const eased = 1 - Math.pow(1 - h.chargePercent, 3);
        h.fill.width = h.barWidth * eased;
        h.trail.width = h.barWidth * eased;
        h.shine.width = h.barWidth * eased;
        h.borderGlow.setAlpha(0.3 + eased * 0.5);
        return;
    }

    // Normal HP tracking
    const percent = Math.max(0, boss.health / boss.maxHealth);
    h.fill.width = h.barWidth * percent;
    h.shine.width = h.barWidth * percent;

    // Trail catches up slowly to show damage dealt similarly to in other games
    if (h.trailPercent > percent) {
        h.trailPercent -= dt * 0.3;
        if (h.trailPercent < percent) h.trailPercent = percent;
    } else {
        h.trailPercent = percent;
    }
    h.trail.width = h.barWidth * h.trailPercent;

    // Color shifts based on aggression
    if (boss.aggression > 0.5) {
        h.fill.setFillStyle(0xff2200);
        h.trail.setFillStyle(0xff6644);
        h.borderGlow.setFillStyle(0xff2200, 0.6);
        h.nameText.setColor("#ff4444");
    } else {
        h.fill.setFillStyle(0xff4500);
        h.trail.setFillStyle(0xffcc44);
        h.borderGlow.setFillStyle(0xff6600, 0.6);
    }

    // Glow pulse
    h.glowPulseTime += dt;
    const pulseAlpha = 0.4 + Math.sin(h.glowPulseTime * 3) * 0.2;
    h.borderGlow.setAlpha(pulseAlpha);

    // Urgent pulse when low HP
    if (percent < 0.25) {
        const urgentPulse = 0.5 + Math.sin(h.glowPulseTime * 8) * 0.3;
        h.borderGlow.setAlpha(urgentPulse);
        h.borderGlow.setFillStyle(0xff0000, 0.8);
    }
}

// ─── SPAWN ─────────────────────────────────────────────────────────────────────

// Spawn the boss sprite, hitboxes, and health UI
function spawnFinalBoss(scene) {
    // Find boss spawn points
    let spawnPoint = scene.bossSpawns?.find((sp) => sp.name === "bossSpawn");
    if (!spawnPoint) spawnPoint = scene.bossSpawns?.find((sp) => sp.name === "boss");
    if (!spawnPoint) spawnPoint = scene.bossSpawns?.[0];
    if (!spawnPoint) {
        console.error("final boss spawn point not found");
        return null;
    }

    const x = spawnPoint.x;
    const y = spawnPoint.y;

    // Create the visible sprite (origin bottom-center)
    const boss = scene.physics.add.sprite(x, y - 40, 'finalBoss')
        .setOrigin(0.5, 1)
        .setScale(2.5)
        .setDepth(4);

    // Boss physics body
    boss.body.setSize(30, 58);
    boss.body.setOffset(90, 33);
    boss.body.setCollideWorldBounds(true);
    boss.body.setGravityY(1000);

    boss.play('fbIdle'); // Boss is idling

    // =============== BOSS PROPERTIES ===============

    // Health system
    boss.health = 35;
    boss.maxHealth = 35;
    boss.isDead = false;
    boss.isFinalBoss = true;

    // Facing direction: 1 = right, -1 = left
    boss.facing = 1;

    // Base movement speeds (pixels per second) — scaled by aggression
    boss.baseWalkSpeed = 70;
    boss.baseRunSpeed = 180;
    boss.walkSpeed = boss.baseWalkSpeed;
    boss.runSpeed = boss.baseRunSpeed;

    // States
    boss.state = "idle";
    boss.stateTimer = 0;
    boss.stateDuration = 1.5;

    // Global cooldown — prevents instant state switches
    boss.globalCooldown = 0;

    // Per-attack cooldowns (seconds)
    boss.attackCooldown = 0;
    boss.castCooldown = 0;
    boss.teleportCooldown = 0;

    // Attack properties
    boss.attackDamage = 1;
    boss.attackRange = 220;
    boss.attackHitboxActive = false;
    boss.attackWindUp = 0.7;
    boss.attackHasHit = false;
    boss.attackShook = false;

    // Cast (projectile) properties
    boss.projectiles = [];
    boss.castDamage = 0.5;
    boss.projectileSpeed = 180;
    boss.projectileLifetime = 4;
    boss.castTime = 1.0;
    boss.hasCast = false;

    // Teleport properties
    boss.teleportDuration = 1.2;
    boss.teleportFadeTime = 0.4;
    boss.isTeleporting = false;
    boss.teleportTarget = { x: 0, y: 0 };
    boss.bossAlpha = 1;
    boss.teleportShook = false;

    // Invincibility frames
    boss.invincible = false;
    boss.invincibleTimer = 0;
    boss.hitFlashTimer = 0;

    // Stagger immunity — prevents stunlock
    boss.staggerImmunity = 0;

    // Aggression level: 0.0 (full HP, easy) to 1.0 (near death, brutal)
    boss.aggression = 0;

    boss.aggroed = false;

    // Jump cooldown — boss jumps over tiles when stuck
    boss.jumpCooldown = 0;

    // Base decision weights — scaled by aggression
    boss.baseWeights = {
        idle:     20,
        walk:     25,
        run:      10,
        attack:   15,
        cast:     10,
        teleport: 5,
    };

    // Body offset values for flip correction
    // Character is on the LEFT side of the frame when facing right (default, flipX=false)
    // When flipped, mirror the offset so the body stays on the character
    boss.frameWidth = 140;
    boss.bodyWidth = 30;
    boss.bodyHeight = 58;
    boss.bodyOffsetX = 90;
    boss.bodyOffsetY = 33;

    // ─── Hitboxes ──────────────────────────────────────────────────────────────

    // Attack hitbox — dynamic, follows boss like enemy.js
    const attackHitbox = scene.add.rectangle(x, y, 250, 160, 0xff0000, 0.0).setOrigin(0.5, 0.5);
    scene.physics.add.existing(attackHitbox);
    attackHitbox.body.setAllowGravity(false).setImmovable(true);
    boss.attackHitbox = attackHitbox;

    // Placeholder hitboxes for knightBoss interface compatibility
    const thrustHitbox = scene.add.rectangle(-9999, -9999, 1, 1, 0x000000, 0.0);
    scene.physics.add.existing(thrustHitbox); thrustHitbox.body.setAllowGravity(false).setImmovable(true);
    const chargeHitbox = scene.add.rectangle(-9999, -9999, 1, 1, 0x000000, 0.0);
    scene.physics.add.existing(chargeHitbox); chargeHitbox.body.setAllowGravity(false).setImmovable(true);
    const comboHitbox = scene.add.rectangle(-9999, -9999, 1, 1, 0x000000, 0.0);
    scene.physics.add.existing(comboHitbox); comboHitbox.body.setAllowGravity(false).setImmovable(true);

    boss.thrustHitbox = thrustHitbox;
    boss.chargeHitbox = chargeHitbox;
    boss.comboHitbox = comboHitbox;

    // Projectile physics group with real bodies for collision
    boss.projectileGroup = scene.physics.add.group({
        allowGravity: false,
        immovable: true,
    });
    boss.projectileSprites = [];

    // ─── Healthbar ─────────────────────────────────────────────────────────────

    const hb = createHealthbar(scene);
    boss.hb = hb;
    boss.healthbarBg = hb.bg;
    boss.healthbarFill = hb.fill;
    boss.nameText = hb.nameText;
    boss.healthbarShown = false;

    // Show/hide healthbar with charge-up animation
    boss.setHealthbarVisible = (visible) => {
        const h = boss.hb;
        h.borderGlow.setVisible(visible);
        h.borderInner.setVisible(visible);
        h.bg.setVisible(visible);
        h.trail.setVisible(visible);
        h.fill.setVisible(visible);
        h.shine.setVisible(visible);
        h.nameText.setVisible(visible);
        h.notches.forEach(n => n.setVisible(visible));

        if (visible && !h.chargeComplete) {
            h.isCharging = true;
            h.chargePercent = 0;
            h.fill.width = 0;
            h.trail.width = 0;
        }
    };

    // Take damage — called by knightBoss.js via boss.finalBossTakeDamage
    boss.finalBossTakeDamage = (amount) => {
        if (boss.isDead || boss.invincible) return;

        // Damage reduction
        boss.health -= amount;
        boss.hitFlashTimer = 0.15;
        playBossSfx(scene, "crit", { volume: 0.7 });

        // Boss is dead
        if (boss.health <= 0) {
            boss.health = 0;
            boss.isDead = true;
            boss.state = "death";
            boss.stateTimer = 0;
            boss.shakeRequest = { intensity: 0.02, duration: 800 }; // Shake screen
            return;
        }

        // Stagger if not immune and not in an uninterruptible state
        if (boss.staggerImmunity <= 0 && boss.state !== "attack" && boss.state !== "teleport") {
            setBossState(boss, "hurt"); // Hurt
            boss.invincible = true; // Invincible frame
            boss.invincibleTimer = 0.4;
            boss.staggerImmunity = 1.0;
            boss.globalCooldown = 0.3;
        } else {
            boss.invincible = true;
            boss.invincibleTimer = 0.2;
        }
    };

    // Screen shake request — consumed by update loop
    boss.shakeRequest = null;

    scene.boss = boss;
    return boss;
}

// ─── DYNAMIC HITBOX (like enemy.js) ────────────────────────────────────────────

// Update attack hitbox position based on facing direction
function updateBossHitbox(boss) {
    if (boss.isDead) return;

    const offsetX = 0; // How far in front of the boss

    boss.attackHitbox.y = boss.y - 80;

    if (boss.facing < 0 || boss.flipX) { // Facing left
        boss.attackHitbox.x = boss.x - offsetX;
    } else { // Facing right
        boss.attackHitbox.x = boss.x + offsetX;
    }
}

// ─── STATE MACHINE ─────────────────────────────────────────────────────────────

// Set new state and reset state-specific timers
function setBossState(boss, newState) {
    boss.state = newState;
    boss.stateTimer = 0;

    // Reset per-state flags
    boss.attackHitboxActive = false;
    boss.attackHasHit = false;
    boss.attackShook = false;
    boss.hasCast = false;
    boss.isTeleporting = false;
    boss.teleportShook = false;
    boss.teleportTarget = { x: 0, y: 0 };

    // State-specific durations that scale with aggression
    const a = boss.aggression;
    switch (newState) {
        case "idle":
            boss.stateDuration = lerp(0.6, 0.15, a) + Math.random() * lerp(0.8, 0.2, a);
            break;
        case "walk":
            boss.stateDuration = lerp(1.2, 0.5, a) + Math.random() * lerp(1.5, 0.5, a);
            break;
        case "run":
            boss.stateDuration = lerp(0.8, 0.4, a) + Math.random() * lerp(0.8, 0.3, a);
            break;
        case "attack":
            boss.stateDuration = boss.attackWindUp + 0.72; // wind-up + 8 frames * ~0.09s
            break;
        case "cast":
            boss.stateDuration = boss.castTime + 0.80; // cast + 8 frames * ~0.10s
            break;
        case "teleport":
            boss.stateDuration = boss.teleportDuration;
            playBossSfx(boss.scene, "ender", { volume: 0.8 });
            break;
        case "hurt":
            boss.stateDuration = 0.36; // 3 frames * 0.12s
            break;
    }
}

// Transition to idle with a cooldown — prevents state-stuck bug
function transitionToIdle(boss, cooldown) {
    boss.globalCooldown = cooldown;
    setBossState(boss, "idle");
}

// ─── AGGRESSION ────────────────────────────────────────────────────────────────

// Continuous aggression scaling: 0 at full HP, 1 at 0 HP
// Used power curve so aggression ramps up faster at lower HP
function updateAggression(boss) {
    const hpPercent = boss.health / boss.maxHealth;
    boss.aggression = Math.pow(1 - hpPercent, 1.5);

    const a = boss.aggression;

    // Movement speeds scale up
    boss.walkSpeed = lerp(boss.baseWalkSpeed, 180, a);
    boss.runSpeed = lerp(boss.baseRunSpeed, 380, a);

    // Attack damage scales up
    boss.attackDamage = lerp(1, 2.5, a);
    boss.castDamage = lerp(0.5, 2, a);

    // Wind-up times shrink (less telegraph = harder to dodge)
    boss.attackWindUp = lerp(0.7, 0.25, a);
    boss.castTime = lerp(1.0, 0.4, a);

    // Projectile speed increases
    boss.projectileSpeed = lerp(180, 400, a);
}

// ─── AI DECISION ───────────────────────────────────────────────────────────────

// Get decision weights scaled by aggression
function getScaledWeights(boss) {
    const a = boss.aggression;
    const w = boss.baseWeights;
    return {
        idle:     lerp(w.idle, 3, a),
        walk:     lerp(w.walk, 15, a),
        run:      lerp(w.run, 25, a),
        attack:   lerp(w.attack, 35, a),
        cast:     lerp(w.cast, 25, a),
        teleport: lerp(w.teleport, 20, a),
    };
}

// Weighted random state selection, the goal is to make the boss unpredictable
function chooseNextState(boss, player) {
    if (boss.globalCooldown > 0) return;

    // If no player, idle
    if (!player) {
        setBossState(boss, "idle");
        return;
    }

    // If player is too far away, idle
    const dx = player.x - boss.x;
    const dy = player.y - boss.y
    const distx = Math.abs(dx);
    const disty = Math.abs(dy);

    // Once aggroed, never lose the player
    if (distx < 2000 && disty < 200) boss.aggroed = true;
    if (!boss.aggroed) {
        setBossState(boss, "idle");
        return;
    }

    // Build weighted action list based on distance and cooldowns
    const w = getScaledWeights(boss);
    const candidates = [];

    candidates.push({ state: "idle", weight: w.idle });

    if (distx > 120) {
        candidates.push({ state: "walk", weight: w.walk });
    }
    if (distx > 250) {
        candidates.push({ state: "run", weight: w.run });
    }
    if (distx < boss.attackRange && boss.attackCooldown <= 0) {
        candidates.push({ state: "attack", weight: w.attack });
    }
    if (boss.castCooldown <= 0 && distx > 80) {
        candidates.push({ state: "cast", weight: w.cast });
    }
    if (boss.teleportCooldown <= 0 && distx > 60) {
        candidates.push({ state: "teleport", weight: w.teleport });
    }

    // Weighted random selection
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const candidate of candidates) {
        roll -= candidate.weight;
        if (roll <= 0) {
            setBossState(boss, candidate.state);
            return;
        }
    }

    // Default to idle
    setBossState(boss, "idle");
}

// ─── PROJECTILES ───────────────────────────────────────────────────────────────

// Update projectiles position and lifetime
function updateProjectiles(boss, dt) {
    for (let i = boss.projectiles.length - 1; i >= 0; i--) {
        const proj = boss.projectiles[i];
        // Projectile is not active anymore, remove
        if (!proj.active) {
            boss.projectiles.splice(i, 1);
            continue;
        }

        // Update position
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // Animate projectile
        proj.animTimer += dt;
        if (proj.animTimer >= 0.08) {
            proj.animTimer = 0;
            proj.animFrame = (proj.animFrame + 1) % 8;
        }

        // Lifetime check
        proj.lifetime -= dt;
        if (proj.lifetime <= 0) {
            proj.active = false;
        }
    }
}

// Sync projectile sprites with physics bodies
function syncProjectileSprites(scene, boss) {
    // Remove sprites for dead/removed projectiles
    while (boss.projectileSprites.length > boss.projectiles.length) {
        const old = boss.projectileSprites.pop();
        if (old && old.destroy) {
            boss.projectileGroup.remove(old, true, true);
        }
    }

    // Loop through projectiles
    for (let i = 0; i < boss.projectiles.length; i++) {
        const proj = boss.projectiles[i];

        // Projectile is not active anymore, remove
        if (!proj.active) {
            if (boss.projectileSprites[i]) {
                boss.projectileGroup.remove(boss.projectileSprites[i], true, true);
                boss.projectileSprites[i] = null;
            }
            continue;
        }

        // Create sprite with physics body if needed
        if (!boss.projectileSprites[i] || !boss.projectileSprites[i].active) {
            const projSprite = scene.physics.add.sprite(proj.x, proj.y, 'finalBoss', 48)
                .setScale(1.5)
                .setDepth(25)
                .setAlpha(0.9);

            // Physics body for collision
            projSprite.body.setSize(40, 40);
            projSprite.body.setOffset(50, 26);
            projSprite.body.setAllowGravity(false);
            projSprite.body.setImmovable(true);

            boss.projectileGroup.add(projSprite);
            boss.projectileSprites[i] = projSprite;
        }

        // Update sprite position and animation frame
        const ps = boss.projectileSprites[i];
        if (ps) {
            ps.setPosition(proj.x, proj.y);
            ps.setFrame(48 + (proj.animFrame % 8));
        }
    }

    // Clean up null entries
    boss.projectileSprites = boss.projectileSprites.filter(s => s != null);
}

// ─── PLAYER DAMAGE ─────────────────────────────────────────────────────────────

// Apply damage to the player
function applyDamageToPlayer(scene, player, damage) {
    if (player.isImmune || player.isDead) return;

    player.health = Math.max(0, player.health - damage);

    // Player is not dead
    if (player.health > 0) {
        player.isHurting = true;
        player.isImmune = true;
        if (!player.deathPlayed) player.play("hurt", true);
    } else { // Player is dead
        player.canMove = false;
        player.isDead = true;
        player.deathPlayed = true;
        player.play("death", true);
    }

    playBossSfx(scene, "smash", { volume: 0.7 });
}

// ─── MAIN UPDATE LOOP ─────────────────────────────────────────────────────────

// Main update — runs AI, physics, animations, and damage every frame
function updateFinalBoss(scene) {
    const boss = scene.boss;                 // Reference to boss 
    if (!boss || !boss.isFinalBoss) return; // If no boss or not a final boss, return (lvl 2.1 requires this)

    const dt = scene.game.loop.delta / 1000;
    const player = scene.player;

    // Tick cooldown
    if (boss.globalCooldown > 0) boss.globalCooldown -= dt;
    if (boss.attackCooldown > 0) boss.attackCooldown -= dt;
    if (boss.castCooldown > 0) boss.castCooldown -= dt;
    if (boss.teleportCooldown > 0) boss.teleportCooldown -= dt;
    if (boss.jumpCooldown > 0) boss.jumpCooldown -= dt;
    if (boss.invincibleTimer > 0) {
        boss.invincibleTimer -= dt;
        if (boss.invincibleTimer <= 0) boss.invincible = false;
    }
    if (boss.staggerImmunity > 0) boss.staggerImmunity -= dt;
    if (boss.hitFlashTimer > 0) boss.hitFlashTimer -= dt;

    // Aggression scaling
    updateAggression(boss);

    // Projectile logic
    updateProjectiles(boss, dt);

    // Screen shake
    if (boss.shakeRequest) {
        scene.cameras.main.shake(boss.shakeRequest.duration, boss.shakeRequest.intensity);
        boss.shakeRequest = null;
    }

    // Death handling
    if (boss.isDead) {
        if (!boss.destroyed) {
            boss.destroyed = true;
            boss.play('fbDeath');
            boss.setVelocityX(0);
            boss.setVelocityY(0);
            playVictorySequence(scene);

            // Clean up projectiles
            for (const ps of boss.projectileSprites) {
                if (ps && ps.destroy) ps.destroy();
            }
            boss.projectileSprites = [];
            boss.projectileGroup.clear(true, true);

            // Fade out healthbar
            const h = boss.hb;
            scene.tweens.add({
                targets: [h.borderGlow, h.borderInner, h.bg, h.trail, h.fill, h.shine, h.nameText, ...h.notches],
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
            });

            // Destroy boss after delay
            scene.time.delayedCall(2500, () => {
                if (boss.attackHitbox) boss.attackHitbox.destroy();
                if (boss.thrustHitbox) boss.thrustHitbox.destroy();
                if (boss.chargeHitbox) boss.chargeHitbox.destroy();
                if (boss.comboHitbox) boss.comboHitbox.destroy();
                if (h.borderGlow) h.borderGlow.destroy();
                if (h.borderInner) h.borderInner.destroy();
                if (h.bg) h.bg.destroy();
                if (h.trail) h.trail.destroy();
                if (h.fill) h.fill.destroy();
                if (h.shine) h.shine.destroy();
                if (h.nameText) h.nameText.destroy();
                h.notches.forEach(n => { if (n) n.destroy(); });
                if (boss.destroy) boss.destroy();
                scene.boss = null;
            });
        }
        return;
    }

    // State switcher
    boss.stateTimer += dt;
    const a = boss.aggression;

    switch (boss.state) {

        // Idle (face the player and wait)
        case "idle": {
            if (player) {
                boss.facing = (player.x - boss.x) > 0 ? 1 : -1;
            }
            // Idle state duration over
            if (boss.stateTimer >= boss.stateDuration) {
                chooseNextState(boss, player);
            }
            break;
        }

        // Walk (approach the player slowly)
        case "walk": {
            if (!player) { setBossState(boss, "idle"); break; } // If no player, idle
            boss.facing = (player.x - boss.x) > 0 ? 1 : -1; // Face the player

            // If close enough, consider switching to attack
            const walkDist = Math.abs(player.x - boss.x);
            if (walkDist < boss.attackRange && boss.attackCooldown <= 0 && Math.random() < 0.4) {
                setBossState(boss, "attack");
                break;
            }
            if (boss.stateTimer >= boss.stateDuration) {
                chooseNextState(boss, player);
            }
            break;
        }

        // Run to close the gap fast
        case "run": {
            if (!player) { setBossState(boss, "idle"); break; }
            boss.facing = (player.x - boss.x) > 0 ? 1 : -1;

            // Immediately attack if close enough
            const runDist = Math.abs(player.x - boss.x);
            if (runDist < boss.attackRange * 0.8 && boss.attackCooldown <= 0) {
                setBossState(boss, "attack");
                break;
            }
            if (boss.stateTimer >= boss.stateDuration) {
                chooseNextState(boss, player);
            }
            break;
        }

        // Attack w/ devastating melee AoE
        case "attack": {
            // Wind-up phase (player can react)
            if (boss.stateTimer < boss.attackWindUp) break;

            // Hitbox active during slam frames (frames 4-7 have the arc effect)
            const currentFrame = boss.anims?.currentFrame?.index ?? 0;
            if (currentFrame >= 4 && currentFrame <= 7) {
                boss.attackHitboxActive = true;

                // Screen shake on impact
                if (currentFrame === 4 && !boss.attackShook) {
                    boss.attackShook = true;
                    boss.shakeRequest = { intensity: 0.015, duration: 300 };
                }
            } else {
                boss.attackHitboxActive = false;
            }

            // Transition to idle with recovery cooldown
            if (boss.stateTimer >= boss.stateDuration) {
                boss.attackHitboxActive = false;
                boss.attackCooldown = lerp(4.0, 1.5, a);
                transitionToIdle(boss, lerp(0.6, 0.2, a));
            }
            break;
        }

        // Cast by spawn projectile towards the player
        case "cast": {
            // Face the player during cast
            if (player) {
                boss.facing = (player.x - boss.x) > 0 ? 1 : -1;
            }

            // Spawn projectile after cast time
            if (boss.stateTimer >= boss.castTime && !boss.hasCast) {
                boss.hasCast = true;
                boss.shakeRequest = { intensity: 0.008, duration: 200 };

                // Only spawn projectile if player is near
                if (player) {
                    const dx = player.x - boss.x;
                    const dy = (player.y - 30) - boss.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;

                    // Main projectile
                    boss.projectiles.push({
                        x: boss.x + (boss.facing * 60),
                        y: boss.y - 20,
                        vx: (dx / len) * boss.projectileSpeed,
                        vy: (dy / len) * boss.projectileSpeed,
                        lifetime: boss.projectileLifetime,
                        damage: boss.castDamage,
                        active: true,
                        animFrame: 0,
                        animTimer: 0,
                    });

                    // Extra projectile at 30%+ aggression
                    if (a >= 0.3) {
                        const angle = 0.3;
                        const cos = Math.cos(angle);
                        const sin = Math.sin(angle);
                        boss.projectiles.push({
                            x: boss.x + (boss.facing * 60),
                            y: boss.y - 40,
                            vx: ((dx / len) * cos - (dy / len) * sin) * boss.projectileSpeed,
                            vy: ((dx / len) * sin + (dy / len) * cos) * boss.projectileSpeed,
                            lifetime: boss.projectileLifetime,
                            damage: boss.castDamage,
                            active: true,
                            animFrame: 0,
                            animTimer: 0,
                        });
                    }

                    // Third projectile at 70%+ aggression
                    if (a >= 0.7) {
                        const angle = -0.3;
                        const cos = Math.cos(angle);
                        const sin = Math.sin(angle);
                        boss.projectiles.push({
                            x: boss.x + (boss.facing * 60),
                            y: boss.y,
                            vx: ((dx / len) * cos - (dy / len) * sin) * boss.projectileSpeed,
                            vy: ((dx / len) * sin + (dy / len) * cos) * boss.projectileSpeed,
                            lifetime: boss.projectileLifetime,
                            damage: boss.castDamage,
                            active: true,
                            animFrame: 0,
                            animTimer: 0,
                        });
                    }
                }
            }

            // Cast cooldown
            if (boss.stateTimer >= boss.stateDuration) {
                boss.castCooldown = lerp(5.0, 1.8, a);
                transitionToIdle(boss, 0.4);
            }
            break;
        }

        // Teleport by disappearing and reappearing near/behind player
        case "teleport": {
            // Fade out
            if (boss.stateTimer < boss.teleportFadeTime) {
                boss.bossAlpha = 1 - (boss.stateTimer / boss.teleportFadeTime);
                boss.isTeleporting = true;
            }
            // Move to new position
            else if (boss.stateTimer >= boss.teleportFadeTime && !boss.teleportTarget.set) {
                boss.teleportTarget.set = true;
                boss.bossAlpha = 0;
                boss.invincible = true;
                playBossSfx(scene, "ender", { volume: 0.8 });

                if (player) {
                    const side = Math.random() < 0.6 ? -boss.facing : boss.facing;
                    const offset = 150 + Math.random() * 100;
                    boss.setPosition(player.x + (side * offset), player.y);
                    boss.facing = player.x > boss.x ? 1 : -1;
                }
            }
            // Fade back in
            else if (boss.stateTimer >= boss.teleportFadeTime) {
                const fadeInProgress = (boss.stateTimer - boss.teleportFadeTime) / (boss.teleportDuration - boss.teleportFadeTime);
                boss.bossAlpha = Math.min(1, fadeInProgress);

                if (fadeInProgress >= 0.3 && !boss.teleportShook) {
                    boss.teleportShook = true;
                    boss.shakeRequest = { intensity: 0.01, duration: 250 };
                }
            }

            // Teleport complete
            if (boss.stateTimer >= boss.stateDuration) {
                boss.bossAlpha = 1;
                boss.isTeleporting = false;
                boss.invincible = false;
                boss.teleportCooldown = lerp(7.0, 2.5, a);

                // After teleporting, immediately attack if close
                if (player) {
                    const dist = Math.abs(player.x - boss.x);
                    if (dist < boss.attackRange && boss.attackCooldown <= 0 && Math.random() < 0.6) {
                        setBossState(boss, "attack");
                        break;
                    }
                }
                transitionToIdle(boss, 0.2);
            }
            break;
        }

        // Hurt (brief stagger when hit)
        case "hurt": {
            if (boss.stateTimer >= boss.stateDuration) {
                setBossState(boss, "idle");
                boss.stateDuration = 0.1 + Math.random() * 0.3;
            }
            break;
        }
    }

    // Drive movement via physics velocity 
    if (!boss.isTeleporting) {
        if (boss.state === "walk") {
            boss.setVelocityX(boss.walkSpeed * boss.facing);
        } else if (boss.state === "run") {
            boss.setVelocityX(boss.runSpeed * boss.facing);
        } else {
            // Idle, attack, cast, hurt — stop moving
            boss.setVelocityX(0);
        }

        // Jump over tiles — if blocked horizontally during movement, jump
        if ((boss.state === "walk" || boss.state === "run") && boss.jumpCooldown <= 0) {
            const blocked = (boss.facing > 0 && boss.body.blocked.right) ||
                           (boss.facing < 0 && boss.body.blocked.left);
            if (blocked && boss.body.blocked.down) {
                boss.setVelocityY(-550);
                boss.jumpCooldown = 1.0;
            }
        }
    } else {
        // Teleporting — stop physics movement
        boss.setVelocityX(0);
    }

    // Animation sync
    const currentAnimKey = boss.anims?.currentAnim?.key;
    const stateToAnim = {
        idle:     'fbIdle',
        walk:     'fbWalk',
        run:      'fbRun',
        attack:   'fbAttack',
        cast:     'fbCast',
        hurt:     'fbHurt',
        death:    'fbDeath',
        teleport: 'fbTeleport',
    };

    let targetAnim = stateToAnim[boss.state] || 'fbIdle';

    // Second half of teleport uses the end animation
    if (boss.state === "teleport" && boss.stateTimer >= boss.teleportFadeTime) {
        targetAnim = 'fbTeleportEnd';
    }

    if (currentAnimKey !== targetAnim) {
        boss.play(targetAnim, true);
    }

    // ─── Flip handling ─────────────────────────────────────────────────────────
    // Sprite faces left by default, flip when facing left
    // When flipped, mirror the body offset so the physics body stays on the character
    const shouldFlip = boss.facing > 0;
    if (boss.flipX !== shouldFlip) {
        boss.setFlipX(shouldFlip);
        if (shouldFlip) {
            boss.body.setOffset(boss.frameWidth - boss.bodyOffsetX - boss.bodyWidth, boss.bodyOffsetY);
        } else {
            boss.body.setOffset(boss.bodyOffsetX, boss.bodyOffsetY);
        }
    }

    // Teleport alpha 
    boss.setAlpha(boss.bossAlpha);

    //  Hit flash / aggression tint
    if (boss.hitFlashTimer > 0) {
        boss.setTint(0xffffff);
    } else if (boss.aggression > 0.5) {
        const r = Math.floor(0xff);
        const g = Math.floor(0x66 - boss.aggression * 0x33);
        const b = Math.floor(0x33 - boss.aggression * 0x33);
        boss.setTint(Phaser.Display.Color.GetColor(r, g, b));
    } else {
        boss.clearTint();
    }

    // Dynamic hitbox 
    updateBossHitbox(boss);

    // ─── Player damage ─────────────────────────────────────────────────────────
    if (player && !player.isDead) {
        // Attack damage
        if (boss.attackHitboxActive && !boss.attackHasHit && !player.isImmune) {
            if (scene.physics.overlap(player, boss.attackHitbox)) {
                boss.attackHasHit = true;
                applyDamageToPlayer(scene, player, boss.attackDamage);
            }
        }

        // Projectile damage (physics overlap on projectile group)
        scene.physics.overlap(player, boss.projectileGroup, (p, projSprite) => {
            if (player.isImmune || player.isDead) return;
            const idx = boss.projectileSprites.indexOf(projSprite);
            if (idx >= 0 && boss.projectiles[idx] && boss.projectiles[idx].active) {
                const dmg = boss.projectiles[idx].damage;
                boss.projectiles[idx].active = false;
                applyDamageToPlayer(scene, player, dmg);
            }
        });

        // Contact damage during aggressive states FOR EVEN MORE DIFFICULTY hehe
        if (!player.isImmune && !boss.invincible) {
            const aggressiveStates = ["walk", "run", "attack"];
            if (aggressiveStates.includes(boss.state)) {
                if (scene.physics.overlap(player, boss)) {
                    applyDamageToPlayer(scene, player, 0.5);
                }
            }
        }
    }

    // Projectile sprite sync
    syncProjectileSprites(scene, boss);

    // Healthbar update
    updateFancyHealthbar(scene, boss, dt);
}

export { loadFinalBossAssets, createFinalBossAnimations, spawnFinalBoss, updateFinalBoss };

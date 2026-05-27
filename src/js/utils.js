/**
 * @author Honglue Zheng
 * @version beta
 * @note Universal utility functions
 */

// Function to shut down a level
// If a variable/animations exists, it will be reset
function shutdown(scene) {

    if (!scene) return;

    // Animation keys to reset
    const animationKeys = [
        'idle', 'run', 'jump', 'fall', 'drawSword', 'sheatheSword',
        'attack', 'hurt', 'death', 'slide', 'climb', 'crouch', 'airAttack',
        'weirdoIdle', 'skeletonIdle', 'skeletonWalk', 'skeletonAttack',
        'skeletonHit', 'skeletonDead'
    ];

    // Remove existing animations
    animationKeys.forEach(key => {
        if (scene.anims.exists(key)) {
            scene.anims.remove(key);
        }
    });

    // Default variables
    const defaults = {
        isPaused : false,
        player : undefined,
        checkpoints : [],
        latestCheckpoint : undefined,
        nextCheckpoint : undefined,
        weirdos : [],
        gameTick : 0,
        ground : undefined,
        climbableGroup : undefined,
        enemies: undefined,
    };

    // If object has properties, reset them to defaults
    Object.keys(defaults).forEach(key => {
        if (scene.hasOwnProperty(key)) {
            scene[key] = defaults[key];
        }
    });
};

// Function to clear all game stored objects
function clearCache(scene) {
    // Remove textures
    const textures = scene.textures.list;
    Object.keys(textures).forEach(key => {
        if (!key.startsWith('__')) { // Skip internal textures
            scene.textures.remove(key);
        }
    });
    
    // Remove audio
    const audio = scene.cache.audio.entries;
    Object.keys(audio).forEach(key => {
        scene.cache.audio.remove(key);
    });
    
    // Remove JSON/other assets
    scene.cache.json.removeAll();
    scene.cache.tilemap.removeAll();
}

function startNewLevel(currentScene, newLevelKey) {
    // Fade out current scene
    currentScene.cameras.main.fadeOut(1000, 0, 0, 0);
    
    currentScene.time.delayedCall(1000, () => {
        // Stop current scene (triggers shutdown())
        currentScene.scene.stop();
        
        // Start new scene
        currentScene.scene.start(newLevelKey);
        
        // Optional: Remove old scene from cache
        currentScene.game.scene.remove(currentScene.scene.key);
    });
}

export { shutdown, clearCache, startNewLevel }

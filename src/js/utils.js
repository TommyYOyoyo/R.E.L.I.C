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
        enemies: undefined
    };

    // If object has properties, reset them to defaults
    Object.keys(defaults).forEach(key => {
        if (scene.hasOwnProperty(key)) {
            scene[key] = defaults[key];
        }
    });
};

export { shutdown }

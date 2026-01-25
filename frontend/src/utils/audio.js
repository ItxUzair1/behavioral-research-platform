/**
 * Plays the trial completion sound.
 * Uses a hardcoded path to /sounds/success.mp3
 */
export const playTrialCompleteSound = () => {
    try {
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(e => {
            // Auto-play policies might block this if not triggered by user interaction,
            // but in this app, the sound is triggered by a drop/drag-end which IS a user interaction.
            // If the file is missing, this will also catch.
            console.warn('Audio playback failed (file missing or blocked):', e);
        });
    } catch (err) {
        console.error('Error creating Audio object:', err);
    }
};

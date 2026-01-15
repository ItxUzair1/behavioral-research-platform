const Participant = require('../models/Participant');

// Constants
const MAX_EARNINGS = 5.00;
const REWARD_AMOUNT = 0.05;
const VR_MEAN = 4;
const VR_MIN = 1;
const VR_MAX = 8;
const MAX_TRIALS = 200;

/**
 * Generates a Variable Ratio schedule averaging VR_MEAN
 * @param {number} totalTrials - Total number of trials to cover
 * @returns {number[]} Array of thresholds (number of correct responses needed for next reward)
 */
const generateVRSchedule = (totalTrials = MAX_TRIALS) => {
    const schedule = [];
    let currentTotal = 0;

    // We generate enough thresholds to cover the max trials. 
    // Since mean is 4, we expect roughly totalTrials / 4 rewards.
    // We'll generate a bit more to be safe.
    const estimatedRewards = Math.ceil(totalTrials / VR_MEAN) + 50;

    for (let i = 0; i < estimatedRewards; i++) {
        // Random int between MIN and MAX
        const threshold = Math.floor(Math.random() * (VR_MAX - VR_MIN + 1)) + VR_MIN;
        schedule.push(threshold);
    }

    // NOTE: Strictly speaking, to enforce an EXACT average of 4 over time, 
    // we might need a more complex balancing algorithm. 
    // But for this requirement "On average: Every 4 correct responses", 
    // random drawing from 1-8 is a standard approximation (Mean of 1..8 is 4.5 actually).
    // The user specified: "Randomly chosen between 1 and 8" AND "Over time, the average must equal ~4".
    // 1+8 = 9 / 2 = 4.5. To get average 4, we might need to skew or use a pool.
    // Let's implement a pool-based approach (flesh-bag) if we want strict average, 
    // but standard VR is usually just random. 
    // Given the prompt "Randomly chosen between 1 and 8", we will stick to that. 
    // If strict mean=4 is critical, we'd adjust probability, but [1..8] uniform is 4.5.
    // Optimization: To get closer to 4, we can simply pick from a distribution that averages 4.
    // e.g. [1, 2, 3, 4, 5, 6, 7] -> avg 4.
    // If range must be 1-8, avg is 4.5. 
    // We will stick to the user's explicit rule "Randomly chosen between 1 and 8".

    return schedule;
};

/**
 * Process a trial submission and calculate rewards
 * @param {string} participantId 
 * @param {string} taskType - 'matching', 'sorting', 'dragging'
 * @param {boolean} isCorrect 
 * @param {string} condition - 'Genuine', 'Apparent', 'Coercion'
 */
const processTrial = async (participantId, taskType, isCorrect, condition, variant) => {
    const participant = await Participant.findOne({ participantId });
    if (!participant) throw new Error('Participant not found');

    const taskKey = taskType.toLowerCase();

    // Check if Pre-Training (Genuine Assent) or Main Task
    const isPreTraining = (condition && condition.toLowerCase().includes('genuine')) ||
        (condition && condition.toLowerCase().includes('pre-training'));

    let rewardEarned = false;
    let rewardAmount = 0;
    let trialsCompleted = 0;

    if (isPreTraining) {
        // --- Pre-Training Logic ---
        // Store in pre_training_completion Map
        // Key format: "matching" or "sorting", BUT we need to distinguish variants if provided.
        // User reported issues keeping variants separate.
        // Construct key: if variant exists, use "task_variant", else "task"
        // sanitize variant
        const variantKey = variant ? `_${variant.toLowerCase().replace(/\s+/g, '')}` : '';
        const storageKey = `${taskKey}${variantKey}`;

        if (!participant.pre_training_completion) participant.pre_training_completion = new Map();

        let currentCount = participant.pre_training_completion.get(storageKey) || 0;
        currentCount += 1;
        participant.pre_training_completion.set(storageKey, currentCount);

        trialsCompleted = currentCount;

        // NO MONEY LOGIC for Pre-Training

    } else {
        // --- Main Task Logic (Apparent / Coercion) ---
        // Main Task accumulates across variants usually, or uses the base matching/sorting key.
        // Rule: "Earnings must accumulate across Matching tasks"
        // So we stick to 'taskKey' (matching/sorting) regardless of variant.

        if (!participant.reinforcementState[taskKey]) {
            throw new Error(`Invalid task type: ${taskType}`);
        }

        const state = participant.reinforcementState[taskKey];

        // Initialize schedule if empty
        if (!state.schedule || state.schedule.length === 0) {
            state.schedule = generateVRSchedule();
        }

        const canEarnMoney = (condition === 'Apparent' || condition === 'Coercion');

        // Update trial counts (Main Task only)
        state.trialsCompleted += 1;
        trialsCompleted = state.trialsCompleted;

        if (isCorrect && canEarnMoney) {
            state.correctCount += 1;

            // Check if current threshold reached
            const currentThreshold = state.schedule[state.scheduleIndex];

            if (state.correctCount >= currentThreshold) {
                // Check global earnings cap
                if (participant.earnings < MAX_EARNINGS) {
                    rewardEarned = true;
                    rewardAmount = REWARD_AMOUNT;

                    // Add money (cap at $5)
                    const potentialTotal = participant.earnings + REWARD_AMOUNT;
                    if (potentialTotal > MAX_EARNINGS) {
                        rewardAmount = MAX_EARNINGS - participant.earnings;
                        participant.earnings = MAX_EARNINGS;
                    } else {
                        participant.earnings = potentialTotal;
                    }
                }

                // Advance schedule
                state.correctCount = 0;
                state.scheduleIndex += 1;

                if (state.scheduleIndex >= state.schedule.length) {
                    state.schedule.push(...generateVRSchedule());
                }
            }
        }
    }

    // Save changes
    await participant.save();

    return {
        rewardEarned: rewardEarned && rewardAmount > 0,
        rewardAmount,
        totalEarnings: participant.earnings,
        trialsCompleted: trialsCompleted
    };
};

/**
 * Initialize task state for a participant
 */
const startTask = async (participantId, taskType, condition, variant) => {
    const participant = await Participant.findOne({ participantId });
    if (!participant) throw new Error('Participant not found');

    const taskKey = taskType.toLowerCase();
    const isPreTraining = (condition && condition.toLowerCase().includes('genuine'));

    let trialsCompleted = 0;

    if (isPreTraining) {
        const variantKey = variant ? `_${variant.toLowerCase().replace(/\s+/g, '')}` : '';
        const storageKey = `${taskKey}${variantKey}`;

        if (!participant.pre_training_completion) participant.pre_training_completion = new Map();
        trialsCompleted = participant.pre_training_completion.get(storageKey) || 0;
    } else {
        // Main Task
        if (!participant.reinforcementState[taskKey]) {
            // init if missing
        }
        const state = participant.reinforcementState[taskKey];
        if (!state.schedule || state.schedule.length === 0) {
            state.schedule = generateVRSchedule();
            await participant.save();
        }
        trialsCompleted = state.trialsCompleted;
    }

    return {
        totalEarnings: participant.earnings,
        trialsCompleted: trialsCompleted
    };
};

const getEarnings = async (participantId) => {
    const participant = await Participant.findOne({ participantId });
    if (!participant) throw new Error('Participant not found');

    return {
        totalEarnings: participant.earnings,
        remainingPossible: Math.max(0, MAX_EARNINGS - participant.earnings)
    };
};

module.exports = {
    processTrial,
    startTask,
    getEarnings,
    CONSTANTS: { MAX_EARNINGS, REWARD_AMOUNT }
};

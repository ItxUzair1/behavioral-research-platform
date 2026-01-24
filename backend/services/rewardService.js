const Participant = require('../models/Participant');

// Constants
const MAX_EARNINGS = 5.00;
const REWARD_AMOUNT = 0.05;
const VR_MEAN = 4;
const MAX_TRIALS = 200;

// Bag of numbers that averages to EXACTLY 4.0
// Sum = 44, Count = 11, Mean = 4.0
const VR_POOL = [1, 7, 2, 6, 3, 5, 4, 4, 8, 2, 2];

/**
 * Generates a Variable Ratio schedule averaging VR_MEAN using a balanced pool
 * @param {number} totalTrials - Total number of trials to cover
 * @returns {number[]} Array of thresholds
 */
const generateVRSchedule = (totalTrials = MAX_TRIALS) => {
    const schedule = [];

    // Helper to shuffle the pool
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Keep adding shuffled pools until we cover enough trials
    // We estimate rewards needed: totalTrials / 4
    const estimatedRewardsNeeded = Math.ceil(totalTrials / VR_MEAN) + 20;

    while (schedule.length < estimatedRewardsNeeded) {
        const bag = shuffle([...VR_POOL]);
        schedule.push(...bag);
    }

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

    // Determine strict task key based on logic:
    // If Pre-Training: "matching" (generic)
    // If Main Task (Apparent/Coercion): "matching_apparent" or "matching_coercion"

    // Check if Pre-Training
    // Check if Pre-Training
    // Logic: Pre-Training if it explicitly says "pre-training" OR if it says "genuine" BUT NOT "execution"
    const lowerCond = condition ? condition.toLowerCase() : '';
    const isGenuineExecution = lowerCond.includes('genuine') && lowerCond.includes('execution');

    // If it's Genuine Execution, it is NOT Pre-Training.
    // If it's Genuine Pre-Training, it IS Pre-Training.
    // If just "Genuine" (legacy), treat as Pre-Training unless specified.
    const isPreTraining = lowerCond.includes('pre-training') ||
        (lowerCond.includes('genuine') && !isGenuineExecution);

    let taskKey = taskType.toLowerCase();

    if (!isPreTraining && condition) {
        // Apparent or Coercion
        const suffix = condition.toLowerCase();
        // user might send "Apparent Assent" -> just use "apparent" if contained
        if (suffix.includes('apparent')) taskKey += '_apparent';
        else if (suffix.includes('coercion')) taskKey += '_coercion';
        // else fallback to generic taskKey
    }

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

        // Defensively initialize if missing (recover from state errors)
        if (!participant.reinforcementState[taskKey]) {
            participant.reinforcementState[taskKey] = {
                trialsCompleted: 0,
                correctCount: 0,
                scheduleIndex: 0,
                schedule: generateVRSchedule()
            };
            // We need to mark modified later
        }

        const state = participant.reinforcementState[taskKey];

        // Initialize schedule if empty
        if (!state.schedule || state.schedule.length === 0) {
            state.schedule = generateVRSchedule();
        }

        const canEarnMoney = (condition === 'Apparent' || condition === 'Coercion' || isGenuineExecution);

        // Update trial counts (Main Task only)
        state.trialsCompleted += 1;
        trialsCompleted = state.trialsCompleted;

        if (isCorrect && canEarnMoney) {
            state.correctCount += 1;

            // Check if current threshold reached
            let currentThreshold;

            // Progressive Ratio Logic for Dragging PR variant
            // Threshold = 2^(rewardsEarned) -> 1, 2, 4, 8, 16...
            if (taskType.toLowerCase() === 'dragging' && variant === 'pr') {
                currentThreshold = Math.pow(2, state.scheduleIndex);
            } else {
                // VR Logic (Default)
                currentThreshold = state.schedule[state.scheduleIndex];
            }

            if (state.correctCount >= currentThreshold) {
                if (participant.earnings < MAX_EARNINGS) {
                    rewardEarned = true;
                    rewardAmount = REWARD_AMOUNT;

                    const potentialTotal = participant.earnings + REWARD_AMOUNT;

                    // Add money (cap at $5)
                    if (potentialTotal > MAX_EARNINGS) {
                        rewardAmount = MAX_EARNINGS - participant.earnings;
                        participant.earnings = MAX_EARNINGS;
                    } else {
                        participant.earnings = potentialTotal;
                    }

                    // --- Update Earnings Breakdown ---
                    let phaseSuffix = '';
                    const lowerC = condition ? condition.toLowerCase() : '';
                    if (lowerC.includes('apparent')) phaseSuffix = 'apparent';
                    else if (lowerC.includes('coercion')) phaseSuffix = 'coercion';
                    else if (isGenuineExecution) phaseSuffix = 'genuine';

                    if (phaseSuffix) {
                        const baseTask = taskType.toLowerCase();
                        const breakdownKey = `${baseTask}_${phaseSuffix}`;

                        const path = `earningsByTask.${breakdownKey}`;
                        const currentVal = participant.get(path) || 0;
                        participant.set(path, currentVal + rewardAmount);

                        participant.markModified('earningsByTask');
                    }
                }

                // Advance schedule
                state.correctCount = 0;
                state.scheduleIndex += 1;

                if (state.scheduleIndex >= state.schedule.length && !(taskType === 'dragging' && variant === 'pr')) {
                    state.schedule.push(...generateVRSchedule());
                }
            }
        }
    }

    // Save changes
    participant.markModified('reinforcementState');
    await participant.save();

    // Determine current threshold for logging purposes
    // We re-calculate or peek at state.schedule[state.scheduleIndex]
    // Note: if reward was earned, we already incremented scheduleIndex, so we might need the *previous* one or just log the one that was just active.
    // For simplicity, let's log the one that was just applied.
    // If reward earned, we moved to next index, so we should look back? 
    // Actually, let's just re-calculate what the threshold WAS for this trial.
    // However, simpler is just to return it if we computed it.
    // To facilitate this, we can store `currentThreshold` in variable scope earlier.
    // But `processTrial` is called AFTER choice. 

    // Let's retrieve it from state (it's the one at current index, effectively strict requirement for NEXT reward? 
    // OR was it the one we just contributed to?)
    // The requirement is "How many responses needed for next reward".
    // If we just earned a reward, the *next* requirement is valid.
    // If we didn't, the current requirement is valid.
    // Let's just return the value at scheduleIndex.

    let loggedThreshold = 0;
    if (participant.reinforcementState[taskKey] && participant.reinforcementState[taskKey].schedule) {
        const s = participant.reinforcementState[taskKey];
        if (taskType.toLowerCase() === 'dragging' && variant === 'pr') {
            // If reward was JUST earned, s.scheduleIndex was incremented.
            // We want the threshold that was just completed (previous index).
            if (rewardEarned) {
                // Use index - 1 (safe check > 0 usually true if index just inc)
                loggedThreshold = Math.pow(2, Math.max(0, s.scheduleIndex - 1));
            } else {
                // Otherwise use current
                loggedThreshold = Math.pow(2, s.scheduleIndex);
            }
        } else if (s.schedule.length > 0) {
            // For VR, similar logic if we want the "just completed" req?
            // Usually VR req is random. If we moved index, we moved to next req.
            // If reward earned, we want the one we just did.
            if (rewardEarned) {
                loggedThreshold = s.schedule[Math.max(0, s.scheduleIndex - 1)] || 0;
            } else {
                loggedThreshold = s.schedule[s.scheduleIndex] || 0;
            }
        }
    }

    return {
        rewardEarned: rewardEarned && rewardAmount > 0,
        rewardAmount,
        totalEarnings: participant.earnings,
        trialsCompleted: trialsCompleted,
        currentThreshold: loggedThreshold // New field for logging
    };
};

/**
 * Initialize task state for a participant
 */
const startTask = async (participantId, taskType, condition, variant) => {
    const participant = await Participant.findOne({ participantId });
    if (!participant) throw new Error('Participant not found');

    let taskKey = taskType.toLowerCase();

    const lowerCond = condition ? condition.toLowerCase() : '';
    const isGenuineExecution = lowerCond.includes('genuine') && lowerCond.includes('execution');
    const isPreTraining = lowerCond.includes('pre-training') ||
        (lowerCond.includes('genuine') && !isGenuineExecution);

    if (!isPreTraining && condition) {
        const suffix = condition.toLowerCase();
        if (suffix.includes('apparent')) taskKey += '_apparent';
        else if (suffix.includes('coercion')) taskKey += '_coercion';
    }

    let trialsCompleted = 0;

    if (isPreTraining) {
        const variantKey = variant ? `_${variant.toLowerCase().replace(/\s+/g, '')}` : '';
        const storageKey = `${taskKey}${variantKey}`;

        if (!participant.pre_training_completion) participant.pre_training_completion = new Map();
        trialsCompleted = participant.pre_training_completion.get(storageKey) || 0;
    } else {
        // Main Task
        if (!participant.reinforcementState) {
            participant.reinforcementState = {};
        }

        // Ensure the specific task state exists, specifically for Genuine Execution using base keys
        if (!participant.reinforcementState[taskKey]) {
            participant.reinforcementState[taskKey] = {
                trialsCompleted: 0,
                correctCount: 0,
                scheduleIndex: 0,
                schedule: generateVRSchedule() // Init schedule immediately
            };
        }

        const state = participant.reinforcementState[taskKey];

        // Double check schedule exists (if state existed but schedule didn't)
        if (!state.schedule || state.schedule.length === 0) {
            state.schedule = generateVRSchedule();
        }

        // Important: Mark modified if using Mixed type or just to be safe with nested updates
        participant.markModified('reinforcementState');
        await participant.save();

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

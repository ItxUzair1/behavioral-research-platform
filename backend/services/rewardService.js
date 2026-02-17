const Participant = require('../models/Participant');

// Constants
const MAX_EARNINGS = 5.00;
const REWARD_AMOUNT = 0.05;
const VR_MEAN = 14;
const MAX_TRIALS = 200;

// Bag of numbers that averages to EXACTLY 14.0
// Range: 10-18, Sum: 126, Count: 9, Mean: 14.0
const VR_POOL = [10, 18, 11, 17, 12, 16, 13, 15, 14];

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

    const lowerCond = condition ? condition.toLowerCase() : '';
    const isGenuineExecution = lowerCond.includes('genuine') && lowerCond.includes('execution');

    // Logic: Pre-Training if it explicitly says "pre-training" OR if it says "genuine" BUT NOT "execution"
    const isPreTraining = lowerCond.includes('pre-training') ||
        (lowerCond.includes('genuine') && !isGenuineExecution);

    let taskKey = taskType.toLowerCase();

    // Determine the key for reinforcementState
    if (isPreTraining) {
        // ... (existing pre-training logic if any, but currently I rely on block below)
    } else {
        // Apparent or Coercion OR Genuine Execution
        if (lowerCond.includes('apparent')) taskKey += '_apparent';
        else if (lowerCond.includes('coercion')) taskKey += '_coercion';
        else if (isGenuineExecution) {
            if (taskKey === 'dragging' && variant === 'pr') {
                taskKey = 'dragging_genuine_pr';
            } else {
                taskKey += '_genuine';
            }
        }
    }

    let rewardEarned = false;
    let rewardAmount = 0;
    let trialsCompleted = 0;

    // --- Unified Logic using reinforcementState ---

    // 1. Ensure State Exists
    if (!participant.reinforcementState) {
        participant.reinforcementState = {};
    }

    // Special handling for Dragging in Pre-Training to separate PR and VR schedules
    if (isPreTraining && taskKey === 'dragging') {
        if (variant === 'pr') {
            taskKey = 'dragging_pr';
        }
    }

    if (!participant.reinforcementState[taskKey]) {
        participant.reinforcementState[taskKey] = {
            trialsCompleted: 0,
            correctCount: 0,
            scheduleIndex: 0,
            schedule: generateVRSchedule()
        };
    }


    const state = participant.reinforcementState[taskKey];

    // Initialize schedule if empty
    if (!state.schedule || state.schedule.length === 0) {
        state.schedule = generateVRSchedule();
    }

    // Hotfix: Check for legacy schedule (values &lt; 10) and regenerate
    // Exclude PR tasks which don't use the schedule values
    const isPR = (taskType === 'dragging' && variant === 'pr');
    if (!isPR && state.schedule && state.schedule.some(v => v < 10)) {
        console.log(`[Hotfix] Regenerating legacy schedule for ${participantId} - ${taskKey}`);
        state.schedule = generateVRSchedule();
        state.scheduleIndex = 0;
        state.correctCount = 0;
    }

    // 2. Update Counts
    state.trialsCompleted += 1;
    trialsCompleted = state.trialsCompleted;

    // 3. Check Rewards
    // "Earning" logic applies to everyone for the sake of the NOTIFICATION
    // But actual MONEY accumulation applies only to Main Tasks (and Genuine Execution)
    const canIsolateMoney = isPreTraining; // If Pre-Training, we DO NOT add money to total

    if (isCorrect) {
        state.correctCount += 1;

        // Check threshold
        let currentThreshold;
        if (taskType.toLowerCase() === 'dragging' && variant === 'pr') {
            // New PR Logic: 2, 4, 6, 8, 10... (Arithmetic Progression)
            currentThreshold = (state.scheduleIndex + 1) * 2;
        } else {
            currentThreshold = state.schedule[state.scheduleIndex];
        }

        if (state.correctCount >= currentThreshold) {
            // Reward Triggered!
            rewardEarned = true;

            // Calculate Amount (Always 0.05 for display)
            const nominalAmount = REWARD_AMOUNT;

            if (isPreTraining) {
                // Pre-Training: Show reward, but DO NOT add to participant.earnings
                rewardAmount = nominalAmount;
                // We return this amount so frontend shows "$0.05", but we don't save it to DB earnings.
            } else {
                // Main Task: Add to earnings (capped)
                if (participant.earnings < MAX_EARNINGS) {
                    rewardAmount = nominalAmount;
                    const potentialTotal = participant.earnings + nominalAmount;

                    if (potentialTotal > MAX_EARNINGS) {
                        rewardAmount = MAX_EARNINGS - participant.earnings;
                        participant.earnings = MAX_EARNINGS;
                    } else {
                        participant.earnings = potentialTotal;
                    }

                    // Update Breakdown
                    let phaseSuffix = '';
                    if (lowerCond.includes('apparent')) phaseSuffix = 'apparent';
                    else if (lowerCond.includes('coercion')) phaseSuffix = 'coercion';
                    else if (isGenuineExecution) phaseSuffix = 'genuine';

                    if (phaseSuffix) {
                        const baseTask = taskType.toLowerCase();
                        const breakdownKey = `${baseTask}_${phaseSuffix}`;
                        const path = `earningsByTask.${breakdownKey}`;
                        // Mongoose Map get/set or direct object access? 
                        // Schema says earningsByTask is an Object with keys, not a Map.
                        // Access via dot notation string? No, simple object access.
                        if (participant.earningsByTask) {
                            participant.earningsByTask[breakdownKey] = (participant.earningsByTask[breakdownKey] || 0) + rewardAmount;
                        }
                    }
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

    // Save changes
    participant.markModified('reinforcementState');
    participant.markModified('earningsByTask'); // helper
    await participant.save();

    // Determine current threshold for logging purposes
    let loggedThreshold = 0;
    if (participant.reinforcementState[taskKey] && participant.reinforcementState[taskKey].schedule) {
        const s = participant.reinforcementState[taskKey];
        if (taskType.toLowerCase() === 'dragging' && variant === 'pr') {
            // If we just advanced (rewardEarned), the threshold that triggered it was index-1
            // Use new arithmetic logic: (index + 1) * 2
            if (rewardEarned) {
                const prevIndex = Math.max(0, s.scheduleIndex - 1);
                loggedThreshold = (prevIndex + 1) * 2;
            } else {
                loggedThreshold = (s.scheduleIndex + 1) * 2;
            }
        } else if (s.schedule.length > 0) {
            if (rewardEarned) {
                loggedThreshold = s.schedule[Math.max(0, s.scheduleIndex - 1)] || 0;
            } else {
                loggedThreshold = s.schedule[s.scheduleIndex] || 0;
            }
        }
    }

    return {
        rewardEarned: rewardEarned,
        rewardAmount,
        totalEarnings: participant.earnings,
        trialsCompleted: trialsCompleted,
        currentThreshold: loggedThreshold
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
        else if (isGenuineExecution) {
            if (taskKey === 'dragging' && variant === 'pr') {
                taskKey = 'dragging_genuine_pr';
            } else {
                taskKey += '_genuine';
            }
        }
    }

    let trialsCompleted = 0;

    // --- Unified Initialization ---
    // Make sure we have a container
    if (!participant.reinforcementState) {
        participant.reinforcementState = {};
    }
    if (!participant.pre_training_completion) participant.pre_training_completion = new Map();

    // Ensure the specific task state exists, using base keys
    // Special handling for Dragging in Pre-Training to separate PR and VR schedules
    if (isPreTraining && taskKey === 'dragging') {
        if (variant === 'pr') {
            taskKey = 'dragging_pr';
        }
    }

    if (!participant.reinforcementState[taskKey]) {
        participant.reinforcementState[taskKey] = {
            trialsCompleted: 0,
            correctCount: 0,
            scheduleIndex: 0,
            schedule: generateVRSchedule() // Init schedule immediately
        };
    }


    const state = participant.reinforcementState[taskKey];

    // Double check schedule exists
    if (!state.schedule || state.schedule.length === 0) {
        state.schedule = generateVRSchedule();
    }

    trialsCompleted = state.trialsCompleted;

    // For Pre-Training, we ALSO want to track 'pre_training_completion' map because
    // some frontend logic might rely on specific variant counts if it queries `participant.pre_training_completion`?
    // Actually, startTask returns `trialsCompleted`. If we change the source of truth for Pre-Training to reinforcementState,
    // we must ensure the frontend receives the correct number.
    // The previous code returned `participant.pre_training_completion.get(storageKey)` for Pre-Training.
    // Use the reinforcementState count as the primary source now for consistency with processTrial.

    // However, if the user switches variants in Pre-Training (e.g., 'pr' to 'vr'), reinforcementState[taskKey] might be shared
    // depending on our key logic.
    // Key logic in processTrial:
    // If Pre-Training, taskKey = taskType.toLowerCase() (e.g. "matching").
    // So "matching" is shared across variants in reinforcementState.
    // Pre-Training matching variants: 'equations', 'mammals'.
    // If we want separated counts per variant, we need variant keys.
    // The previous `processTrial` logic I wrote used `taskKey` which was just `taskType`.
    // So it SHARES the schedule across variants in Pre-Training.
    // User requested: "implement same this logic in all tasks of pre-trainning".
    // Usually schedules are per task type.

    // Save
    participant.markModified('reinforcementState');
    await participant.save();

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

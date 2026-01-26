const TrialLog = require('../models/TrialLog');
const Participant = require('../models/Participant');

/**
 * Calculates trial metrics for a participant.
 * @param {string} participantId 
 * @returns {Promise<Object>} Object containing metrics per task/phase.
 */
exports.calculateMetrics = async (participantId) => {
    try {
        const logs = await TrialLog.find({ participantId }).sort({ timestamp: 1 });

        if (!logs || logs.length === 0) {
            return {};
        }

        const metrics = {};

        // Helper to initialize or get group
        const getGroup = (task, phase) => {
            const key = `${task}_${phase}`.toLowerCase();
            if (!metrics[key]) {
                metrics[key] = {
                    task,
                    phase,
                    totalTrials: 0,
                    startTime: null,
                    endTime: null,
                    durationMinutes: 0,
                    trialsPerMinute: 0
                };
            }
            return metrics[key];
        };

        logs.forEach(log => {
            // Always initialize group if a log exists for this task/phase
            const group = getGroup(log.taskType, log.phase);

            // Track time range for ALL events
            const time = new Date(log.timestamp).getTime();
            if (!group.startTime || time < group.startTime) group.startTime = time;
            if (!group.endTime || time > group.endTime) group.endTime = time;

            if (log.eventType === 'Trial') {
                group.totalTrials += 1;

                // Track correct answers
                if (log.correct) {
                    group.correctCount = (group.correctCount || 0) + 1;
                }

                // Track active time (sum of response times)
                if (log.responseTime) {
                    group.activeTimeMs = (group.activeTimeMs || 0) + log.responseTime;
                }

                // Track reinforcement
                if (log.reinforcementDelivered) {
                    group.reinforcerCount = (group.reinforcerCount || 0) + 1;
                }

                // Track Side Bias (Position 1, 2, 3)
                if (log.selectedOption && typeof log.selectedOption === 'string') {
                    const choice = log.selectedOption.toLowerCase();
                    // Match "Position X" or "Bin X"
                    if (choice.includes('position 1') || choice.includes('bin 1') || choice.includes('left')) {
                        group.countPos1 = (group.countPos1 || 0) + 1;
                    } else if (choice.includes('position 2') || choice.includes('bin 2')) {
                        group.countPos2 = (group.countPos2 || 0) + 1;
                    } else if (choice.includes('position 3') || choice.includes('bin 3') || choice.includes('right')) {
                        group.countPos3 = (group.countPos3 || 0) + 1;
                    }
                }

                // Track totalPRResponses (Dragging PR only)
                if (log.taskType && log.taskType.toLowerCase() === 'dragging') {
                    const isPR = (log.taskVariant && log.taskVariant === 'pr') || (log.scheduleRequirement && log.scheduleRequirement > 0);
                    if (isPR) {
                        group.totalPRResponses = (group.totalPRResponses || 0) + 1;

                        // Calculate Breakpoint: Max scheduleRequirement that was REINFORCED
                        if (log.reinforcementDelivered && log.scheduleRequirement) {
                            group.breakpoint = Math.max((group.breakpoint || 0), log.scheduleRequirement);
                        }
                    }
                }
            }
        });

        // Calculate rates
        Object.keys(metrics).forEach(key => {
            const m = metrics[key];

            // Accuracy Calculation
            if (m.totalTrials > 0) {
                const correct = m.correctCount || 0;
                m.accuracy = parseFloat(((correct / m.totalTrials) * 100).toFixed(2));
            } else {
                m.accuracy = 0;
            }

            // Time Calculations
            if (m.startTime && m.endTime) {
                const totalDurationMs = m.endTime - m.startTime;

                // Active Time (minutes)
                const activeMs = m.activeTimeMs || 0;
                m.activeTimeMinutes = parseFloat((activeMs / 60000).toFixed(4));

                // Idle Time (Total Duration - Active Time) 
                const idleMs = Math.max(0, totalDurationMs - activeMs);
                m.idleTimeMinutes = parseFloat((idleMs / 60000).toFixed(4));

                // Reinforcement Rate
                const reinforcers = m.reinforcerCount || 0;
                // If duration > 0, calc rate, else 0?
                if (m.durationMinutes > 0) {
                    m.reinforcementRatePerMin = parseFloat((reinforcers / m.durationMinutes).toFixed(2));
                } else {
                    m.reinforcementRatePerMin = 0;
                }
                // Ensure count is set even if 0
                m.reinforcerCount = reinforcers;
            }

            if (m.totalTrials > 1 && m.startTime && m.endTime) {
                // Duration in minutes
                m.durationMinutes = (m.endTime - m.startTime) / 60000;

                // Avoid division by zero or tiny duration
                if (m.durationMinutes > 0) {
                    m.trialsPerMinute = parseFloat((m.totalTrials / m.durationMinutes).toFixed(2));

                    // Reinforcement Rate
                    const reinforcers = m.reinforcerCount || 0;
                    m.reinforcementRatePerMin = parseFloat((reinforcers / m.durationMinutes).toFixed(2));
                }
            } else if (m.totalTrials === 1) {
                // Cannot calculate rate with 1 point really, or assume some duration.
                // Leave as 0 or undefined?
                m.trialsPerMinute = 0;
            }
        });

        // Ensure standard fields
        Object.keys(metrics).forEach(key => {
            if (metrics[key].reinforcerCount === undefined) metrics[key].reinforcerCount = 0;
            if (metrics[key].reinforcementRatePerMin === undefined) metrics[key].reinforcementRatePerMin = 0;
            if (metrics[key].totalPRResponses === undefined) metrics[key].totalPRResponses = 0;
            if (metrics[key].breakpoint === undefined) metrics[key].breakpoint = 0;

            // (Logic moved to main loop)

            // Side Bias / Perseveration Index
            const totalTrials = metrics[key].totalTrials || 0;
            const countPos1 = metrics[key].countPos1 || 0;
            const countPos2 = metrics[key].countPos2 || 0;
            const countPos3 = metrics[key].countPos3 || 0;

            if (totalTrials > 0) {
                metrics[key].percentPos1 = parseFloat(((countPos1 / totalTrials) * 100).toFixed(2));
                metrics[key].percentPos2 = parseFloat(((countPos2 / totalTrials) * 100).toFixed(2));
                metrics[key].percentPos3 = parseFloat(((countPos3 / totalTrials) * 100).toFixed(2));

                // Alias for User Request "Left/Right"
                // Assuming Pos 1 = Left, Pos 3 = Right (in 3-choice) or Pos 2 in 2-choice
                // For simplicity, Left = Pos 1, Right = Pos 2 + Pos 3 (Rest?)
                metrics[key].percentLeft = metrics[key].percentPos1;
                metrics[key].percentRight = parseFloat((metrics[key].percentPos2 + metrics[key].percentPos3).toFixed(2));
            } else {
                metrics[key].percentPos1 = 0;
                metrics[key].percentPos2 = 0;
                metrics[key].percentPos3 = 0;
                metrics[key].percentLeft = 0;
                metrics[key].percentRight = 0;
            }
        });

        // Format timestamps for readability
        Object.keys(metrics).forEach(key => {
            const m = metrics[key];
            if (m.startTime) m.startTime = new Date(m.startTime).toISOString();
            if (m.endTime) m.endTime = new Date(m.endTime).toISOString();
        });

        // Fetch Participant for Survey Data
        const participant = await Participant.findOne({ participantId });
        if (participant && participant.postSurvey) {
            metrics['post_survey'] = {
                preferenceRanking: participant.postSurvey.preferenceRanking ? participant.postSurvey.preferenceRanking.join(' > ') : 'N/A',
                demandRanking: participant.postSurvey.demandRanking ? participant.postSurvey.demandRanking.join(' > ') : 'N/A',
                senseOfControl: participant.postSurvey.senseOfControl || 'N/A',
                emotional_genuine: participant.postSurvey.emotionalResponse?.genuine ?? 'N/A',
                emotional_apparent: participant.postSurvey.emotionalResponse?.apparent ?? 'N/A',
                emotional_coercion: participant.postSurvey.emotionalResponse?.coercion ?? 'N/A'
            };
        }

        return metrics;

    } catch (error) {
        console.error("Error calculating metrics:", error);
        console.error(error.stack); // ADDED
        throw error;
    }
};

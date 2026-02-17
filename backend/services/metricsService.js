/* ... existing imports ... */
const TrialLog = require('../models/TrialLog');
const Participant = require('../models/Participant');

// Helper: Aggregates a list of logs into the metrics structure
const aggregateLogs = (logs) => {
    const metrics = {};

    // Helper to initialize or get group
    const getGroup = (task, phase) => {
        // Normalize phase: "Genuine Execution" → "Genuine", "Apparent Execution" → "Apparent", etc.
        let normalizedPhase = phase || '';
        normalizedPhase = normalizedPhase.replace(/\s*execution\s*/i, '').trim();
        const key = `${task}_${normalizedPhase}`.toLowerCase();
        if (!metrics[key]) {
            metrics[key] = {
                task,
                phase,
                totalTrials: 0,
                startTime: null,
                endTime: null,
                durationMinutes: 0,
                trialsPerMinute: 0,
                // Initialize all fields to 0 to ensure consistent CSV structure
                correctCount: 0,
                activeTimeMs: 0,
                reinforcerCount: 0,
                countPos1: 0,
                countPos2: 0,
                countPos3: 0,
                totalPRResponses: 0,
                breakpoint: 0
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

            if (log.correct) group.correctCount++;
            if (log.responseTime) group.activeTimeMs += log.responseTime;
            if (log.reinforcementDelivered) group.reinforcerCount++;

            // Track Side Bias
            if (log.selectedOption && typeof log.selectedOption === 'string') {
                const choice = log.selectedOption.toLowerCase();
                if (choice.includes('position 1') || choice.includes('bin 1') || choice.includes('left')) {
                    group.countPos1++;
                } else if (choice.includes('position 2') || choice.includes('bin 2')) {
                    group.countPos2++;
                } else if (choice.includes('position 3') || choice.includes('bin 3') || choice.includes('right')) {
                    group.countPos3++;
                }
            }

            // Track PR
            if (log.taskType && log.taskType.toLowerCase() === 'dragging') {
                const isPR = (log.taskVariant && log.taskVariant === 'pr') || (log.scheduleRequirement && log.scheduleRequirement > 0);
                if (isPR) {
                    group.totalPRResponses++;
                    if (log.reinforcementDelivered && log.scheduleRequirement) {
                        group.breakpoint = Math.max((group.breakpoint || 0), log.scheduleRequirement);
                    }
                }
            }
        } else if (log.eventType === 'OptOut') {
            group.optOutCount = (group.optOutCount || 0) + 1;
            if (log.responseTime) {
                group.optOutLatencySum = (group.optOutLatencySum || 0) + log.responseTime;
            }
        } else if (log.eventType === 'Choice') {
            // Track specific choice selection
            // e.g. selectedOption: "mammals"
            group.lastChoiceSelection = log.selectedOption;
            group.lastChoiceLatency = log.responseTime; // in ms
            group.lastChoiceTimestamp = log.timestamp;
        } else if (log.eventType === 'Survey') {
            // Track survey rating
            // e.g. selectedOption: "5" (string or number)
            group.surveyRating = parseInt(log.selectedOption);
            group.surveyTimestamp = log.timestamp;
        } else if (log.eventType === 'SwitchTask') {
            group.switchCount = (group.switchCount || 0) + 1;
            if (log.responseTime) {
                group.switchLatencySum = (group.switchLatencySum || 0) + log.responseTime;
            }
        }
    });

    // Calculate rates and percentages
    Object.keys(metrics).forEach(key => {
        const m = metrics[key];

        // Opt-Out Average Latency
        if (m.optOutCount > 0 && m.optOutLatencySum > 0) {
            m.avgOptOutLatency = parseFloat((m.optOutLatencySum / m.optOutCount).toFixed(2));
        } else {
            m.avgOptOutLatency = 0;
        }

        // Accuracy
        if (m.totalTrials > 0) {
            m.accuracy = parseFloat(((m.correctCount / m.totalTrials) * 100).toFixed(2));
        } else {
            m.accuracy = 0;
        }

        // Time Calculations
        if (m.startTime && m.endTime) {
            const totalDurationMs = m.endTime - m.startTime;
            m.activeTimeMinutes = parseFloat((m.activeTimeMs / 60000).toFixed(4));
            const idleMs = Math.max(0, totalDurationMs - m.activeTimeMs);
            m.idleTimeMinutes = parseFloat((idleMs / 60000).toFixed(4));
            // raw duration
            m.durationMinutes = totalDurationMs / 60000;
        }

        if (m.durationMinutes > 0) {
            m.trialsPerMinute = parseFloat((m.totalTrials / m.durationMinutes).toFixed(2));
            m.reinforcementRatePerMin = parseFloat((m.reinforcerCount / m.durationMinutes).toFixed(2));
        } else {
            m.trialsPerMinute = 0;
            m.reinforcementRatePerMin = 0;
        }

        // Side Bias Percentages
        const totalBiasTrials = m.totalTrials || 0;
        if (totalBiasTrials > 0) {
            m.percentPos1 = parseFloat(((m.countPos1 / totalBiasTrials) * 100).toFixed(2));
            m.percentPos2 = parseFloat(((m.countPos2 / totalBiasTrials) * 100).toFixed(2));
            m.percentPos3 = parseFloat(((m.countPos3 / totalBiasTrials) * 100).toFixed(2));
            m.percentLeft = m.percentPos1;
            m.percentRight = parseFloat((m.percentPos2 + m.percentPos3).toFixed(2));
        } else {
            m.percentPos1 = 0; m.percentPos2 = 0; m.percentPos3 = 0;
            m.percentLeft = 0; m.percentRight = 0;
        }

        // Date formatting
        if (m.startTime) m.startTime = new Date(m.startTime).toISOString();
        if (m.endTime) m.endTime = new Date(m.endTime).toISOString();
    });

    return metrics;
};

exports.calculateMetrics = async (participantId) => {
    try {
        const logs = await TrialLog.find({ participantId }).sort({ timestamp: 1 });
        if (!logs || logs.length === 0) return {};

        const metrics = aggregateLogs(logs);

        // Fetch Participant for Survey Data (Snapshot as of now)
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
        throw error;
    }
};

exports.calculateDailyMetrics = async (participantId) => {
    try {
        const logs = await TrialLog.find({ participantId }).sort({ timestamp: 1 });
        if (!logs || logs.length === 0) return [];

        // Group by dayNumber (explicit field on each log entry)
        const logsByDay = {};
        logs.forEach(log => {
            const day = log.dayNumber || 1; // Fallback to 1 for legacy logs without dayNumber
            if (!logsByDay[day]) logsByDay[day] = [];
            logsByDay[day].push(log);
        });

        // Compute metrics for each day
        const dailyData = Object.keys(logsByDay)
            .map(Number)
            .sort((a, b) => a - b)
            .map(dayNum => {
                const dayLogs = logsByDay[dayNum];
                const metrics = aggregateLogs(dayLogs);

                // Get the calendar date from the first log of this day (for reference)
                const firstLogDate = dayLogs[0]?.timestamp
                    ? new Date(dayLogs[0].timestamp).toISOString().split('T')[0]
                    : 'Unknown';

                // Calculate total daily earnings (approximate from reinforcers)
                let dailyEarnings = 0;
                let dailyReinforcers = 0;
                Object.entries(metrics).forEach(([key, m]) => {
                    if (m.reinforcerCount) {
                        dailyReinforcers += m.reinforcerCount;
                        if (!m.phase || !m.phase.toLowerCase().includes('pre-training')) {
                            dailyEarnings += (m.reinforcerCount * 0.05);
                        }
                    }
                });

                // Apply Coercion OptOut Deductions
                // When a participant opts out in Coercion, ALL earnings for that task in the coercion phase are forfeited
                Object.entries(metrics).forEach(([key, m]) => {
                    if (key.includes('coercion') && m.optOutCount && m.optOutCount > 0 && m.reinforcerCount) {
                        // Deduct the earnings that were earned before opting out
                        dailyEarnings -= (m.reinforcerCount * 0.05);
                    }
                });
                dailyEarnings = Math.max(0, dailyEarnings); // Never go negative

                return {
                    date: firstLogDate,
                    dayNumber: dayNum,
                    dailyEarnings: parseFloat(dailyEarnings.toFixed(2)),
                    dailyReinforcers,
                    metrics
                };
            });

        return dailyData;

    } catch (error) {
        console.error("Error calculating daily metrics:", error);
        throw error;
    }
};

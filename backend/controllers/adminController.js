const Participant = require('../models/Participant');
const metricsService = require('../services/metricsService');
const { Parser } = require('json2csv');


const ADMIN_PASSWORD = 'admin@123';

exports.login = (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, token: Buffer.from(password).toString('base64') });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
};

exports.getParticipants = async (req, res) => {
    try {
        const participants = await Participant.find({})
            .select('participantId conditionOrder currentStep timestamps earnings payoutInfo days_completed study_complete')
            .sort({ 'timestamps.studyCompleted': -1, 'timestamps.consentGiven': -1 });

        const formatted = participants.map(p => ({
            participantId: p.participantId,
            status: p.study_complete ? 'Completed' : 'In Progress',
            currentStep: p.currentStep,
            conditionOrder: p.conditionOrder.join(', '),
            completedAt: p.timestamps.studyCompleted ? p.timestamps.studyCompleted.toISOString() : null,
            startedAt: p.timestamps.consentGiven ? p.timestamps.consentGiven.toISOString() : null,
            earnings: p.earnings,
            daysCompleted: p.days_completed || 0,
            payoutInfo: p.payoutInfo // Include payout details
        }));

        res.json({ success: true, participants: formatted });
    } catch (error) {
        console.error("Admin Participants Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Helper to generate the flat summary object for a participant.
 * Incorporates fields from the Participant model + calculated metrics.
 */
function getParticipantSummary(p, metrics) {
    const safeDate = (d) => d ? new Date(d).toISOString() : '';
    const safeJoin = (arr, sep = '|') => Array.isArray(arr) ? arr.join(sep) : '';

    // Base Summary (Static participant data - same across all days)
    const summary = {
        participantId: p.participantId,
        conditionOrder: safeJoin(p.conditionOrder, '-'),
        createdAt: safeDate(p.createdAt),

        // Timestamps
        'timestamps_consentGiven': safeDate(p.timestamps?.consentGiven),

        // Demographics

        'age': p.demographics?.age || '',
        'gender': p.demographics?.gender || '',
        'race': safeJoin(p.demographics?.race_ethnicity),
        'region': p.demographics?.geographic_region || '',

        'edu_level': p.demographics?.education_level || '',
        'socio_status': p.demographics?.socioeconomic_status || '',

        // Genuine Choices - Daily (Calculated from metrics)
        // Keys: choicetask_matching, choicetask_sorting, choicetask_dragging
        'genuine_choices_matching_selection': metrics?.choicetask_matching?.lastChoiceSelection || '',
        'genuine_choices_matching_latency': metrics?.choicetask_matching?.lastChoiceLatency || '',
        'genuine_choices_matching_timestamp': safeDate(metrics?.choicetask_matching?.lastChoiceTimestamp),

        'genuine_choices_sorting_selection': metrics?.choicetask_sorting?.lastChoiceSelection || '',
        'genuine_choices_sorting_latency': metrics?.choicetask_sorting?.lastChoiceLatency || '',
        'genuine_choices_sorting_timestamp': safeDate(metrics?.choicetask_sorting?.lastChoiceTimestamp),

        'genuine_choices_dragging_selection': metrics?.choicetask_dragging?.lastChoiceSelection || '',
        'genuine_choices_dragging_latency': metrics?.choicetask_dragging?.lastChoiceLatency || '',
        'genuine_choices_dragging_timestamp': safeDate(metrics?.choicetask_dragging?.lastChoiceTimestamp),

        // Earnings By Task - Daily (Calculated from metrics)
        // If metrics object is provided, use it. Otherwise 0.
        // For coercion: if participant opted out, ALL earnings for that task are forfeited
        'earningsByTask_matching_genuine': metrics?.matching_genuine ? (metrics.matching_genuine.reinforcerCount * 0.05) : 0,
        'earningsByTask_sorting_genuine': metrics?.sorting_genuine ? (metrics.sorting_genuine.reinforcerCount * 0.05) : 0,
        'earningsByTask_dragging_genuine': metrics?.dragging_genuine ? (metrics.dragging_genuine.reinforcerCount * 0.05) : 0,
        'earningsByTask_matching_apparent': metrics?.matching_apparent ? (metrics.matching_apparent.reinforcerCount * 0.05) : 0,
        'earningsByTask_sorting_apparent': metrics?.sorting_apparent ? (metrics.sorting_apparent.reinforcerCount * 0.05) : 0,
        'earningsByTask_dragging_apparent': metrics?.dragging_apparent ? (metrics.dragging_apparent.reinforcerCount * 0.05) : 0,
        'earningsByTask_matching_coercion': (metrics?.matching_coercion && !metrics.matching_coercion.optOutCount) ? (metrics.matching_coercion.reinforcerCount * 0.05) : 0,
        'earningsByTask_sorting_coercion': (metrics?.sorting_coercion && !metrics.sorting_coercion.optOutCount) ? (metrics.sorting_coercion.reinforcerCount * 0.05) : 0,
        'earningsByTask_dragging_coercion': (metrics?.dragging_coercion && !metrics.dragging_coercion.optOutCount) ? (metrics.dragging_coercion.reinforcerCount * 0.05) : 0,

        // OptOut Stats - Daily (Calculated from metrics)
        'matching_genuine_Opt-Out Latency': metrics?.matching_genuine?.avgOptOutLatency || 0,
        'matching_genuine_Opt-Out Count': metrics?.matching_genuine?.optOutCount || 0,

        'sorting_genuine_Opt-Out Latency': metrics?.sorting_genuine?.avgOptOutLatency || 0,
        'sorting_genuine_Opt-Out Count': metrics?.sorting_genuine?.optOutCount || 0,

        'dragging_genuine_Opt-Out Latency': metrics?.dragging_genuine?.avgOptOutLatency || 0,
        'dragging_genuine_Opt-Out Count': metrics?.dragging_genuine?.optOutCount || 0,

        'matching_apparent_Opt-Out Latency': metrics?.matching_apparent?.avgOptOutLatency || 0,
        'matching_apparent_Opt-Out Count': metrics?.matching_apparent?.optOutCount || 0,

        'sorting_apparent_Opt-Out Latency': metrics?.sorting_apparent?.avgOptOutLatency || 0,
        'sorting_apparent_Opt-Out Count': metrics?.sorting_apparent?.optOutCount || 0,

        'dragging_apparent_Opt-Out Latency': metrics?.dragging_apparent?.avgOptOutLatency || 0,
        'dragging_apparent_Opt-Out Count': metrics?.dragging_apparent?.optOutCount || 0,

        'matching_coercion_Opt-Out Latency': metrics?.matching_coercion?.avgOptOutLatency || 0,
        'matching_coercion_Opt-Out Count': metrics?.matching_coercion?.optOutCount || 0,

        'sorting_coercion_Opt-Out Latency': metrics?.sorting_coercion?.avgOptOutLatency || 0,
        'sorting_coercion_Opt-Out Count': metrics?.sorting_coercion?.optOutCount || 0,

        'dragging_coercion_Opt-Out Latency': metrics?.dragging_coercion?.avgOptOutLatency || 0,
        'dragging_coercion_Opt-Out Count': metrics?.dragging_coercion?.optOutCount || 0,

        // Mini Surveys - Daily (Calculated from metrics)
        // Keys: minisurvey_genuine, minisurvey_apparent, minisurvey_coercion
        'miniSurveys_genuine_rating': metrics?.minisurvey_genuine?.surveyRating || '',
        'miniSurveys_genuine_timestamp': safeDate(metrics?.minisurvey_genuine?.surveyTimestamp),
        'miniSurveys_apparent_rating': metrics?.minisurvey_apparent?.surveyRating || '',
        'miniSurveys_apparent_timestamp': safeDate(metrics?.minisurvey_apparent?.surveyTimestamp),
        'miniSurveys_coercion_rating': metrics?.minisurvey_coercion?.surveyRating || '',
        'miniSurveys_coercion_timestamp': safeDate(metrics?.minisurvey_coercion?.surveyTimestamp),

        // Post Survey
        'postSurvey_emotionalResponse_genuine': p.postSurvey?.emotionalResponse?.genuine || '',
        'postSurvey_emotionalResponse_apparent': p.postSurvey?.emotionalResponse?.apparent || '',
        'postSurvey_emotionalResponse_coercion': p.postSurvey?.emotionalResponse?.coercion || '',
        'postSurvey_preferenceRanking': safeJoin(p.postSurvey?.preferenceRanking),
        'postSurvey_demandRanking': safeJoin(p.postSurvey?.demandRanking),
        'postSurvey_senseOfControl': p.postSurvey?.senseOfControl || '',
        'postSurvey_timestamp': safeDate(p.postSurvey?.timestamp),


        // Switch Task Stats - Daily (Calculated from metrics)
        // Key: switchTaskStats are usually tracked under genuine phase
        'matching_genuine_Switch-Task Latency': metrics?.matching_genuine?.switchLatencySum ? (metrics.matching_genuine.switchLatencySum / metrics.matching_genuine.switchCount).toFixed(2) : 0,
        'matching_genuine_Switch-Task Count': metrics?.matching_genuine?.switchCount || 0,

        'sorting_genuine_Switch-Task Latency': metrics?.sorting_genuine?.switchLatencySum ? (metrics.sorting_genuine.switchLatencySum / metrics.sorting_genuine.switchCount).toFixed(2) : 0,
        'sorting_genuine_Switch-Task Count': metrics?.sorting_genuine?.switchCount || 0,

        'dragging_genuine_Switch-Task Latency': metrics?.dragging_genuine?.switchLatencySum ? (metrics.dragging_genuine.switchLatencySum / metrics.dragging_genuine.switchCount).toFixed(2) : 0,
        'dragging_genuine_Switch-Task Count': metrics?.dragging_genuine?.switchCount || 0,

    };

    // Flatten Metrics
    // metrics is an object like { 'matching_genuine': { ... }, ... }
    // We want to flatten this into 'trialMetrics_{key}_{subKey}'
    // Skip keys already handled explicitly above
    const skipSubKeys = new Set([
        'optOutCount', 'optOutLatencySum', 'avgOptOutLatency',   // Already in Opt-Out columns
        'switchCount', 'switchLatencySum',                       // Already in Switch-Task columns
        'lastChoiceSelection', 'lastChoiceLatency', 'lastChoiceTimestamp', // Already in genuine_choices columns
        'surveyRating', 'surveyTimestamp',                       // Already in miniSurveys columns
        'task', 'phase',                                         // Internal grouping fields, not useful data
        'startTime', 'endTime'                                   // Raw timestamps, durationMinutes is already computed
    ]);

    if (metrics) {
        Object.keys(metrics).forEach(metricKey => {
            // Skip ChoiceTask and MiniSurvey — their data is already in explicit columns above
            if (metricKey.startsWith('choicetask') || metricKey.startsWith('minisurvey')) return;
            const metricData = metrics[metricKey];
            if (typeof metricData === 'object' && metricData !== null) {
                Object.keys(metricData).forEach(subKey => {
                    if (skipSubKeys.has(subKey)) return; // Already mapped explicitly
                    const header = `trialMetrics_${metricKey}_${subKey}`;
                    summary[header] = metricData[subKey];
                });
            }
        });
    }

    return summary;
}

exports.getFullExport = async (req, res) => {
    try {
        const participants = await Participant.find({}).sort({ 'timestamps.createdAt': -1 });
        const data = [];

        for (const p of participants) {
            // Get Daily Metrics (Array of Days)
            const dailyData = await metricsService.calculateDailyMetrics(p.participantId);

            if (dailyData.length > 0) {
                // Create a row for EACH Day with cumulative earnings
                let cumulativeEarnings = 0;

                dailyData.forEach(day => {
                    cumulativeEarnings += day.dailyEarnings;

                    const flat = getParticipantSummary(p, day.metrics);
                    // Add Daily specific fields at the top of the row
                    flat['Day Number'] = day.dayNumber;
                    flat['Date'] = day.date;
                    flat['Daily Earnings'] = day.dailyEarnings;
                    flat['Total Earnings'] = parseFloat(cumulativeEarnings.toFixed(2));
                    flat['Daily Reinforcers'] = day.dailyReinforcers;

                    data.push(flat);
                });
            } else {
                // Fallback for participants with no logs yet (Entry row)
                const flat = getParticipantSummary(p, {});
                flat['Day Number'] = 0;
                flat['Date'] = 'No Logs';
                flat['Daily Earnings'] = 0;
                flat['Total Earnings'] = 0;
                flat['Daily Reinforcers'] = 0;
                data.push(flat);
            }
        }

        if (data.length === 0) {
            return res.status(404).json({ success: false, message: "No participants found" });
        }

        const parser = new Parser();
        const csv = parser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`Full_Export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error("Full Export Error:", error);
        res.status(500).json({ success: false, message: "Export failed" });
    }
};

exports.getParticipantExport = async (req, res) => {
    const { participantId } = req.params;
    try {
        // 1. Fetch Participant Info
        const participant = await Participant.findOne({ participantId });
        if (!participant) {
            return res.status(404).json({ success: false, message: "Participant not found" });
        }

        // 2. Fetch Metrics
        // 2. Fetch Metrics (Daily)
        const dailyData = await metricsService.calculateDailyMetrics(participantId);

        // 3. Generate Rows
        const data = [];
        if (dailyData.length > 0) {
            let cumulativeEarnings = 0;

            dailyData.forEach(day => {
                cumulativeEarnings += day.dailyEarnings;

                const flat = getParticipantSummary(participant, day.metrics);
                flat['Day Number'] = day.dayNumber;
                flat['Date'] = day.date;
                flat['Daily Earnings'] = day.dailyEarnings;
                flat['Total Earnings'] = parseFloat(cumulativeEarnings.toFixed(2));
                flat['Daily Reinforcers'] = day.dailyReinforcers;

                data.push(flat);
            });
        } else {
            const flat = getParticipantSummary(participant, {});
            flat['Day Number'] = 0;
            flat['Date'] = 'No Logs';
            flat['Daily Earnings'] = 0;
            flat['Total Earnings'] = 0;
            flat['Daily Reinforcers'] = 0;
            data.push(flat);
        }

        const parser = new Parser();
        const csv = parser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`Participant_${participantId}_FullData_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error("Participant Export Error:", error);
        res.status(500).json({ success: false, message: "Export failed" });
    }
};

exports.markAsPaid = async (req, res) => {
    try {
        const { participantId } = req.body;

        const participant = await Participant.findOne({ participantId });
        if (!participant) {
            return res.status(404).json({ success: false, message: "Participant not found" });
        }

        if (!participant.payoutInfo) {
            participant.payoutInfo = {};
        }

        participant.payoutInfo.status = 'Paid';
        participant.payoutInfo.paidAt = new Date();

        await participant.save();

        res.json({ success: true, message: "Participant marked as paid", payoutInfo: participant.payoutInfo });

    } catch (error) {
        console.error("Mark Paid Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.markAsPaidBulk = async (req, res) => {
    try {
        const { participantIds } = req.body; // Array of IDs

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ success: false, message: "No participant IDs provided" });
        }

        const result = await Participant.updateMany(
            { participantId: { $in: participantIds } },
            {
                $set: {
                    'payoutInfo.status': 'Paid',
                    'payoutInfo.paidAt': new Date()
                }
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} participants marked as paid`,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Bulk Mark Paid Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


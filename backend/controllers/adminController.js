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
            .select('participantId conditionOrder currentStep timestamps earnings payoutInfo')
            .sort({ 'timestamps.studyCompleted': -1, 'timestamps.consentGiven': -1 });

        const formatted = participants.map(p => ({
            participantId: p.participantId,
            status: p.currentStep === 'Payout' ? 'Completed' : 'In Progress',
            currentStep: p.currentStep,
            conditionOrder: p.conditionOrder.join(', '),
            completedAt: p.timestamps.studyCompleted ? p.timestamps.studyCompleted.toISOString() : null,
            startedAt: p.timestamps.consentGiven ? p.timestamps.consentGiven.toISOString() : null,
            earnings: p.earnings,
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

    // Base Summary
    const summary = {
        _id: p._id.toString(),
        participantId: p.participantId,
        conditionOrder: safeJoin(p.conditionOrder, '-'),
        currentStep: p.currentStep,
        choiceTask: p.choiceTask || '',
        earnings: p.earnings,
        createdAt: safeDate(p.createdAt),
        updatedAt: safeDate(p.updatedAt),

        // Timestamps
        'timestamps_consentGiven': safeDate(p.timestamps?.consentGiven),

        // Demographics

        'age': p.demographics?.age || '',
        'gender': p.demographics?.gender || '',
        'race': safeJoin(p.demographics?.race_ethnicity),
        'region': p.demographics?.geographic_region || '',

        'edu_level': p.demographics?.education_level || '',
        'socio_status': p.demographics?.socioeconomic_status || '',

        // Genuine Choices
        'genuine_choices_matching_selection': p.genuine_choices?.matching_choice?.selection || '',
        'genuine_choices_matching_latency': p.genuine_choices?.matching_choice?.latency || '',
        'genuine_choices_matching_timestamp': safeDate(p.genuine_choices?.matching_choice?.timestamp),

        'genuine_choices_sorting_selection': p.genuine_choices?.sorting_choice?.selection || '',
        'genuine_choices_sorting_latency': p.genuine_choices?.sorting_choice?.latency || '',
        'genuine_choices_sorting_timestamp': safeDate(p.genuine_choices?.sorting_choice?.timestamp),

        'genuine_choices_dragging_selection': p.genuine_choices?.dragging_choice?.selection || '',
        'genuine_choices_dragging_latency': p.genuine_choices?.dragging_choice?.latency || '',
        'genuine_choices_dragging_timestamp': safeDate(p.genuine_choices?.dragging_choice?.timestamp),

        // Earnings By Task
        'earningsByTask_matching_genuine': p.earningsByTask?.matching_genuine || 0,
        'earningsByTask_sorting_genuine': p.earningsByTask?.sorting_genuine || 0,
        'earningsByTask_dragging_genuine': p.earningsByTask?.dragging_genuine || 0,
        'earningsByTask_matching_apparent': p.earningsByTask?.matching_apparent || 0,
        'earningsByTask_sorting_apparent': p.earningsByTask?.sorting_apparent || 0,
        'earningsByTask_dragging_apparent': p.earningsByTask?.dragging_apparent || 0,
        'earningsByTask_matching_coercion': p.earningsByTask?.matching_coercion || 0,
        'earningsByTask_sorting_coercion': p.earningsByTask?.sorting_coercion || 0,
        'earningsByTask_dragging_coercion': p.earningsByTask?.dragging_coercion || 0,

        // OptOut Stats - specific flattened structure as requested
        'matching_genuine_Opt-Out Latency': p.optOutStats?.matching_genuine?.latency || '',
        'matching_genuine_Opt-Out Count': p.optOutStats?.matching_genuine?.count || 0,

        'sorting_genuine_Opt-Out Latency': p.optOutStats?.sorting_genuine?.latency || '',
        'sorting_genuine_Opt-Out Count': p.optOutStats?.sorting_genuine?.count || 0,

        'dragging_genuine_Opt-Out Latency': p.optOutStats?.dragging_genuine?.latency || '',
        'dragging_genuine_Opt-Out Count': p.optOutStats?.dragging_genuine?.count || 0,

        'matching_apparent_Opt-Out Latency': p.optOutStats?.matching_apparent?.latency || '',
        'matching_apparent_Opt-Out Count': p.optOutStats?.matching_apparent?.count || 0,

        'sorting_apparent_Opt-Out Latency': p.optOutStats?.sorting_apparent?.latency || '',
        'sorting_apparent_Opt-Out Count': p.optOutStats?.sorting_apparent?.count || 0,

        'dragging_apparent_Opt-Out Latency': p.optOutStats?.dragging_apparent?.latency || '',
        'dragging_apparent_Opt-Out Count': p.optOutStats?.dragging_apparent?.count || 0,

        'matching_coercion_Opt-Out Latency': p.optOutStats?.matching_coercion?.latency || '',
        'matching_coercion_Opt-Out Count': p.optOutStats?.matching_coercion?.count || 0,

        'sorting_coercion_Opt-Out Latency': p.optOutStats?.sorting_coercion?.latency || '',
        'sorting_coercion_Opt-Out Count': p.optOutStats?.sorting_coercion?.count || 0,

        'dragging_coercion_Opt-Out Latency': p.optOutStats?.dragging_coercion?.latency || '',
        'dragging_coercion_Opt-Out Count': p.optOutStats?.dragging_coercion?.count || 0,

        // Mini Surveys
        'miniSurveys_genuine_rating': p.miniSurveys?.genuine?.rating || '',
        'miniSurveys_genuine_timestamp': safeDate(p.miniSurveys?.genuine?.timestamp),
        'miniSurveys_apparent_rating': p.miniSurveys?.apparent?.rating || '',
        'miniSurveys_apparent_timestamp': safeDate(p.miniSurveys?.apparent?.timestamp),
        'miniSurveys_coercion_rating': p.miniSurveys?.coercion?.rating || '',
        'miniSurveys_coercion_timestamp': safeDate(p.miniSurveys?.coercion?.timestamp),

        // Post Survey
        'postSurvey_emotionalResponse_genuine': p.postSurvey?.emotionalResponse?.genuine || '',
        'postSurvey_emotionalResponse_apparent': p.postSurvey?.emotionalResponse?.apparent || '',
        'postSurvey_emotionalResponse_coercion': p.postSurvey?.emotionalResponse?.coercion || '',
        'postSurvey_preferenceRanking': safeJoin(p.postSurvey?.preferenceRanking),
        'postSurvey_demandRanking': safeJoin(p.postSurvey?.demandRanking),
        'postSurvey_senseOfControl': p.postSurvey?.senseOfControl || '',
        'postSurvey_timestamp': safeDate(p.postSurvey?.timestamp),


        // Switch Task Stats
        'matching_genuine_Switch-Task Latency': p.switchTaskStats?.matching_genuine?.latency || '',
        'matching_genuine_Switch-Task Count': p.switchTaskStats?.matching_genuine?.count || 0,

        'sorting_genuine_Switch-Task Latency': p.switchTaskStats?.sorting_genuine?.latency || '',
        'sorting_genuine_Switch-Task Count': p.switchTaskStats?.sorting_genuine?.count || 0,

        'dragging_genuine_Switch-Task Latency': p.switchTaskStats?.dragging_genuine?.latency || '',
        'dragging_genuine_Switch-Task Count': p.switchTaskStats?.dragging_genuine?.count || 0,

    };

    // Flatten Metrics
    // metrics is an object like { 'matching_genuine pre-training': { ... }, ... }
    // We want to flatten this into 'trialMetrics_{key}_{subKey}'
    if (metrics) {
        Object.keys(metrics).forEach(metricKey => {
            const metricData = metrics[metricKey];
            if (typeof metricData === 'object' && metricData !== null) {
                Object.keys(metricData).forEach(subKey => {
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
            const metrics = await metricsService.calculateMetrics(p.participantId);
            const flat = getParticipantSummary(p, metrics);
            data.push(flat);
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
        const metrics = await metricsService.calculateMetrics(participantId);

        // 3. Generate Summary Data (to repeat on every row)
        const summaryData = getParticipantSummary(participant, metrics);

        // 4. Return Only Summary Data
        const data = [summaryData];

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


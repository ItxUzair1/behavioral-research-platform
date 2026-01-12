const TrialLog = require('../models/TrialLog');

exports.logTrial = async (req, res) => {
    try {
        const {
            participantId,
            taskType,
            taskVariant,
            trialNumber,
            responseTime,
            correct
        } = req.body;

        console.log("Incoming Trial Log:", req.body); // DEBUG

        if (!participantId || !taskType) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newTrial = new TrialLog({
            participantId,
            taskType,
            taskVariant,
            trialNumber,
            responseTime,
            correct
        });

        await newTrial.save();

        res.status(201).json({ success: true, message: "Trial logged" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getTrials = async (req, res) => {
    try {
        const { participantId } = req.params;
        const trials = await TrialLog.find({ participantId }).sort({ timestamp: 1 });

        res.status(200).json({ success: true, count: trials.length, trials });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

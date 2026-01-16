const TrialLog = require('../models/TrialLog');

exports.logTrial = async (req, res) => {
    try {
        const {
            participantId,
            taskType,
            taskVariant,
            phase,
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
            phase,
            trialNumber,
            responseTime,
            correct
        });

        await newTrial.save();

        // --- earning logic ---
        const Participant = require('../models/Participant');
        let currentEarnings = 0;

        // If correct, find participant and increment earnings
        // We do this for ALL phases where earnings are applicable. 
        // Assuming earnings apply if "correct" is true, or we can check phase.
        // For now, we apply it generally as per requirement "earn money".
        // Pre-Training might need excluding? 
        // The user said "Pre-Training... Experience Only - No Money" in UI.
        // But backend doesn't know explicitly about "Pre-Training" unless checks 'phase' or 'variant'.
        // Variant is "Pre-Training" in UI.

        const isPreTraining = taskVariant === 'Pre-Training' || phase?.toLowerCase().includes('pre-training');

        if (!isPreTraining && correct) {
            const participant = await Participant.findOne({ participantId });
            if (participant) {
                // Increment by $0.01
                participant.earnings = (participant.earnings || 0) + 0.01;
                await participant.save();
                currentEarnings = participant.earnings;
            }
        } else if (!isPreTraining) {
            // Just get current earnings if incorrect
            const participant = await Participant.findOne({ participantId });
            if (participant) {
                currentEarnings = participant.earnings || 0;
            }
        }

        res.status(201).json({
            success: true,
            message: "Trial logged",
            earnings: parseFloat(currentEarnings.toFixed(2)) // Send back formatted earnings
        });
    } catch (error) {
        console.error("Error logging trial:", error);
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

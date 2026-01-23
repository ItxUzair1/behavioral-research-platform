const Participant = require('../models/Participant');

exports.createParticipant = async (req, res) => {
    try {
        // Generate a simple pseudo-random ID (e.g., P-123456)
        const pid = "P-" + Math.floor(100000 + Math.random() * 900000);

        // Default condition order (randomize if needed later)
        const conditionOrder = ["Genuine", "Apparent", "Coercion"];

        const newParticipant = new Participant({
            participantId: pid,
            conditionOrder: conditionOrder,
            timestamps: {
                consentGiven: new Date()
            }
        });

        await newParticipant.save();

        res.status(201).json({
            success: true,
            participantId: pid,
            conditionOrder: conditionOrder,
            message: "Participant created successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const metricsService = require('../services/metricsService');

exports.getParticipant = async (req, res) => {
    try {
        const { participantId } = req.params;
        const participant = await Participant.findOne({ participantId });

        if (!participant) {
            return res.status(404).json({ success: false, message: "Participant not found" });
        }

        // Calculate dynamic trial metrics
        const trialMetrics = await metricsService.calculateMetrics(participantId);

        // Convert to plain object and attach metrics
        const participantData = participant.toObject();
        participantData.trialMetrics = trialMetrics;

        res.status(200).json({ success: true, participant: participantData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateParticipant = async (req, res) => {
    try {
        const { participantId } = req.params;
        const updates = req.body;

        // Flexible update: currentStep, demographics, choiceTask, etc.
        const participant = await Participant.findOneAndUpdate(
            { participantId },
            { $set: updates },
            { new: true }
        );

        if (!participant) {
            return res.status(404).json({ success: false, message: "Participant not found" });
        }

        res.status(200).json({ success: true, participant });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

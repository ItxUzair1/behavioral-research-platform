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
            correct,
            selectedOption, // New
            eventType, // New (optional, default "Trial")
            context
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
            correct,
            selectedOption,
            eventType: eventType || "Trial"
        });

        // --- Fetch Schedule Requirement if it's a VR/PR task ---
        // --- Process Reward Logic (CRITICAL: Must happen before saving log) ---
        const rewardService = require('../services/rewardService');
        let rewardResult = { rewardEarned: false, rewardAmount: 0, currentThreshold: 0 };

        try {
            // Only process rewards if it's a valid trial (not OptOut) and not Pre-Training
            // Actually, processTrial handles pre-training logic internally (no money), so we can just call it.
            // But we shouldn't call strict reward logic for "OptOut" event.
            if (eventType !== 'OptOut') {
                rewardResult = await rewardService.processTrial(
                    participantId,
                    taskType,
                    correct === true, // Ensure boolean
                    phase,
                    taskVariant
                );
            }
        } catch (err) {
            console.error("Reward processing error:", err);
        }

        // Apply reward result to the log entry
        newTrial.reinforcementDelivered = rewardResult.rewardEarned;
        newTrial.scheduleRequirement = rewardResult.currentThreshold || 0;
        newTrial.context = {
            ...(context || {}),
            reinforcersDelivered: rewardResult.rewardEarned ? 1 : 0
        };

        if (rewardResult.rewardEarned) {
            console.log(`$$$ Reward Earned: ${participantId} | ${taskType}`);
        }

        await newTrial.save();

        // --- earning logic ---
        const Participant = require('../models/Participant');
        const REWARD_AMOUNT = 0.05;

        // Special Logic: Coercion Opt-Out Penalty (Complete Loss)
        // If opting out of Coercion, remove ALL earnings accumulated in this specific task.
        if (eventType === 'OptOut' && phase && phase.toLowerCase().includes('coercion')) {
            try {
                // Count rewards specifically for this participant + phase + taskType
                // This ensures we only deduct what was earned in *this* specific attempt (Current Task)
                const rewards = await TrialLog.countDocuments({
                    participantId,
                    phase: phase, // e.g. "Coercion"
                    taskType: taskType, // e.g. "matching", "sorting", or "dragging"
                    reinforcementDelivered: true
                });

                const deduction = rewards * REWARD_AMOUNT;

                if (deduction > 0) {
                    const participant = await Participant.findOne({ participantId });
                    if (participant) {
                        // Deduct from global earnings
                        participant.earnings = Math.max(0, participant.earnings - deduction);
                        await participant.save();
                        console.log(`Penalty Applied (Coercion): Deducted $${deduction.toFixed(2)} from ${participantId}`);
                    }
                }
            } catch (err) {
                console.error("Error applying Coercion penalty:", err);
            }
        }
        let currentEarnings = 0;

        // JUST READ EARNINGS, DO NOT INCREMENT. 
        // Reward logic is handled by taskController/rewardService via submitTaskResult.
        const participant = await Participant.findOne({ participantId });
        if (participant) {
            currentEarnings = participant.earnings || 0;
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

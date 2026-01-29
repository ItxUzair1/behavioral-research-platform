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
            reinforcementDelivered, // PASSED FROM FRONTEND
            scheduleRequirement,    // PASSED FROM FRONTEND
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
            eventType: eventType || "Trial",
            reinforcementDelivered: reinforcementDelivered || false,
            scheduleRequirement: scheduleRequirement || 0,
            context: {
                ...(context || {}),
                reinforcersDelivered: reinforcementDelivered ? 1 : 0
            }
        });

        // REMOVED: Duplicate Reward Processing logic. use taskController for that.

        if (reinforcementDelivered) {
            console.log(`$$$ Reward Logged: ${participantId} | ${taskType}`);
        }

        await newTrial.save();

        // --- earning logic ---
        const Participant = require('../models/Participant');
        const REWARD_AMOUNT = 0.05;

        // Special Logic: Coercion Opt-Out Penalty (Complete Loss)
        // If opting out of Coercion, remove ALL earnings accumulated in this specific task.
        if (eventType === 'OptOut' && phase) {
            try {
                // 1. Calculate Count (Trials completed in this task so far)
                const trialsCount = await TrialLog.countDocuments({
                    participantId,
                    phase: phase,
                    taskType: taskType,
                    eventType: 'Trial' // Only count actual trials
                });

                // 2. Identify Key
                let suffix = '';
                const lowerP = phase.toLowerCase();
                if (lowerP.includes('apparent')) suffix = 'apparent';
                else if (lowerP.includes('coercion')) suffix = 'coercion';
                else if (lowerP.includes('genuine')) suffix = 'genuine';

                if (suffix) {
                    const baseTask = taskType.toLowerCase();
                    const key = `${baseTask}_${suffix}`;

                    // 3. Update Participant
                    const updateField = `optOutStats.${key}`;
                    await Participant.updateOne(
                        { participantId },
                        {
                            $set: {
                                [updateField]: {
                                    latency: responseTime,
                                    count: trialsCount
                                }
                            }
                        }
                    );
                    console.log(`OptOut Stats Saved: ${key} | Latency: ${responseTime}ms | Count: ${trialsCount}`);
                }
            } catch (err) {
                console.error("Error saving opt-out stats:", err);
            }
        }

        // --- SWITCH TASK LOGIC (Genuine Only) ---
        if (eventType === 'SwitchTask' && phase) {
            try {
                // 1. Calculate Count (Trials completed in this task so far)
                const trialsCount = await TrialLog.countDocuments({
                    participantId,
                    phase: phase,
                    taskType: taskType,
                    eventType: 'Trial'
                });

                // 2. Identify Key (Only Genuine supports switching)
                const lowerP = phase.toLowerCase();
                if (lowerP.includes('genuine')) {
                    const baseTask = taskType.toLowerCase();
                    const key = `${baseTask}_genuine`;

                    // 3. Update Participant
                    const updateField = `switchTaskStats.${key}`;
                    await Participant.updateOne(
                        { participantId },
                        {
                            $set: {
                                [updateField]: {
                                    latency: responseTime, // Time from Onset -> Switch Click
                                    count: trialsCount
                                }
                            }
                        }
                    );
                    console.log(`SwitchTask Stats Saved: ${key} | Latency: ${responseTime}ms | Count: ${trialsCount}`);
                }
            } catch (err) {
                console.error("Error saving switch task stats:", err);
            }
        }

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

                        // Also Deduct from Earnings Breakdown
                        const baseTask = taskType.toLowerCase();
                        const breakdownKey = `${baseTask}_coercion`;
                        const path = `earningsByTask.${breakdownKey}`;

                        const currentBreakdownVal = participant.get(path) || 0;
                        const newBreakdownVal = Math.max(0, currentBreakdownVal - deduction);
                        participant.set(path, newBreakdownVal);

                        // Mark modified
                        participant.markModified('earningsByTask');

                        await participant.save();
                        console.log(`Penalty Applied (Coercion): Deducted $${deduction.toFixed(2)} from ${participantId} (Global & Breakdown)`);
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

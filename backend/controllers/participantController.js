const Participant = require('../models/Participant');

// Helper to generate secure random ID
const generateSecureId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = 9; // 9 chars (e.g. PX7K29LMQ)
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

exports.createParticipant = async (req, res) => {
    try {
        let pid;
        let isUnique = false;

        // Ensure uniqueness
        while (!isUnique) {
            pid = generateSecureId();
            const existing = await Participant.findOne({ participantId: pid });
            if (!existing) isUnique = true;
        }

        const conditionOrder = ["Genuine", "Apparent", "Coercion"];

        const newParticipant = new Participant({
            participantId: pid,
            conditionOrder: conditionOrder,
            timestamps: {
                consentGiven: new Date()
            },
            // Initialize new fields explicitly (optional as schema has defaults)
            visible_total_earnings: 0,
            days_completed: 0
        });

        await newParticipant.save();

        res.status(201).json({
            success: true,
            participantId: pid,
            conditionOrder: conditionOrder,
            message: "Participant created successfully"
        });
    } catch (error) {
        console.error("Create Record Error:", error);
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

exports.submitPayoutDetails = async (req, res) => {
    try {
        const { participantId } = req.params;
        const { email, paymentMethod, action } = req.body; // action: 'complete_session' or 'request_payout'

        const participant = await Participant.findOne({ participantId });

        if (!participant) {
            return res.status(404).json({ success: false, message: "Participant not found" });
        }

        const today = new Date();
        const lastDate = participant.last_completed_date ? new Date(participant.last_completed_date) : null;

        // 1. Handle "Session Completion" (Day Increment)
        // Check if we need to increment the day (if not already done today)
        if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
            participant.last_completed_date = today;
            participant.days_completed = (participant.days_completed || 0) + 1;
            participant.visible_total_earnings = participant.earnings;

            // Logic to auto-set study_complete could go here if we had a fixed day count
            // e.g. if (participant.days_completed >= 5) participant.study_complete = true;
        }

        // 2. Handle "Payout Request" (Final Step)
        if (action === 'request_payout') {
            if (!participant.study_complete) {
                // If they try to force it via API but study isn't done
                return res.status(400).json({ success: false, message: "Study not complete. Cannot request payout yet." });
            }

            if (!email) {
                return res.status(400).json({ success: false, message: "Email is required for payout." });
            }

            // Check for duplicate email usage by OTHER participants
            const existingEmail = await Participant.findOne({
                'payoutInfo.email': email,
                participantId: { $ne: participantId }
            });

            if (existingEmail) {
                return res.status(400).json({ success: false, message: "This email has already been used for a payout." });
            }

            participant.payoutInfo = {
                email: email,
                status: 'Pending',
                paymentMethod: paymentMethod || 'PayPal',
                requestedAt: new Date(),
                paidAt: null
            };
        }

        await participant.save();

        res.status(200).json({
            success: true,
            message: action === 'request_payout' ? "Payout request submitted." : "Session saved.",
            payoutInfo: participant.payoutInfo,
            days_completed: participant.days_completed,
            study_complete: participant.study_complete
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.validateParticipant = async (req, res) => {
    try {
        const { participantId } = req.body;
        if (!participantId) {
            return res.status(400).json({ success: false, error: "Participant ID is required" });
        }

        const participant = await Participant.findOne({ participantId });
        if (!participant) {
            return res.status(404).json({ success: false, error: "Invalid Participant ID. Please check and try again." });
        }

        if (participant.study_complete) {
            return res.status(400).json({ success: false, error: "This participant has already completed the study." });
        }

        // Check against today's date (Server Time)
        // Check Daily Session Status
        const serverToday = new Date();
        const serverTodayString = serverToday.toDateString();

        // Determine if daily session is already initialized
        const lastInit = participant.lastSessionInitDate ? new Date(participant.lastSessionInitDate) : null;
        const isSessionInitializedToday = lastInit && lastInit.toDateString() === serverTodayString;

        if (participant.last_completed_date) {
            const lastComplete = new Date(participant.last_completed_date);
            if (lastComplete.toDateString() === serverTodayString) {
                return res.status(403).json({
                    success: false,
                    error: "You have already completed today's session. Please return tomorrow."
                });
            }
        }

        // Initialize New Day Session (Run ONCE per day)
        if (!isSessionInitializedToday) {
            console.log(`Initializing New Daily Session for ${participantId}`);

            // 1. Reset Reinforcement State (Dragging, Matching, Sorting)
            if (participant.reinforcementState) {
                // Iterate through all task keys in reinforcementState
                Object.keys(participant.reinforcementState).forEach(key => {
                    const taskState = participant.reinforcementState[key];
                    if (taskState) {
                        // Reset progress within the schedule
                        taskState.scheduleIndex = 0;
                        taskState.correctCount = 0;
                        taskState.trialsCompleted = 0; // Reset daily trial count? 
                        // Note: If trialsCompleted accumulates over lifetime, don't reset. 
                        // But logically daily sessions should probably track daily progress for that task.
                        // Given user wants "start again from 2", resetting index is the key.
                        // Let's reset trialsCompleted too so progress bars (if any) reset daily.
                        taskState.trialsCompleted = 0;

                        // Optional: Shuffle PR/VR schedules again to prevent pattern learning
                        // We can't easily call generateVRSchedule here without importing rewardService...
                        // But resetting index to 0 is sufficient for "start from 2".
                    }
                });
            }

            // 2. Reset Step to Start of Day
            participant.currentStep = "Genuine Assent";

            // 3. Snapshot earnings at day start for daily $5 cap
            participant.earnings_at_day_start = participant.earnings || 0;

            // 4. Mark Session as Initialized Today
            participant.lastSessionInitDate = serverToday;

            await participant.save();
        }

        // Return relevant status info
        res.status(200).json({
            success: true,
            participantId: participant.participantId,
            conditionOrder: participant.conditionOrder,
            currentStep: participant.currentStep, // Will be "Genuine Assent" for new days
            days_completed: participant.days_completed || 0,
            last_completed_date: participant.last_completed_date,
            startingBalance: participant.visible_total_earnings || 0 // Use this for display
        });
    } catch (error) {
        console.error("Validation Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

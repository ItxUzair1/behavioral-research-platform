const mongoose = require('mongoose');
const metricsService = require('./services/metricsService');
const TrialLog = require('./models/TrialLog');

// Hardcoded for test debugging
process.env.MONGODB_URI = "mongodb://localhost:27017/behavioral_test";
// console.log("URI set to local, starting test...");

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // console.log('Connected to MongoDB');

        // --- NEW TEST: Side Bias Index (Post-Fix) ---
        const biasPid = "BIAS-TEST-FIX-" + Date.now();
        await TrialLog.insertMany([
            { participantId: biasPid, taskType: 'Matching', phase: 'BiasCheck', eventType: 'Trial', trialNumber: 1, responseTime: 500, correct: true, selectedOption: "Position 1" },
            { participantId: biasPid, taskType: 'Matching', phase: 'BiasCheck', eventType: 'Trial', trialNumber: 2, responseTime: 500, correct: true, selectedOption: "Position 1" },
            { participantId: biasPid, taskType: 'Matching', phase: 'BiasCheck', eventType: 'Trial', trialNumber: 3, responseTime: 500, correct: true, selectedOption: "Position 1" },
            { participantId: biasPid, taskType: 'Matching', phase: 'BiasCheck', eventType: 'Trial', trialNumber: 4, responseTime: 500, correct: true, selectedOption: "Position 3" }
        ]);

        const biasMetrics = await metricsService.calculateMetrics(biasPid);
        const biasGroup = biasMetrics['matching_biascheck'];

        if (biasGroup.percentLeft === 75 && biasGroup.percentRight === 25) {
            console.log('PASS: Side Bias Index correct (75% Left/Pos1, 25% Right/Pos3)');
        } else {
            console.error('FAIL: Side Bias Index incorrect. Got:', biasGroup);
        }

        // --- NEW TEST: Total PR Responses ---
        const prRespPid = "PR-RESP-TEST-" + Date.now();
        await TrialLog.insertMany([
            // 1. Successful PR Trial
            { participantId: prRespPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 1, responseTime: 500, correct: true, selectedOption: "Target Reached", scheduleRequirement: 1 },
            // 2. Failed PR Trial (Incomplete) - Triggered by 'handleEnd' with <75% but >20%
            { participantId: prRespPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 2, responseTime: 500, correct: false, selectedOption: "Incomplete Drag", scheduleRequirement: 1 },
            // 3. Another Successful One
            { participantId: prRespPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 3, responseTime: 500, correct: true, selectedOption: "Target Reached", scheduleRequirement: 1 },
            // 4. Non-PR Task (Should NOT count)
            { participantId: prRespPid, taskType: 'Matching', phase: 'Test', eventType: 'Trial', trialNumber: 1, responseTime: 500, correct: true }
        ]);

        const prRespMetrics = await metricsService.calculateMetrics(prRespPid);
        const prGroup = prRespMetrics['dragging_test'];

        // Should be 3 (2 Success + 1 Incomplete)
        if (prGroup && prGroup.totalPRResponses === 3) {
            console.log('PASS: Total PR Responses correct (3)');
        } else {
            console.error('FAIL: Total PR Responses incorrect. Got:', prGroup ? prGroup.totalPRResponses : 'No Group');
        }

        // Verify Matching group has 0
        const matchGroup = prRespMetrics['matching_test'];
        if (matchGroup && matchGroup.totalPRResponses === 0) {
            console.log('PASS: Non-PR task has 0 PR Responses');
        } else {
            console.error('FAIL: Non-PR task PR Responses incorrect. Got:', matchGroup ? matchGroup.totalPRResponses : 'No Group');
        }

        // --- NEW TEST: Breakpoint ---
        const breakPid = "BREAK-TEST-" + Date.now();
        await TrialLog.insertMany([
            // 1. Req 1 -> Reward
            { participantId: breakPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 1, responseTime: 500, correct: true, reinforcementDelivered: true, scheduleRequirement: 1 },
            // 2. Req 2 -> Reward
            { participantId: breakPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 2, responseTime: 500, correct: true, reinforcementDelivered: true, scheduleRequirement: 2 },
            // 3. Req 4 -> Reward
            { participantId: breakPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 3, responseTime: 500, correct: true, reinforcementDelivered: true, scheduleRequirement: 4 },
            // 4. Req 8 -> No Reward (Failed or OptOut)
            { participantId: breakPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 4, responseTime: 500, correct: false, reinforcementDelivered: false, scheduleRequirement: 8 }
        ]);

        const breakMetrics = await metricsService.calculateMetrics(breakPid);
        const breakGroup = breakMetrics['dragging_test'];

        // Should be 4 (Last rewarded requirement)
        if (breakGroup && breakGroup.breakpoint === 4) {
            console.log('PASS: Breakpoint correct (4)');
        } else {
            console.error('FAIL: Breakpoint incorrect. Got:', breakGroup ? breakGroup.breakpoint : 'No Group');
        }

        // Test Zero Breakpoint (No rewards)
        const noRewardPid = "NO-REW-" + Date.now();
        await TrialLog.insertMany([
            { participantId: noRewardPid, taskType: 'Dragging', taskVariant: 'pr', phase: 'Test', eventType: 'Trial', trialNumber: 1, responseTime: 500, correct: true, reinforcementDelivered: false, scheduleRequirement: 1 }
        ]);
        const noRewMetrics = await metricsService.calculateMetrics(noRewardPid);
        if (noRewMetrics['dragging_test'].breakpoint === 0) {
            console.log('PASS: Breakpoint 0 when no rewards');
        } else {
            console.error('FAIL: Breakpoint should be 0. Got:', noRewMetrics['dragging_test'].breakpoint);
        }

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();

const mongoose = require('mongoose');
const metricsService = require('./services/metricsService');
const TrialLog = require('./models/TrialLog');

// Hardcoded for test debugging
process.env.MONGODB_URI = "mongodb://localhost:27017/behavioral_test";

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // Clear DB for clean state
        // await TrialLog.deleteMany({}); 
        // Commented out to avoid wiping real dev data if URI is wrong, but 'behavioral_test' should be safe.

        const testPid = "DEBUG-" + Date.now();

        // minimal log
        const log = {
            participantId: testPid,
            taskType: 'Dragging',
            taskVariant: 'pr',
            phase: 'Debug',
            eventType: 'Trial',
            trialNumber: 1,
            responseTime: 100,
            correct: true,
            selectedOption: "Position 1"
        };

        await TrialLog.create(log);
        console.log("Inserted 1 log");

        const metrics = await metricsService.calculateMetrics(testPid);
        console.log("Metrics calculated:", JSON.stringify(metrics, null, 2));

    } catch (error) {
        console.error("TEST FAILED");
        console.error(error.message);
        if (error.stack) console.error(error.stack.split('\n').slice(0, 3).join('\n'));
    } finally {
        await mongoose.disconnect();
    }
};

runTest();

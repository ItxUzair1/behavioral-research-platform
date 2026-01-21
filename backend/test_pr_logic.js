const mongoose = require('mongoose');
const { processTrial, startTask, CONSTANTS } = require('./services/rewardService');
const Participant = require('./models/Participant');

require('dotenv').config();

const RUN_TEST = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/behavioral_platform');
        console.log("Connected to DB");

        const TEST_ID = "test_pr_user_" + Date.now();
        const p = new Participant({ participantId: TEST_ID, reinforcementState: {} });
        await p.save();

        console.log(`Created User: ${TEST_ID}`);

        // Initialize with correct condition
        await startTask(TEST_ID, 'dragging', 'Genuine Execution', 'pr');

        // Trial 1: Expect Reward (1/1) [Total Resp: 1]
        console.log("\n--- Trial 1 ---");
        let res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 1: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);
        if (!res.rewardEarned) console.error("FAIL: Expected Reward on Trial 1");

        // Trial 2: Expect No Reward (1/2) [Total Resp: 2]
        console.log("\n--- Trial 2 ---");
        res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 2: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);
        if (res.rewardEarned) console.error("FAIL: Unexpected Reward on Trial 2");

        // Trial 3: Expect Reward (2/2) [Total Resp: 3]
        console.log("\n--- Trial 3 ---");
        res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 3: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);
        if (!res.rewardEarned) console.error("FAIL: Expected Reward on Trial 3");

        // Trial 4: Expect No Reward (1/4) [Total Resp: 4]
        console.log("\n--- Trial 4 ---");
        res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 4: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);

        // Trial 5: Expect No Reward (2/4) [Total Resp: 5]
        console.log("\n--- Trial 5 ---");
        res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 5: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);

        // Trial 6: Expect No Reward (3/4) [Total Resp: 6]
        console.log("\n--- Trial 6 ---");
        res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 6: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);

        // Trial 7: Expect Reward (4/4) [Total Resp: 7]
        console.log("\n--- Trial 7 ---");
        res = await processTrial(TEST_ID, 'dragging', true, 'Genuine Execution', 'pr');
        console.log(`Trial 7: Reward=${res.rewardEarned}, Amt=${res.rewardAmount}, Threshold=${res.currentThreshold}`);
        if (!res.rewardEarned) console.error("FAIL: Expected Reward on Trial 7");

        console.log("\nTest Completed");
        await Participant.deleteOne({ participantId: TEST_ID });
        mongoose.connection.close();

    } catch (e) {
        console.error(e);
    }
};

RUN_TEST();

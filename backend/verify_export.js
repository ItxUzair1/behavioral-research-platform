const mongoose = require('mongoose');
const adminController = require('./controllers/adminController');
const fs = require('fs');

// Mock Request and Response
const req = {};
const res = {
    header: (key, val) => { }, // ignore
    attachment: (filename) => { }, // ignore
    status: function (code) { return this; },
    json: (data) => console.log(`[JSON]`, JSON.stringify(data, null, 2)),
    send: (data) => {
        console.log('[CSV Generated]');
        const lines = data.split('\n');
        if (lines.length > 0) {
            fs.writeFileSync('export_headers.txt', lines[0]);
            console.log('Headers written to export_headers.txt');
        }
    }
};

const runVerification = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/behavioral_platform');
        console.log('Connected to DB');

        const count = await require('./models/Participant').countDocuments();
        console.log(`Found ${count} participants in DB.`);

        if (count > 0) {
            console.log('\n--- Testing Full Export ---');
            await adminController.getFullExport(req, res);
        } else {
            console.log("No participants to test export.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();

const mongoose = require('mongoose');

const trialLogSchema = new mongoose.Schema({
    participantId: {
        type: String,
        required: true,
        index: true
    },
    taskType: {
        type: String,
        enum: ["Matching", "Sorting", "Dragging", "matching", "sorting", "dragging"],
        required: true
    },
    phase: {
        type: String, // "Genuine", "Apparent", "Coercion", "Pre-Training"
        required: true
    },
    taskVariant: {
        type: String, // "Task A" or "Task B" or "Pre-Training"
        default: "Pre-Training"
    },
    trialNumber: {
        type: Number,
        required: true
    },
    responseTime: {
        type: Number, // in ms
        required: true
    },
    correct: {
        type: Boolean,
        default: true
    },
    reinforcementDelivered: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TrialLog', trialLogSchema);

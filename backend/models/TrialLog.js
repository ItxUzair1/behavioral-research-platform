const mongoose = require('mongoose');

const trialLogSchema = new mongoose.Schema({
    participantId: {
        type: String,
        required: true,
        index: true
    },
    taskType: {
        type: String,
        enum: ["Matching", "Sorting", "Dragging", "matching", "sorting", "dragging", "ChoiceTask", "MiniSurvey"],
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
    selectedOption: {
        type: String, // e.g., "Left", "Right", "Bin 1", or Item Name
        default: null
    },
    scheduleRequirement: {
        type: Number, // The VR/PR threshold required for this trial
        default: null
    },
    eventType: {
        type: String, // "Trial", "OptOut", "Choice", "Survey", "SwitchTask"
        enum: ["Trial", "OptOut", "Choice", "Survey", "SwitchTask"],
        default: "Trial"
    },
    dayNumber: {
        type: Number, // Which study day this log belongs to (1, 2, 3, ...)
        default: 1
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TrialLog', trialLogSchema);

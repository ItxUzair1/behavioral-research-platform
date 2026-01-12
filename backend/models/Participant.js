const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    participantId: {
        type: String,
        required: true,
        unique: true
    },
    conditionOrder: {
        type: [String],
        default: ["Genuine", "Apparent", "Coercion"]
    },
    currentStep: {
        type: String, // e.g., "Demographics", "Genuine", "Apparent"
        default: "Consent"
    },
    demographics: {
        age: Number,
        gender: String,
        education: String,
        comments: String
    },
    choiceTask: {
        type: String, // "task-a" or "task-b"
        default: null
    },
    earnings: {
        type: Number,
        default: 0
    },
    timestamps: {
        consentGiven: Date,
        demographicsCompleted: Date,
        genuineAssentChoice: Date,
        studyCompleted: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);

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
        race_ethnicity: [String],
        geographic_region: String,
        education_level: String,
        socioeconomic_status: String,
        comments: String
    },
    choiceTask: {
        type: String, // "task-a" or "task-b"
        default: null
    },
    genuine_choices: {
        matching_choice: {
            selection: String,
            latency: Number,
            timestamp: Date
        },
        sorting_choice: {
            selection: String,
            latency: Number,
            timestamp: Date
        }
    },
    pre_training_completion: {
        type: Map,
        of: Number // trial count per task
    },
    reinforcementState: {
        matching: {
            counter: { type: Number, default: 0 },
            threshold: { type: Number, default: 4 } // Initial seed
        },
        sorting: {
            counter: { type: Number, default: 0 },
            threshold: { type: Number, default: 4 }
        },
        dragging: {
            counter: { type: Number, default: 0 },
            threshold: { type: Number, default: 4 }
        }
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

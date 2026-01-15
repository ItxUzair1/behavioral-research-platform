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
            schedule: { type: [Number], default: [] }, // The pre-generated VR schedule
            scheduleIndex: { type: Number, default: 0 }, // Pointer to current threshold in schedule
            correctCount: { type: Number, default: 0 }, // Correct responses towards current threshold
            trialsCompleted: { type: Number, default: 0 } // Total trials in this condition
        },
        sorting: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        dragging: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
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

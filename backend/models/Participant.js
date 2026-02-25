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
    visible_total_earnings: { type: Number, default: 0 },
    days_completed: { type: Number, default: 0 },
    last_completed_date: { type: Date, default: null },
    lastSessionInitDate: { type: Date, default: null }, // Tracks when the daily session was initialized/reset
    study_complete: { type: Boolean, default: false },
    steady_days_counter: { type: Number, default: 0 },
    forced_completion: { type: Boolean, default: false },
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
            selection: String, // e.g., "letters", "syllables"
            latency: Number,
            timestamp: Date
        },
        dragging_choice: {
            selection: String, // e.g., "vr", "pr"
            latency: Number,
            timestamp: Date
        }
    },
    pre_training_completion: {
        type: Map,
        of: Number // trial count per task
    },
    reinforcementState: {
        // --- Generic Sub-Schema for Reinforcement ---
        // We can't use a shared object definition easily in Mongoose without subdocuments or copy-paste.
        // Expanding explicitly for clarity and queryability.

        // Genuine Phase
        matching_genuine: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        sorting_genuine: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        dragging_genuine: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },

        // Apparent Phase
        matching_apparent: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        sorting_apparent: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        dragging_apparent: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },

        // Coercion Phase
        matching_coercion: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        sorting_coercion: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        dragging_coercion: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },

        // Legacy / Fallback (optional, keeping for safety if older code queries it, though we will update service)
        matching: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
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
        },
        dragging_pr: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        },
        dragging_genuine_pr: {
            schedule: { type: [Number], default: [] },
            scheduleIndex: { type: Number, default: 0 },
            correctCount: { type: Number, default: 0 },
            trialsCompleted: { type: Number, default: 0 }
        }
    },
    earningsByTask: {
        matching_genuine: { type: Number, default: 0 },
        sorting_genuine: { type: Number, default: 0 },
        dragging_genuine: { type: Number, default: 0 },
        matching_apparent: { type: Number, default: 0 },
        sorting_apparent: { type: Number, default: 0 },
        dragging_apparent: { type: Number, default: 0 },
        matching_coercion: { type: Number, default: 0 },
        sorting_coercion: { type: Number, default: 0 },
        dragging_coercion: { type: Number, default: 0 }
    },
    earnings: {
        type: Number,
        default: 0
    },
    earnings_at_day_start: {
        type: Number,
        default: 0
    },
    optOutStats: {
        matching_genuine: { latency: Number, count: Number },
        sorting_genuine: { latency: Number, count: Number },
        dragging_genuine: { latency: Number, count: Number },
        matching_apparent: { latency: Number, count: Number },
        sorting_apparent: { latency: Number, count: Number },
        dragging_apparent: { latency: Number, count: Number },
        matching_coercion: { latency: Number, count: Number },
        sorting_coercion: { latency: Number, count: Number },
        dragging_coercion: { latency: Number, count: Number }
    },
    switchTaskStats: {
        matching_genuine: { latency: Number, count: Number },
        sorting_genuine: { latency: Number, count: Number },
        dragging_genuine: { latency: Number, count: Number }
    },
    miniSurveys: {
        genuine: { rating: Number, timestamp: Date },
        apparent: { rating: Number, timestamp: Date },
        coercion: { rating: Number, timestamp: Date }
    },
    postSurvey: {
        preferenceRanking: [String], // e.g. ["Green (Genuine)", "Purple (Apparent)", "Orange (Coercion)"]
        demandRanking: [String],
        senseOfControl: String,
        emotionalResponse: {
            genuine: Number, // 0-100
            apparent: Number,
            coercion: Number
        },
        timestamp: Date
    },
    timestamps: {
        consentGiven: Date,
        demographicsCompleted: Date,
        genuineAssentChoice: Date,
        studyCompleted: Date
    },
    payoutInfo: {
        email: { type: String, trim: true },
        status: {
            type: String,
            enum: ['Not Requested', 'Pending', 'Paid'],
            default: 'Not Requested'
        },
        paidAt: Date,
        paymentMethod: { type: String, default: 'PayPal' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);

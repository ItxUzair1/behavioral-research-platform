const Participant = require('../models/Participant');
const TrialLog = require('../models/TrialLog');

// Initial setup for randomization
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- Stimulus Generators ---
const EQUATIONS = [
    { q: "2 + 2", a: "4" }, { q: "3 + 5", a: "8" }, { q: "10 - 4", a: "6" },
    { q: "5 * 2", a: "10" }, { q: "12 / 3", a: "4" }, { q: "7 + 6", a: "13" }
];
const MAMMALS = [
    { name: "Lion", id: "lion" },
    { name: "Tiger", id: "tiger" },
    { name: "Bear", id: "bear" },
    { name: "Elephant", id: "elephant" },
    { name: "Whale", id: "whale" }
];
const NON_MAMMALS = [
    { name: "Snake", id: "snake" },
    { name: "Lizard", id: "lizard" },
    { name: "Eagle", id: "eagle" },
    { name: "Shark", id: "shark" },
    { name: "Frog", id: "frog" }
];

const LETTERS = [
    { q: "A", a: "Vowel" }, { q: "E", a: "Vowel" }, { q: "I", a: "Vowel" },
    { q: "B", a: "Consonant" }, { q: "K", a: "Consonant" }, { q: "Z", a: "Consonant" }
];
const SYLLABLES = [
    { q: "Cat", a: "1" }, { q: "Dog", a: "1" },
    { q: "Paper", a: "2" }, { q: "Water", a: "2" },
    { q: "Elephant", a: "3" }, { q: "Banana", a: "3" }
];

exports.getStimulus = async (req, res) => {
    try {
        const { type, variant } = req.query;
        let data = {};

        if (type === 'matching') {
            if (variant === 'equations') {
                // New Logic: Target is the number (Answer), Options are equations (Question)
                // We need to generate a target number, then 1 correct equation and 2 distractors.

                // Helper to generate equation for a result
                const generateEquation = (target) => {
                    const mode = randomInt(1, 4); // 1:+, 2:-, 3:*, 4:/
                    if (mode === 1) { // +
                        const a = randomInt(1, target - 1);
                        return `${a} + ${target - a}`;
                    } else if (mode === 2) { // -
                        const a = randomInt(target + 1, target + 10);
                        return `${a} - ${a - target}`;
                    } else if (mode === 3) { // *
                        // Simple factors
                        const factors = [];
                        for (let i = 1; i <= target; i++) if (target % i === 0) factors.push(i);
                        const a = factors[randomInt(0, factors.length - 1)];
                        return `${target / a} x ${a}`;
                    } else { // /
                        const a = randomInt(2, 5);
                        return `${target * a} ÷ ${a}`;
                    }
                };

                const targetNum = randomInt(4, 20); // manageable numbers
                const correctEq = generateEquation(targetNum);

                // Distractors
                const distractor1 = generateEquation(targetNum + randomInt(1, 5));
                const distractor2 = generateEquation(targetNum - randomInt(1, 3));

                const opts = [correctEq, distractor1, distractor2].sort(() => Math.random() - 0.5);

                // We send 'target' as the answer (displayed on right)
                // 'options' as the draggables (displayed on left)
                // Implicitly, the frontend needs to know which option is correct. 
                // We can send the correct string in a hidden field or verify on backend.
                // For security/simplicity in this refactor, we just verify loosely or send 'correctOptionId'.
                // Actually, backend submit checks 'correct' boolean sent from frontend. 
                // To prevent cheating, we should validate on backend, but current arch trusts frontend 'correct' flag.
                // We'll stick to that for now.

                data = {
                    stimulus: targetNum.toString(), // The static target on the right
                    options: opts, // The draggables on the left
                    correctOption: correctEq // Helper for frontend to know which one is true
                };

            } else if (variant === 'mammals') {
                const correct = MAMMALS[randomInt(0, MAMMALS.length - 1)];
                // Pick 2 distinct distractors
                const d1 = NON_MAMMALS[randomInt(0, NON_MAMMALS.length - 1)];
                let d2 = NON_MAMMALS[randomInt(0, NON_MAMMALS.length - 1)];
                while (d2.name === d1.name) {
                    d2 = NON_MAMMALS[randomInt(0, NON_MAMMALS.length - 1)];
                }

                const opts = [correct, d1, d2].sort(() => Math.random() - 0.5);

                data = {
                    stimulus: correct.name, // Display Name on Right
                    options: opts,          // Draggables on Left (Objects: {name, img})
                    correctOption: correct.name // Validation uses Name
                };
            }
        } else if (type === 'sorting') {
            if (variant === 'letters') {
                // Fixed Categories: A-I, J-R, S-Z
                const categories = ["A-I", "J-R", "S-Z"];
                const ranges = {
                    "A-I": "ABCDEFGHI",
                    "J-R": "JKLMNOPQR",
                    "S-Z": "STUVWXYZ"
                };

                // Helper to get random letter from range
                const getLetter = (cat) => ranges[cat][randomInt(0, ranges[cat].length - 1)];

                // Generate 3 items (options) for the left side
                // We want at least one to be correct for *some* category? 
                // Actually the user drags Item -> Category.
                // Image shows 3 distinct items on left. 3 distinct bins on right.
                // Assuming any item can be dragged to its corresponding bin.

                const opts = [];
                for (let i = 0; i < 3; i++) {
                    const cat = categories[randomInt(0, 2)];
                    opts.push({ text: getLetter(cat), category: cat });
                }

                data = {
                    stimulus: "Sort Items",
                    targets: categories, // Right Side Bins
                    options: opts        // Left Side Items (with their correct category secret)
                };

            } else if (variant === 'syllables') {
                const categories = ["1 Syllable", "2 Syllables", "3 Syllables"];
                const wordMap = {
                    "1 Syllable": ["Cat", "Dog", "Sun", "Moon", "Fish"],
                    "2 Syllables": ["Paper", "Water", "Apple", "Table", "Happy"],
                    "3 Syllables": ["Elephant", "Banana", "Computer", "Radio", "Camera"]
                };

                const getWord = (cat) => wordMap[cat][randomInt(0, wordMap[cat].length - 1)];

                const opts = [];
                for (let i = 0; i < 3; i++) {
                    const cat = categories[randomInt(0, 2)];
                    opts.push({ text: getWord(cat), category: cat });
                }

                data = {
                    stimulus: "Sort Syllables",
                    targets: categories,
                    options: opts
                };
            }
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.submitResult = async (req, res) => {
    try {
        const { participantId, taskType, phase, correct } = req.body;
        // taskType should be 'matching', 'sorting', 'dragging'
        // phase is 'Pre-Training', 'Genuine', etc.

        if (!participantId || !taskType) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        const participant = await Participant.findOne({ participantId });
        if (!participant) {
            return res.status(404).json({ success: false, message: "Participant not found" });
        }

        let reward = false;
        let amount = 0;

        // Log Logic
        // (Ideally we call LogTrial here individually or rely on frontend to call the other endpoint.
        // For atomic integrity, handling logic here is better if we want to secure earnings.)

        const isPreTraining = phase && phase.toLowerCase().includes('pre-training');

        if (correct && !isPreTraining) {
            // Apply VR4 Schedule
            // normalize type key
            const typeKey = taskType.toLowerCase();
            const state = participant.reinforcementState[typeKey];

            if (state) {
                state.counter += 1;

                if (state.counter >= state.threshold) {
                    // Start Reward
                    reward = true;
                    amount = 0.05; // 5 cents
                    participant.earnings += amount;

                    // Reset VR logic
                    state.counter = 0;
                    state.threshold = randomInt(1, 8); // Range 1-8, avg 4.5
                }
            }
        }

        await participant.save();

        res.json({
            success: true,
            reward,
            amount,
            totalEarnings: participant.earnings,
            nextThreshold: isPreTraining ? 0 : participant.reinforcementState[taskType.toLowerCase()].threshold
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

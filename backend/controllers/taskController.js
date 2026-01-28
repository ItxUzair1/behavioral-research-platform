const Participant = require('../models/Participant');
const TrialLog = require('../models/TrialLog');
const RewardService = require('../services/rewardService');

// Initial setup for randomization
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- Stimulus Generators ---
const EQUATIONS = [
    { q: "2 + 2", a: "4" }, { q: "3 + 5", a: "8" }, { q: "10 - 4", a: "6" },
    { q: "5 * 2", a: "10" }, { q: "12 / 3", a: "4" }, { q: "7 + 6", a: "13" }
];
const MAMMALS = [
    { name: "Lion", id: "lion", ext: ".png" },
    { name: "Tiger", id: "tiger", ext: ".png" },
    { name: "Bear", id: "bear", ext: ".jfif" },
    { name: "Elephant", id: "elephant", ext: ".jfif" },
    { name: "Whale", id: "whale", ext: ".jfif" },
    { name: "Monkey", id: "monkey", ext: ".jfif" },
    { name: "Giraffe", id: "giraffe", ext: ".jfif" },
    { name: "Zebra", id: "zebra", ext: ".jfif" },
    { name: "Kangaroo", id: "kangaroo", ext: ".jfif" },
    { name: "Panda", id: "panda", ext: ".jfif" },
    { name: "Dolphin", id: "dolphin", ext: ".jfif" },
    { name: "Wolf", id: "wolf", ext: ".jfif" }
];
const BIRDS = [
    { name: "Eagle", id: "eagle", ext: ".jfif" },
    { name: "Parrot", id: "parrot", ext: ".jfif" },
    { name: "Penguin", id: "penguin", ext: ".jfif" },
    { name: "Owl", id: "owl", ext: ".jfif" },
    { name: "Duck", id: "duck", ext: ".jfif" },
    { name: "Flamingo", id: "flamingo", ext: ".jfif" },
    { name: "Peacock", id: "peacock", ext: ".jfif" },
    { name: "Swan", id: "swan", ext: ".jfif" },
    { name: "Sparrow", id: "sparrow", ext: ".jfif" },
    { name: "Hawk", id: "hawk", ext: ".jfif" },
    { name: "Pigeon", id: "pigeon", ext: ".jpg" }
];
const REPTILES = [
    { name: "Snake", id: "snake", ext: ".jfif" },
    { name: "Lizard", id: "lizard", ext: ".jfif" },
    { name: "Crocodile", id: "crocodile", ext: ".jfif" },
    { name: "Turtle", id: "turtle", ext: ".jfif" },
    { name: "Chameleon", id: "chameleon", ext: ".jfif" },
    { name: "Iguana", id: "iguana", ext: ".jfif" },
    { name: "Gecko", id: "gecko", ext: ".jfif" },
    { name: "Alligator", id: "alligator", ext: ".jfif" },
    { name: "Komodo", id: "komodo", ext: ".jfif" },
    { name: "Python", id: "python", ext: ".jfif" }
];

const AMPHIBIANS_FISH = [
    { name: "Frog", id: "frog", ext: ".jfif" },
    { name: "Shark", id: "shark", ext: ".jfif" }
];

const NON_MAMMALS = [...BIRDS, ...REPTILES, ...AMPHIBIANS_FISH];

const LETTERS = [
    { q: "A", a: "Vowel" }, { q: "E", a: "Vowel" }, { q: "I", a: "Vowel" },
    { q: "B", a: "Consonant" }, { q: "K", a: "Consonant" }, { q: "Z", a: "Consonant" }
];
const SYLLABLES = [
    { q: "Cat", a: "1" }, { q: "Dog", a: "1" },
    { q: "Paper", a: "2" }, { q: "Water", a: "2" },
    { q: "Elephant", a: "3" }, { q: "Banana", a: "3" }
];



const generateStimulusData = (type, variant) => {
    let data = {};

    if (type === 'matching') {
        if (variant === 'equations') {
            const generateEquation = (target) => {
                const mode = randomInt(1, 4); // 1:+, 2:-, 3:*, 4:/
                if (mode === 1) { // +
                    const a = randomInt(1, target - 1);
                    return `${a} + ${target - a}`;
                } else if (mode === 2) { // -
                    const a = randomInt(target + 1, target + 10);
                    return `${a} - ${a - target}`;
                } else if (mode === 3) { // *
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

            data = {
                stimulus: targetNum.toString(),
                options: opts,
                correctOption: correctEq
            };

        } else if (variant === 'mammals') {
            const correct = MAMMALS[randomInt(0, MAMMALS.length - 1)];
            const d1 = NON_MAMMALS[randomInt(0, NON_MAMMALS.length - 1)];
            let d2 = NON_MAMMALS[randomInt(0, NON_MAMMALS.length - 1)];
            while (d2.name === d1.name) {
                d2 = NON_MAMMALS[randomInt(0, NON_MAMMALS.length - 1)];
            }

            const opts = [correct, d1, d2].sort(() => Math.random() - 0.5);

            data = {
                stimulus: "Mammal",
                options: opts,
                correctOption: correct.name
            };
        }
    } else if (type === 'sorting') {
        if (variant === 'letters') {
            const categories = ["A-I", "J-R", "S-Z"];
            const ranges = {
                "A-I": "ABCDEFGHI",
                "J-R": "JKLMNOPQR",
                "S-Z": "STUVWXYZ"
            };

            const getLetter = (cat) => ranges[cat][randomInt(0, ranges[cat].length - 1)];

            const opts = [];
            const usedLetters = new Set();

            let safety = 0;
            while (opts.length < 3 && safety < 50) {
                safety++;
                const cat = categories[randomInt(0, 2)];
                const letter = getLetter(cat);

                if (!usedLetters.has(letter)) {
                    usedLetters.add(letter);
                    opts.push({ text: letter, category: cat });
                }
            }

            data = {
                stimulus: "Sort Items",
                targets: categories,
                options: opts
            };

        } else if (variant === 'syllables') {
            const categories = ["1 Syllable", "2 Syllables", "3 Syllables"];
            const wordMap = {
                "1 Syllable": [
                    "Cat", "Dog", "Sun", "Moon", "Fish",
                    "Hat", "Ball", "Cup", "Tree", "Car",
                    "Book", "Pen", "Door", "Bird", "Cloud",
                    "Sky", "Rain", "Snow", "Wind", "Star",
                    "Key", "Lock", "Shoe", "Sock", "Bag"
                ],
                "2 Syllables": [
                    "Paper", "Water", "Apple", "Table", "Happy",
                    "Tiger", "Pencil", "Window", "Flower", "Garden",
                    "Doctor", "Teacher", "Sister", "Brother", "Pocket",
                    "Rabbit", "Monkey", "Lion", "Zebra", "Pizza",
                    "Cookie", "Candy", "Balloon", "Party", "Music"
                ],
                "3 Syllables": [
                    "Elephant", "Banana", "Computer", "Radio", "Camera",
                    "Umbrella", "Tomato", "Potato", "Hospital", "Library",
                    "Octopus", "Butterfly", "Galaxy", "Telephone", "Energy",
                    "Strawberry", "Pineapple", "Dinosaur", "Basketball", "Violin",
                    "Video", "Calendar", "Envelope", "Bicycle", "Vacation"
                ]
            };

            const getWord = (cat) => wordMap[cat][randomInt(0, wordMap[cat].length - 1)];

            const opts = [];
            const usedWords = new Set();

            let safety = 0;
            while (opts.length < 3 && safety < 50) {
                safety++;
                const cat = categories[randomInt(0, 2)];
                const word = getWord(cat);

                if (!usedWords.has(word)) {
                    usedWords.add(word);
                    opts.push({ text: word, category: cat });
                }
            }

            data = {
                stimulus: "Sort Syllables",
                targets: categories,
                options: opts
            };
        }
    }
    return data;
};

exports.getStimulus = async (req, res) => {
    try {
        const { type, variant, batchSize } = req.query;

        const count = parseInt(batchSize) || 1;

        if (count > 1) {
            const results = [];
            for (let i = 0; i < count; i++) {
                results.push(generateStimulusData(type, variant));
            }
            return res.json({ success: true, data: results });
        } else {
            const data = generateStimulusData(type, variant);
            return res.json({ success: true, data });
        }

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.submitResult = async (req, res) => {
    try {
        const { participantId, taskType, condition, correct, variant } = req.body;
        // condition should be 'Genuine', 'Apparent', 'Coercion' (mapped from Phase usually)

        if (!participantId || !taskType) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        const result = await RewardService.processTrial(participantId, taskType, correct, condition, variant);

        res.json({
            success: true,
            reward: result.rewardEarned,
            amount: result.rewardAmount,
            totalEarnings: result.totalEarnings,
            trialsCompleted: result.trialsCompleted,
            currentThreshold: result.currentThreshold // Send back threshold for logging
        });

    } catch (error) {
        console.error("Submit Result Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.startTask = async (req, res) => {
    try {
        const { participantId, taskType, condition, variant } = req.body;
        if (!participantId || !taskType) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }

        // Pass 'condition' and 'variant'
        const data = await RewardService.startTask(participantId, taskType, condition, variant);
        res.json({ success: true, data });
    } catch (error) {
        console.error("Start Task Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getEarnings = async (req, res) => {
    try {
        const { participantId } = req.query;
        if (!participantId) {
            return res.status(400).json({ success: false, message: "Missing participantId" });
        }

        const data = await RewardService.getEarnings(participantId);
        res.json({ success: true, data });
    } catch (error) {
        console.error("Get Earnings Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

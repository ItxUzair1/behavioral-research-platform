import React, { useState } from 'react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const MiniSurvey = ({ phase, participantId, onComplete }) => {
    const [rating, setRating] = useState(null);
    const [loading, setLoading] = useState(false);

    // Determine Theme based on phase
    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isApparent = phase?.toLowerCase().includes('apparent');
    const isCoercion = phase?.toLowerCase().includes('coercion');

    let theme = {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        button: 'bg-gray-600 hover:bg-gray-700',
        activeRating: 'bg-gray-200 border-gray-400'
    };

    if (isGenuine) {
        theme = {
            bg: 'bg-green-50',
            border: 'border-green-200',
            button: 'bg-green-600 hover:bg-green-700',
            activeRating: 'bg-green-200 border-green-500 ring-2 ring-green-300'
        };
    } else if (isApparent) {
        theme = {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            button: 'bg-purple-600 hover:bg-purple-700',
            activeRating: 'bg-purple-200 border-purple-500 ring-2 ring-purple-300'
        };
    } else if (isCoercion) {
        theme = {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            button: 'bg-orange-600 hover:bg-orange-700',
            activeRating: 'bg-orange-200 border-orange-500 ring-2 ring-orange-300'
        };
    }

    const handleSubmit = async () => {
        if (!rating) return;
        setLoading(true);
        try {
            // Map phase string to schema key
            let schemaKey = 'genuine';
            if (isApparent) schemaKey = 'apparent';
            if (isCoercion) schemaKey = 'coercion';

            // Construct update object
            // Mongoose update for nested field: "miniSurveys.genuine"
            const updateData = {
                [`miniSurveys.${schemaKey}`]: {
                    rating: parseInt(rating),
                    timestamp: new Date()
                }
            };

            await api.updateParticipant(participantId, updateData);

            // 2. Log Event for Daily Metrics
            await api.logTrial({
                participantId,
                taskType: 'MiniSurvey',
                phase: isGenuine ? 'Genuine' : isApparent ? 'Apparent' : 'Coercion',
                eventType: 'Survey',
                selectedOption: rating, // Store rating
                responseTime: 0,
                trialNumber: 0,
                correct: true
            });

            onComplete();
        } catch (err) {
            console.error("Failed to submit survey", err);
            // Allow proceed anyway? Or show error?
            // User requested survey, better to ensure it's saved. But we shouldn't block the study flow on network glitch forever.
            // For now, simple alert or auto-retry? Let's callback anyway to not trap user.
            onComplete();
        } finally {
            setLoading(false);
        }
    };

    const OPTIONS = [
        { val: 1, label: "Highly Non-Preferred" },
        { val: 2, label: "Not Preferred" },
        { val: 3, label: "Neutral" },
        { val: 4, label: "Preferred" },
        { val: 5, label: "Highly Preferred" }
    ];

    return (
        <div className={`w-full max-w-2xl mx-auto p-8 rounded-2xl border-2 shadow-lg text-center ${theme.bg} ${theme.border} transition-colors duration-500`}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Review</h2>
            <p className="text-xl mb-8 font-medium">
                Please rank your preference of the previous arrangement.
            </p>

            <div className="flex flex-col gap-3 mb-8">
                {OPTIONS.map((opt) => (
                    <label
                        key={opt.val}
                        className={`
                            relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${rating === opt.val ? theme.activeRating : 'bg-white border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <input
                            type="radio"
                            name="preference"
                            value={opt.val}
                            checked={rating === opt.val}
                            onChange={() => setRating(opt.val)}
                            className="w-5 h-5 mr-4"
                        />
                        <span className="text-lg font-medium text-gray-700">{opt.val} - {opt.label}</span>
                    </label>
                ))}
            </div>

            <Button
                onClick={handleSubmit}
                disabled={!rating || loading}
                className={`w-full py-4 text-lg font-bold text-white shadow-md ${theme.button} disabled:opacity-50`}
            >
                {loading ? "Saving..." : "Submit Response"}
            </Button>
        </div>
    );
};

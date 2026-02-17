import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { MousePointerClick, Timer } from 'lucide-react';
import { api } from '../../../services/api';

export const ChoiceSelection = ({ options = [], choiceStep, onConfirm, participantId }) => {
    // options: [{ id: 'task-a', title: 'Task A', description: '...', image: '...' }]
    const [selectedTask, setSelectedTask] = useState(null);
    const [timer, setTimer] = useState(0);

    // Simple timer logic
    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (selectedTask) {
            setLoading(true);
            try {
                // Determine update object based on choiceStep
                // choiceStep could be "matching_choice" or "sorting_choice"
                const updateKey = `genuine_choices.${choiceStep}`;

                const updatePayload = {
                    [updateKey]: {
                        selection: selectedTask,
                        latency: timer,
                        timestamp: new Date()
                    }
                    // We do NOT update currentStep here, as we might move to next pre-training phase
                };

                // 1. Update Participant State (Legacy/Current Step Logic)
                await api.updateParticipant(participantId, updatePayload);

                // 2. Log Event for Daily Metrics
                // Derive task category from choiceStep ("matching_choice" → "Matching")
                const taskCategory = choiceStep ? choiceStep.replace('_choice', '') : 'unknown';
                const capitalizedCategory = taskCategory.charAt(0).toUpperCase() + taskCategory.slice(1);

                await api.logTrial({
                    participantId,
                    taskType: 'ChoiceTask',
                    phase: capitalizedCategory, // "Matching", "Sorting", or "Dragging"
                    eventType: 'Choice',
                    selectedOption: selectedTask,
                    responseTime: timer * 1000, // Convert to ms
                    trialNumber: 0,
                    correct: true
                });

                onConfirm(selectedTask);
            } catch (error) {
                console.error("Choice Save Error:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Image Mapping
    const IMAGE_MAP = {
        'equations': '/images/matching_equations.png',
        'mammals': '/images/matching_mammals.png',
        'letters': '/images/sorting_letters.png',
        'syllables': '/images/sorting_sylablles.png', // Note: filename typo matches user's file
        'vr': '/images/dragging_square.png',
        'pr': '/images/dragging_circle.png'
    };

    const SelectionCard = ({ id, title, description }) => {
        const isSelected = selectedTask === id;
        const imageSrc = IMAGE_MAP[id];

        return (
            <div
                onClick={() => setSelectedTask(id)}
                className={`
          cursor-pointer relative overflow-hidden transition-all duration-300
          border-2 rounded-2xl p-6 flex flex-col h-full
          ${isSelected
                        ? 'border-gray-900 bg-gray-50 shadow-lg scale-[1.02]'
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'
                    }
        `}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-gray-900">{title}</h3>
                    <div className={`
             w-6 h-6 rounded-full border flex items-center justify-center transition-colors
             ${isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}
           `}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                </div>

                <div className="mb-6 h-48 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden relative">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={`Screenshot of ${title}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-gray-400 text-xs font-mono uppercase text-center p-4">
                            [Screenshot of {title}]<br />
                            (Image not found)
                        </div>
                    )}
                </div>


            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose Your Task</h1>
                <p className="text-lg text-gray-500 max-w-xl mx-auto">
                    Based on your experience, please select which task you would like to perform
                    to earn money in this section.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {options.map(opt => (
                    <SelectionCard
                        key={opt.id}
                        id={opt.id}
                        title={opt.title}
                        description={opt.description}
                    />
                ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-900 font-semibold text-lg">
                    You can earn up to $1.60 in this section
                </p>
            </div>

            <div className="flex items-center justify-center gap-8 pt-2">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
                    <Timer className="w-4 h-4" />
                    <span>Decision Time: {timer}s</span>
                </div>

                <Button
                    onClick={handleConfirm}
                    disabled={!selectedTask || loading}
                    className="w-48 shadow-xl"
                >
                    {loading ? 'Confirming...' : 'Confirm Selection'}
                </Button>
            </div>
        </div>
    );
};

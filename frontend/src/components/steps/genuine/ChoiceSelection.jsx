import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { MousePointerClick, Timer } from 'lucide-react';
import { api } from '../../../services/api';

export const ChoiceSelection = ({ onConfirm, participantId }) => {
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
                await api.updateParticipant(participantId, {
                    choiceTask: selectedTask,
                    currentStep: 'Execution' // Marking progress
                });
                onConfirm(selectedTask);
            } catch (error) {
                console.error("Choice Save Error:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const SelectionCard = ({ id, title, description, reward }) => {
        const isSelected = selectedTask === id;

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

                <div className="mb-6 h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-gray-400 text-xs font-mono uppercase">Preview Image</span>
                </div>

                <p className="text-gray-600 text-sm mb-6 flex-1">
                    {description}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 px-6 py-4">
                    <span className="text-sm font-medium text-gray-500">Fixed Reward</span>
                    <span className="font-bold text-gray-900">{reward}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose Your Task</h1>
                <p className="text-lg text-gray-500 max-w-xl mx-auto">
                    You have now experienced all tasks. Please select which one you would
                    like to perform for the remainder of this session to earn your payment.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <SelectionCard
                    id="task-a"
                    title="Task Bundle A"
                    description="Contains mainly Matching and Sorting tasks. Requires moderate attention and speed."
                    reward="$5.00"
                />
                <SelectionCard
                    id="task-b"
                    title="Task Bundle B"
                    description="Contains mainly Sorting and Dragging tasks. Requires high precision and focus."
                    reward="$5.00"
                />
            </div>

            <div className="flex items-center justify-center gap-8 pt-6">
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

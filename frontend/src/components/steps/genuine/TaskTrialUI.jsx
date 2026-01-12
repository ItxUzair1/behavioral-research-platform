import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Puzzle, ArrowLeftRight, Move, Check, X } from 'lucide-react';
import { api } from '../../../services/api';

const TASK_CONFIG = {
    matching: {
        title: "Pattern Matching",
        description: "Match the incoming shapes with the correct target slots.",
        theme: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-900',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            accent: 'border-blue-400'
        },
        icon: Puzzle
    },
    sorting: {
        title: "Category Sorting",
        description: "Quickly sort the items into their correct categories.",
        theme: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-900',
            icon: 'text-green-600',
            button: 'bg-green-600 hover:bg-green-700',
            accent: 'border-green-400'
        },
        icon: ArrowLeftRight
    },
    dragging: {
        title: "Precision Dragging",
        description: "Drag the target to the destination within the path limits.",
        theme: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-900',
            icon: 'text-orange-600',
            button: 'bg-orange-600 hover:bg-orange-700',
            accent: 'border-orange-400'
        },
        icon: Move
    }
};

export const TaskTrialUI = ({ type = 'matching', trialNumber, totalTrials, onComplete, participantId }) => {
    const [complete, setComplete] = useState(false);
    const config = TASK_CONFIG[type];
    const Icon = config.icon;

    const [backendLog, setBackendLog] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSimulateTask = async () => {
        if (isSubmitting) return;

        // Simulate performing the task
        const rt = Math.floor(Math.random() * 500 + 800);
        setIsSubmitting(true);
        setError(null);

        try {
            if (!participantId) {
                console.warn("No participantId found, using 'GUEST' for testing");
            }

            await api.logTrial({
                participantId: participantId || "GUEST",
                taskType: type,
                taskVariant: 'Pre-Training',
                trialNumber,
                responseTime: rt,
                correct: true
            });
            setBackendLog(`Saved to DB (RT: ${rt}ms)`);
            setComplete(true);
        } catch (err) {
            console.error("Trial Log Error:", err);
            setError("Backend Error: " + err.message + ". (Check if backend server is running)");
            // Optional: fallback to complete even if backend fails, for testing
            // setComplete(true); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        setComplete(false);
        onComplete();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={`p-6 rounded-2xl border ${config.theme.bg} ${config.theme.border} flex items-start gap-4 transition-all duration-300`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm ${config.theme.icon}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className={`text-xl font-bold ${config.theme.text} mb-1`}>{config.title}</h2>
                            <p className={`${config.theme.text} opacity-80`}>{config.description}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full bg-white/50 text-sm font-mono font-medium ${config.theme.text}`}>
                            Trial {trialNumber} / {totalTrials}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Interaction Area */}
            <Card className={`min-h-[400px] flex items-center justify-center relative overflow-hidden border-t-4 ${config.theme.accent}`}>
                {complete ? (
                    <div className="text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Check className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Trial Logged</h3>
                        <p className="text-gray-500 text-sm">{backendLog}</p>

                        <div className="mt-8">
                            <Button onClick={handleNext} className={config.theme.button}>
                                Next Trial
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 w-full max-w-md mx-auto">
                        <div className="p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 group hover:border-gray-400 transition-colors cursor-pointer" onClick={handleSimulateTask}>
                            <p className="text-gray-400 font-medium group-hover:text-gray-600">
                                [ Interactive {config.title} Placeholder ]
                            </p>
                            <p className="text-xs text-gray-300 mt-2">
                                Click here to simulate completing this trial
                            </p>
                        </div>
                        <p className="text-sm text-gray-400 font-mono">
                            Listening for user interaction...
                        </p>
                    </div>
                )}

                <div className="absolute bottom-4 left-4 p-2 flex flex-col items-start gap-1">
                    <div className="bg-black/5 rounded px-2 py-1 text-[10px] text-gray-400 font-mono">
                        Mode: Pre-Training | backend_log: {backendLog || 'pending'}
                    </div>
                    {error && (
                        <div className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs border border-red-200">
                            {error}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

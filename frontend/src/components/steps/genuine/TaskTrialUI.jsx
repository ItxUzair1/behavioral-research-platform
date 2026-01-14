import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Puzzle, ArrowLeftRight, Move, Check, X } from 'lucide-react';
import { api } from '../../../services/api';
import { MatchingGame } from '../../game/MatchingGame';
import { SortingGame } from '../../game/SortingGame';

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

export const TaskTrialUI = ({ type = 'matching', variant = 'Pre-Training', phase = 'Unknown', trialNumber, totalTrials, onComplete, participantId, onOptOut }) => {
    const [complete, setComplete] = useState(false);
    const config = TASK_CONFIG[type];
    const Icon = config.icon;

    const [backendLog, setBackendLog] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSimulateTask = async (isCorrect = true, rt = 0) => {
        if (isSubmitting) return;

        // Simulate performing the task
        // const rt = Math.floor(Math.random() * 500 + 800); // Removed hardcoded random
        setIsSubmitting(true);
        setError(null);

        try {
            if (!participantId) {
                console.warn("No participantId found, using 'GUEST' for testing");
            }

            await api.logTrial({
                participantId: participantId || "GUEST",
                taskType: type,
                taskVariant: variant,
                phase: phase,
                trialNumber,
                responseTime: rt,
                correct: isCorrect
            });
            setBackendLog(`Saved to DB (RT: ${rt}ms)`);

            // Immediate transition
            onComplete();

        } catch (err) {
            console.error("Trial Log Error:", err);
            setError("Backend Error: " + err.message + ". (Check if backend server is running)");
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
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className={`text-xl font-bold ${config.theme.text}`}>{config.title}</h2>
                                {variant === 'Pre-Training' && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full border border-yellow-200 font-medium">
                                        Experience Only - No Money
                                    </span>
                                )}
                            </div>
                            <p className={`${config.theme.text} opacity-80`}>{config.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className={`px-3 py-1 rounded-full bg-white/50 text-sm font-mono font-medium ${config.theme.text}`}>
                                Trial {trialNumber} / {totalTrials}
                            </div>
                            {/* Opt Out Button - Logic: onOptOut prop callback */}
                            <button
                                onClick={onOptOut || (() => alert("Opt-out clicked"))}
                                className="text-xs text-red-600 hover:text-red-800 underline opacity-70 hover:opacity-100"
                            >
                                Opt out of task
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Interaction Area */}
            <Card className={`min-h-[400px] flex items-center justify-center relative overflow-hidden border-t-4 ${config.theme.accent}`}>
                <div className="w-full h-full p-4">
                    {type === 'matching' && (
                        <MatchingGame
                            variant={variant}
                            participantId={participantId}
                            phase={phase}
                            onTrialEnd={(correct, rt) => handleSimulateTask(correct, rt)}
                        />
                    )}
                    {type === 'sorting' && (
                        <SortingGame
                            variant={variant}
                            participantId={participantId}
                            phase={phase}
                            onTrialEnd={(correct, rt) => handleSimulateTask(correct, rt)}
                        />
                    )}
                    {type === 'dragging' && (
                        <div
                            onClick={() => handleSimulateTask(true, 1000)}
                            className="text-center p-10 text-gray-400 cursor-pointer hover:text-gray-600 border-2 border-dashed border-transparent hover:border-gray-200 rounded-xl transition-all"
                        >
                            [ Dragging Task Placeholder - Click to Simulate ]
                        </div>
                    )}
                </div>

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
            </Card >
        </div >
    );
};

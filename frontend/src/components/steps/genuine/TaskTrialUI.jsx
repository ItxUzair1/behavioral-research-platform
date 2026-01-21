import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Puzzle, ArrowLeftRight, Move, Check, X } from 'lucide-react';
import { api } from '../../../services/api';
import { MatchingGame } from '../../game/MatchingGame';
import { SortingGame } from '../../game/SortingGame';
import { OptOutModal } from '../../common/OptOutModal';
import { DraggingGame } from '../../game/DraggingGame';

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
        title: "Variable Ratio Schedule",
        description: "Drag the square target to the destination to earn rewards.",
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


const PURPLE_THEME = {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    icon: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700',
    accent: 'border-purple-400'
};

const ORANGE_THEME = {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    icon: 'text-orange-600',
    button: 'bg-orange-600 hover:bg-orange-700',
    accent: 'border-orange-400'
};

export const TaskTrialUI = ({ type = 'matching', variant = 'Pre-Training', phase = 'Unknown', trialNumber, totalTrials, onComplete, participantId, onOptOut, onSwitch }) => {
    const [complete, setComplete] = useState(false);
    const config = TASK_CONFIG[type];
    const Icon = config.icon;

    const [backendLog, setBackendLog] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [earnings, setEarnings] = useState(0.00);

    // Determine current theme with override logic for Dragging in Genuine/Pre-Training
    let currentTheme = config.theme;
    const isGenuineOrPre = phase?.toLowerCase().includes('genuine') || phase?.toLowerCase().includes('pre-training') || variant === 'Pre-Training';

    const isApparent = phase?.toLowerCase().includes('apparent');
    const isCoercion = phase?.toLowerCase().includes('coercion');

    if (type === 'dragging' && isGenuineOrPre) {
        // Reuse Sorting's Green Theme
        currentTheme = TASK_CONFIG.sorting.theme;
    } else if (isApparent) {
        currentTheme = PURPLE_THEME;
    } else if (isCoercion) {
        currentTheme = ORANGE_THEME;
    }

    const [optOutStartTime, setOptOutStartTime] = useState(null);

    const handleSimulateTask = async (isCorrect = true, rt = 0, selectedOption = null) => {
        if (isSubmitting) return;

        // Simulate performing the task
        setIsSubmitting(true);
        setError(null);

        try {
            if (!participantId) {
                console.warn("No participantId found, using 'GUEST' for testing");
            }

            const response = await api.logTrial({
                participantId: participantId || "GUEST",
                taskType: type,
                taskVariant: variant,
                phase: phase,
                trialNumber,
                responseTime: rt,
                correct: isCorrect,
                selectedOption: selectedOption, // Pass selected option
                eventType: "Trial"
            });
            setBackendLog(`Saved to DB (RT: ${rt}ms)`);

            if (response.earnings !== undefined) {
                setEarnings(response.earnings);
            }

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

    const [showOptOutModal, setShowOptOutModal] = useState(false);

    const handleOptOutClick = () => {
        setOptOutStartTime(Date.now()); // Start timing opt-out latency
        setShowOptOutModal(true);
    };

    const handleConfirmOptOut = async () => {
        const latency = Date.now() - optOutStartTime;

        // Log Opt-Out Event
        try {
            await api.logTrial({
                participantId: participantId || "GUEST",
                taskType: type,
                taskVariant: variant,
                phase: phase,
                trialNumber,
                responseTime: latency,
                correct: false,
                eventType: "OptOut"
            });
        } catch (e) { console.error("Failed to log opt-out", e); }

        setShowOptOutModal(false);
        if (onOptOut) onOptOut();
    };

    const handleSwitch = () => {
        setShowOptOutModal(false);
        if (onSwitch) onSwitch();
    };

    return (
        <div className="space-y-6 relative">
            <OptOutModal
                isOpen={showOptOutModal}
                onCancel={() => setShowOptOutModal(false)}
                onConfirm={handleConfirmOptOut}
                onSwitch={handleSwitch}
                phase={phase}
                taskName={config.title}
            />

            {/* Header */}
            <div className={`p-6 rounded-2xl border ${currentTheme.bg} ${currentTheme.border} flex items-start gap-4 transition-all duration-300`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm ${currentTheme.icon}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className={`text-xl font-bold ${currentTheme.text}`}>
                                    {type === 'dragging'
                                        ? (variant === 'pr' ? "Dragging the Circle" : "Dragging the Square")
                                        : config.title}
                                </h2>
                                {variant === 'Pre-Training' && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full border border-yellow-200 font-medium">
                                        Experience Only - No Money
                                    </span>
                                )}
                            </div>
                            <p className={`${currentTheme.text} opacity-80`}>{config.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {(phase === 'Genuine' || variant === 'Pre-Training') && (
                                <div className={`px-3 py-1 rounded-full bg-white/50 text-sm font-mono font-medium ${currentTheme.text}`}>
                                    Trial {trialNumber} / {totalTrials}
                                </div>
                            )}
                            {/* Opt Out Button - Logic: onOptOut prop callback */}
                            {/* Opt Out Button - Only render if onOptOut is provided */}
                            {onOptOut && (
                                <button
                                    onClick={handleOptOutClick}
                                    className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all duration-200 border-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-md cursor-pointer"
                                >
                                    Opt Out of Task
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Interaction Area */}
            <Card className={`min-h-[400px] flex items-center justify-center relative overflow-hidden border-t-4 ${currentTheme.accent}`}>
                <div className="w-full h-full p-4">
                    {type === 'matching' && (
                        <MatchingGame
                            variant={variant}
                            participantId={participantId}
                            phase={phase}
                            onTrialEnd={(correct, rt, option) => handleSimulateTask(correct, rt, option)}
                            currentTrial={trialNumber}
                            totalTrials={totalTrials}
                        />
                    )}
                    {type === 'sorting' && (
                        <SortingGame
                            variant={variant}
                            participantId={participantId}
                            phase={phase}
                            onTrialEnd={(correct, rt, option) => handleSimulateTask(correct, rt, option)}
                            currentTrial={trialNumber}
                            totalTrials={totalTrials}
                        />
                    )}
                    {type === 'dragging' && (
                        <DraggingGame
                            variant={variant}
                            participantId={participantId}
                            phase={phase}
                            onTrialEnd={(correct, rt, option) => handleSimulateTask(correct, rt, option)}
                            currentTrial={trialNumber}
                            totalTrials={totalTrials}
                        />
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

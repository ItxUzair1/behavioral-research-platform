import React, { useState } from 'react';
import { TaskTrialUI } from './TaskTrialUI';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export const PreTraining = ({ tasks = [], onComplete, participantId, onOptOut }) => {
    // tasks ex: [{ type: 'matching', label: 'Matching Equations' }, { type: 'matching', label: 'Matching Mammals' }]

    // Flatten approach: We treat each task object as a phase.
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [trial, setTrial] = useState(1);
    const TRIALS_PER_TASK = 15; // As per requirement

    const currentTask = tasks[currentTaskIndex];

    const handleNextTrial = () => {
        if (trial < TRIALS_PER_TASK) {
            setTrial(t => t + 1);
        } else {
            // Task completed
            // Log completion if needed here or rely on trials
            if (currentTaskIndex < tasks.length - 1) {
                setCurrentTaskIndex(prev => prev + 1);
                setTrial(1);
            } else {
                onComplete();
            }
        }
    };

    if (!currentTask) return null;

    return (
        <div className="space-y-4">
            <div className="text-center pb-4">
                <h2 className="text-2xl font-bold text-emerald-900">{currentTask.label}</h2>
                <p className="text-emerald-700 opacity-80">Pre-Training Phase - {currentTaskIndex + 1} of {tasks.length}</p>
            </div>

            <TaskTrialUI
                key={`${currentTask.type}-${currentTaskIndex}`} // Re-mount on task change
                type={currentTask.type}
                variant={currentTask.variantId}
                phase="Genuine Pre-Training"
                trialNumber={trial}
                totalTrials={TRIALS_PER_TASK}
                onComplete={handleNextTrial}
                participantId={participantId}
                onOptOut={onOptOut}
                onSwitch={() => {
                    if (currentTaskIndex < tasks.length - 1) {
                        setCurrentTaskIndex(prev => prev + 1);
                        setTrial(1);
                    } else {
                        // No more tasks to switch to, maybe complete? OR just ignore.
                        // User flow: "take them to the other task".
                        // If we are at the last task, maybe treat as OptOut or disabled.
                        // For now, if last task, we do nothing or could loop back?
                        // Let's safe guard:
                        alert("No other tasks to switch to.");
                    }
                }}
            />
        </div>
    );
};

import React, { useState } from 'react';
import { TaskTrialUI } from '../genuine/TaskTrialUI';
import { Card } from '../../ui/Card';

export const ApparentFlow = ({ onNext, participantId, genuineChoices }) => {
    // Steps: 
    // 0: Matching (Same as Genuine)
    // 1: Sorting (Opposite of Genuine)
    // 2: Dragging (Progressive Ratio)
    const [step, setStep] = useState(0);
    const [trial, setTrial] = useState(1);
    const TOTAL_TRIALS = 200;

    const handleStepComplete = () => {
        if (step < 2) {
            setStep(s => s + 1);
            setTrial(1); // Reset trial count for next task
        } else {
            onNext();
        }
    };

    const handleNextTrial = () => {
        if (trial < TOTAL_TRIALS) {
            setTrial(t => t + 1);
        } else {
            handleStepComplete();
        }
    };

    const handleOptOut = () => {
        if (window.confirm("Are you sure you want to opt out of this task?")) {
            handleStepComplete();
        }
    };

    // Determine tasks based on choices
    // Handle both potential structures (string ID or object with selection)
    const getChoiceId = (choice) => {
        if (!choice) return null;
        if (typeof choice === 'string') return choice;
        if (typeof choice === 'object' && choice.selection) return choice.selection;
        return null;
    };

    const matchingChoice = getChoiceId(genuineChoices?.matching) || 'equations';
    const sortingChoice = getChoiceId(genuineChoices?.sorting) || 'letters';

    // Determine opposite sorting
    const oppositeSorting = sortingChoice === 'letters' ? 'syllables' : 'letters';

    const getTaskConfig = () => {
        if (step === 0) {
            // Task 1: Matching (Same as Genuine)
            return {
                type: 'matching',
                variant: matchingChoice,
                label: 'Matching Task (Same as Selected)'
            };
        } else if (step === 1) {
            // Task 2: Sorting (Opposite of Genuine)
            return {
                type: 'sorting',
                variant: oppositeSorting,
                label: 'Sorting Task (Assigned)'
            };
        } else {
            // Task 3: Dragging PR
            return {
                type: 'dragging',
                variant: 'pr', // Progressive Ratio
                label: 'Dragging Task (Progressive Ratio)'
            };
        }
    };

    const taskConfig = getTaskConfig();

    return (
        <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 p-4 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-violet-900 mb-1">Apparent Assent Phase</h2>
                <p className="text-violet-700">Please complete the assigned tasks.</p>
            </div>

            <div className="text-center pb-2">
                <h3 className="text-lg font-semibold text-gray-700">{taskConfig.label}</h3>
                <p className="text-sm text-gray-500">Task {step + 1} of 3</p>
            </div>

            <TaskTrialUI
                key={`apparent-${step}`}
                type={taskConfig.type}
                variant={taskConfig.variant}
                phase="Apparent"
                trialNumber={trial}
                totalTrials={TOTAL_TRIALS}
                onComplete={handleNextTrial}
                participantId={participantId}
                onOptOut={handleOptOut}
            />
        </div>
    );
};

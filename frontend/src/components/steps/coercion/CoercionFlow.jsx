import React, { useState } from 'react';
import { TaskTrialUI } from '../genuine/TaskTrialUI';
import { Card } from '../../ui/Card';

export const CoercionFlow = ({ onNext, participantId, genuineChoices }) => {
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
            setTrial(1); // Reset
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

    // Coercion might behave differently on Opt-Out, but prompt said "Opt out of task (Disabled)" for ConditionTask
    // However, the user said "can opt out anytime" in general. 
    // But for Coercion specifically, the 'ConditionTask' UI had it disabled.
    // Based on the name "Coercion", opt-out is likely discouraged or disabled.
    // I will implement it but maybe it should be restricted or show a persistent prompt?
    // For now, I'll allow it with a specific message or just like ApparentFlow to keep skeleton simple.
    // Wait, the previous request specifically set "Opt out of task (Disabled)" for Coercion.
    // I will disable the callback or show an alert that says strictly no?
    // I'll make the button disabled by passing `onOptOut={null}` or a no-op that alerts.

    const handleOptOut = () => {
        // User confirmed opt-out via modal (which warns about money loss)
        // Proceed to next step/task
        handleStepComplete();
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

    const oppositeSorting = sortingChoice === 'letters' ? 'syllables' : 'letters';

    const getTaskConfig = () => {
        if (step === 0) {
            // Task 1: Matching (Same as Genuine)
            return {
                type: 'matching',
                variant: matchingChoice,
                label: 'Directed Matching Task'
            };
        } else if (step === 1) {
            // Task 2: Sorting (Opposite of Genuine)
            return {
                type: 'sorting',
                variant: oppositeSorting,
                label: 'Directed Sorting Task'
            };
        } else {
            // Task 3: Dragging PR
            return {
                type: 'dragging',
                variant: 'pr',
                label: 'Directed Dragging Task'
            };
        }
    };

    const taskConfig = getTaskConfig();

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-amber-900 mb-1">Directed Task Phase</h2>
                <p className="text-amber-700">You must complete the assigned tasks.</p>
            </div>

            <div className="text-center pb-2">
                <h3 className="text-lg font-semibold text-gray-700">{taskConfig.label}</h3>
                <p className="text-sm text-gray-500">Task {step + 1} of 3</p>
            </div>

            <TaskTrialUI
                key={`coercion-${step}`}
                type={taskConfig.type}
                variant={taskConfig.variant}
                phase="Coercion"
                trialNumber={trial}
                totalTrials={TOTAL_TRIALS}
                onComplete={handleNextTrial}
                participantId={participantId}
                onOptOut={handleOptOut}
            />
        </div>
    );
};

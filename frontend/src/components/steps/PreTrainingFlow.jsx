import React, { useState } from 'react';
import { TaskTrialUI } from './genuine/TaskTrialUI';
import { InstructionSlide } from '../common/InstructionSlide';
import { OptOutTraining } from './OptOutTraining';
import { ChoiceSelection } from './genuine/ChoiceSelection';

// Wrapper to handle trial counting for "task" steps
const StatefulTaskTrialUI = ({ totalTrials, onComplete, ...props }) => {
    const [trial, setTrial] = useState(1);

    const handleComplete = () => {
        if (trial < totalTrials) {
            setTrial(t => t + 1);
        } else {
            onComplete();
        }
    };

    return (
        <TaskTrialUI
            {...props}
            trialNumber={trial}
            totalTrials={totalTrials}
            onComplete={handleComplete}
        />
    );
};

export const PreTrainingFlow = ({ onNext, participantId }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [preTrainingChoices, setPreTrainingChoices] = useState({});

    // Configuration for Choices
    const MATCHING_OPTIONS = [
        { id: 'equations', title: 'Matching Equations', description: 'Match math equations to their answers.' },
        { id: 'mammals', title: 'Matching Mammals', description: 'Match mammal names to their pictures.' }
    ];

    const SORTING_OPTIONS = [
        { id: 'letters', title: 'Sorting Letters', description: 'Sort letters into Vowels vs Consonants.' },
        { id: 'syllables', title: 'Sorting Syllables', description: 'Sort words by syllable count.' }
    ];

    const DRAGGING_OPTIONS = [
        { id: 'vr', title: 'Dragging the Square', description: 'Variable Ratio dragging task.' },
        { id: 'pr', title: 'Dragging the Circle', description: 'Progressive Ratio dragging task.' }
    ];

    const STEPS = [
        // 1. Matching
        {
            type: 'instruction',
            message: "You are now going to complete pre-training for the Matching Task."
        },
        {
            type: 'task',
            taskType: 'matching',
            variant: 'equations',
            label: 'Matching Equations (Practice)',
            trials: 10
        },
        {
            type: 'task',
            taskType: 'matching',
            variant: 'mammals',
            label: 'Matching Mammals (Practice)',
            trials: 10
        },

        // 1.5 Matching Choice
        {
            type: 'choice',
            options: MATCHING_OPTIONS,
            choiceStep: 'matching',
            label: 'Matching Choice'
        },

        // 2. Sorting
        {
            type: 'instruction',
            message: "You are now going to complete pre-training for the Sorting Task."
        },
        {
            type: 'task',
            taskType: 'sorting',
            variant: 'letters',
            label: 'Sorting Letters (Practice)',
            trials: 10
        },
        {
            type: 'task',
            taskType: 'sorting',
            variant: 'syllables',
            label: 'Sorting Syllables (Practice)',
            trials: 10
        },
        // 2.5 Sorting Choice
        {
            type: 'choice',
            options: SORTING_OPTIONS,
            choiceStep: 'sorting',
            label: 'Sorting Choice'
        },

        // 3. Dragging
        {
            type: 'instruction',
            message: "You are now going to complete pre-training for the Dragging Task."
        },
        {
            type: 'task',
            taskType: 'dragging',
            variant: 'vr',
            label: 'Dragging (Variable Ratio Practice)',
            trials: 10
        },
        {
            type: 'task',
            taskType: 'dragging',
            variant: 'pr',
            label: 'Dragging (Progressive Ratio Practice)',
            trials: 10
        },
        // 3.5 Dragging Choice
        {
            type: 'choice',
            options: DRAGGING_OPTIONS,
            choiceStep: 'dragging',
            label: 'Dragging Choice'
        },

        // 4. Opt-Out Green
        {
            type: 'instruction',
            message: "You will now practice the Opt-Out procedure for the Green Condition."
        },
        {
            type: 'optout',
            color: 'green',
            name: 'Green Condition'
        },
        // 5. Opt-Out Purple
        {
            type: 'instruction',
            message: "You will now practice the Opt-Out procedure for the Purple Condition."
        },
        {
            type: 'optout',
            color: 'purple',
            name: 'Purple Condition'
        },
        // 6. Opt-Out Orange
        {
            type: 'instruction',
            message: "You will now practice the Opt-Out procedure for the Orange Condition."
        },
        {
            type: 'optout',
            color: 'orange',
            name: 'Orange Condition'
        },

        // 7. Finish
        {
            type: 'instruction',
            message: "Pre-training complete. You are now ready to begin the study."
        }
    ];

    const currentStep = STEPS[stepIndex];

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            // onNext(participantId, condition, choices) 
            // We pass the choices made during pre-training. 
            // NOTE: App.jsx treats these as "genuineChoices". 
            // If the user wants these to overlap, this works perfectly. 
            onNext(null, null, preTrainingChoices);
        }
    };

    const handleChoice = (choiceData) => {
        // choiceData might be string ID or object { selection: '...', ... } depending on ChoiceSelection implementation
        // ChoiceSelection passes `selectedTask` (string ID) to onConfirm callback 
        // BUT it also calls API with full payload.
        // We will store just the ID in local state for now, matching the `GenuineFlow` expectation
        // which expects simple ID or object.
        // Let's store what we get.

        const key = currentStep.choiceStep; // 'matching', 'sorting', 'dragging'
        setPreTrainingChoices(prev => ({
            ...prev,
            [key]: choiceData
        }));

        handleNext();
    };

    if (!currentStep) return null;

    if (currentStep.type === 'instruction') {
        return (
            <InstructionSlide
                message={currentStep.message}
                onNext={handleNext}
                bgColor="bg-gray-100"
            />
        );
    }

    if (currentStep.type === 'task') {
        return (
            <div className="space-y-4">
                <div className="bg-gray-100 border border-gray-300 p-4 rounded-xl mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Pre-Training</h2>
                    <p className="text-gray-600">Practice Mode</p>
                </div>

                <div className="text-center pb-2">
                    <h3 className="text-lg font-semibold text-gray-700">{currentStep.label}</h3>
                </div>

                <StatefulTaskTrialUI
                    key={`pt-${stepIndex}`}
                    type={currentStep.taskType}
                    variant={currentStep.variant}
                    phase="Pre-Training"
                    totalTrials={currentStep.trials}
                    onComplete={handleNext}
                    participantId={participantId}
                />
            </div>
        );
    }

    if (currentStep.type === 'choice') {
        return (
            <div className="space-y-4">
                <div className="bg-gray-100 border border-gray-300 p-4 rounded-xl mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Pre-Training Choice</h2>
                    <p className="text-gray-600">Select which task you prefer</p>
                </div>

                <ChoiceSelection
                    options={currentStep.options}
                    choiceStep={`pretraining_${currentStep.choiceStep}`} // Distinct prefix for API logging if needed
                    onConfirm={handleChoice}
                    participantId={participantId}
                />
            </div>
        );
    }

    if (currentStep.type === 'optout') {
        return (
            <OptOutTraining
                conditionColor={currentStep.color}
                conditionName={currentStep.name}
                onComplete={handleNext}
            />
        );
    }

    return <div>Unknown Step</div>;
};

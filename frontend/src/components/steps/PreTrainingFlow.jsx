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


    // Configuration for Choices


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
            trials: 15
        },
        {
            type: 'task',
            taskType: 'matching',
            variant: 'mammals',
            label: 'Matching Mammals (Practice)',
            trials: 15
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
            trials: 15
        },
        {
            type: 'task',
            taskType: 'sorting',
            variant: 'syllables',
            label: 'Sorting Syllables (Practice)',
            trials: 15
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
            trials: 15
        },
        {
            type: 'task',
            taskType: 'dragging',
            variant: 'pr',
            label: 'Dragging (Progressive Ratio Practice)',
            trials: 15
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
            onNext(null, null, null);
        }
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

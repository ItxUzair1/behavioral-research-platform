import React, { useState } from 'react';
import { TaskTrialUI } from '../genuine/TaskTrialUI';
import { Card } from '../../ui/Card';
import { MiniSurvey } from '../../common/MiniSurvey';
import { InstructionSlide } from '../../common/InstructionSlide';

export const CoercionFlow = ({ onNext, participantId, genuineChoices, daysCompleted }) => {
    // 0: Condition Intro "Orange"
    // 1: Instruction "Matching"
    // 2: Matching
    // 3: Instruction "Sorting"
    // 4: Sorting
    // 5: Instruction "Dragging"
    // 6: Dragging
    // 7: Survey

    const [step, setStep] = useState(0);
    const [trial, setTrial] = useState(1);

    const handleStepComplete = () => {
        // If Day 1, skip step 7 (Survey)
        const maxStep = (!daysCompleted || daysCompleted === 0) ? 6 : 7;

        if (step < maxStep) {
            setStep(s => s + 1);
            setTrial(1);
        } else {
            onNext();
        }
    };

    const handleNextTrial = () => {
        const currentTotal = taskConfig.type === 'dragging' ? 200 : 100;
        if (trial < currentTotal) {
            setTrial(t => t + 1);
        } else {
            handleStepComplete();
        }
    };

    const handleOptOut = () => {
        handleStepComplete();
    };

    // Choices
    const getChoiceId = (choice) => {
        if (!choice) return null;
        if (typeof choice === 'string') return choice;
        if (typeof choice === 'object' && choice.selection) return choice.selection;
        return null;
    };
    const matchingChoice = getChoiceId(genuineChoices?.matching) || 'equations';
    const sortingChoice = getChoiceId(genuineChoices?.sorting) || 'letters';
    const oppositeSorting = sortingChoice === 'letters' ? 'syllables' : 'letters';

    const taskConfig = (() => {
        if (step === 2) return { type: 'matching', variant: matchingChoice, label: 'Matching Task' };
        if (step === 4) return { type: 'sorting', variant: oppositeSorting, label: 'Sorting Task' };
        if (step === 6) return { type: 'dragging', variant: 'pr', label: 'Dragging Task' };
        return {};
    })();

    if (step === 0) return <InstructionSlide message="You are now going to complete the Orange Condition." onNext={handleStepComplete} />;
    if (step === 1) return <InstructionSlide message="You are now going to complete a Matching Task." onNext={handleStepComplete} />;
    if (step === 3) return <InstructionSlide message="You are now going to complete a Sorting Task." onNext={handleStepComplete} />;
    if (step === 5) return <InstructionSlide message="You are now going to complete a Dragging Task." onNext={handleStepComplete} />;

    if (step === 7) {
        return <MiniSurvey phase="Coercion" participantId={participantId} onComplete={handleStepComplete} />;
    }

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-amber-900 mb-1">Condition 3</h2>
                <p className="text-amber-700">You must complete the assigned tasks.</p>
            </div>

            <div className="text-center pb-2">
                <h3 className="text-lg font-semibold text-gray-700">{taskConfig.label}</h3>
            </div>

            <TaskTrialUI
                key={`coercion-${step}`}
                type={taskConfig.type}
                variant={taskConfig.variant}
                phase="Coercion"
                trialNumber={trial}
                totalTrials={taskConfig.type === 'dragging' ? 200 : 100}
                onComplete={handleNextTrial}
                participantId={participantId}
                onOptOut={handleOptOut}
            />
        </div>
    );
};

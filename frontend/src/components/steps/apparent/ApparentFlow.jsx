import React, { useState } from 'react';
import { TaskTrialUI } from '../genuine/TaskTrialUI';
import { Card } from '../../ui/Card';
import { MiniSurvey } from '../../common/MiniSurvey';
import { InstructionSlide } from '../../common/InstructionSlide';

export const ApparentFlow = ({ onNext, participantId, genuineChoices }) => {
    // 0: Condition Intro "Purple"
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
        if (step < 7) {
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

    if (step === 0) return <InstructionSlide message="You are now going to complete the Purple Condition." onNext={handleStepComplete} />;
    if (step === 1) return <InstructionSlide message="You are now going to complete a Matching Task." onNext={handleStepComplete} />;
    if (step === 3) return <InstructionSlide message="You are now going to complete a Sorting Task." onNext={handleStepComplete} />;
    if (step === 5) return <InstructionSlide message="You are now going to complete a Dragging Task." onNext={handleStepComplete} />;

    if (step === 7) {
        return <MiniSurvey phase="Apparent" participantId={participantId} onComplete={handleStepComplete} />;
    }

    // Task Render
    return (
        <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 p-4 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-violet-900 mb-1">Condition 2</h2>
                <p className="text-violet-700">Please complete the assigned tasks.</p>
            </div>

            <div className="text-center pb-2">
                <h3 className="text-lg font-semibold text-gray-700">{taskConfig.label}</h3>
            </div>

            <TaskTrialUI
                key={`apparent-${step}`}
                type={taskConfig.type}
                variant={taskConfig.variant}
                phase="Apparent"
                trialNumber={trial}
                totalTrials={taskConfig.type === 'dragging' ? 200 : 100}
                onComplete={handleNextTrial}
                participantId={participantId}
                onOptOut={handleOptOut}
            />
        </div>
    );
};

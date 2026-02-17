import React, { useState } from 'react';
import { ChoiceSelection } from './ChoiceSelection';
import { TaskTrialUI } from './TaskTrialUI';
import { MiniSurvey } from '../../common/MiniSurvey';
import { InstructionSlide } from '../../common/InstructionSlide';

export const GenuineFlow = ({ onNext, participantId, genuineChoices, daysCompleted }) => {
    // Every day: instruction → choice → execution for each task (matching, sorting, dragging)
    // Choices are always made fresh, even on Day 2+
    const [phase, setPhase] = useState('instr_matching');

    const [choices, setChoices] = useState({ matching: null, sorting: null, dragging: null });

    // State to track current execution task
    const [executionType, setExecutionType] = useState('matching');

    // Helper to get variant from choices
    const getVariant = (type) => {
        const choice = choices[type];
        if (!choice) return null; // Should not happen if pre-trained
        return typeof choice === 'object' ? choice.selection : choice;
    };

    const handlePhaseComplete = (choiceData) => {
        if (phase === 'instr_matching') {
            setPhase('matching_choice');
        } else if (phase === 'matching_choice') {
            setChoices(prev => ({ ...prev, matching: choiceData }));
            setExecutionType('matching');
            setPhase('execution_matching');
        } else if (phase === 'execution_matching') {
            setPhase('instr_sorting');
        } else if (phase === 'instr_sorting') {
            setPhase('sorting_choice');
        } else if (phase === 'sorting_choice') {
            setChoices(prev => ({ ...prev, sorting: choiceData }));
            setExecutionType('sorting');
            setPhase('execution_sorting');
        } else if (phase === 'execution_sorting') {
            setPhase('instr_dragging');
        } else if (phase === 'instr_dragging') {
            setPhase('dragging_choice');
        } else if (phase === 'dragging_choice') {
            setChoices(prev => ({ ...prev, dragging: choiceData }));
            setExecutionType('dragging');
            setPhase('execution_dragging');
        } else if (phase === 'execution_dragging') {
            if (!daysCompleted || daysCompleted === 0) {
                onNext(null, null, choices);
            } else {
                setPhase('survey');
            }

        } else if (phase === 'survey') {
            onNext(null, null, choices);
        }
    };

    const handleOptOut = () => {
        if (phase === 'execution_matching') {
            setPhase('instr_sorting');
        } else if (phase === 'execution_sorting') {
            setPhase('instr_dragging');
        } else if (phase === 'execution_dragging') {
            console.log("GenuineFlow OptOut daysCompleted:", daysCompleted);
            if (!daysCompleted || daysCompleted === 0) {
                onNext(null, null, choices);
            } else {
                setPhase('survey');
            }
        } else {
            // Fallback
            if (window.confirm("Are you sure you want to opt out?")) {
                handlePhaseComplete();
            }
        }
    };

    // --- Configurations ---
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

    // --- Render ---
    if (phase === 'instr_matching') {
        return <InstructionSlide
            message="You are now going to complete a Matching Task."
            onNext={() => handlePhaseComplete()}
        />;
    }

    if (phase === 'matching_choice') {
        return <ChoiceSelection
            options={MATCHING_OPTIONS}
            choiceStep="matching_choice"
            onConfirm={handlePhaseComplete}
            participantId={participantId}
        />;
    }

    // Execution Phases
    if (phase === 'execution_matching') {
        return <ExecutionPhase
            key="execution_matching"
            type="matching"
            initialVariant={getVariant('matching') || 'equations'}
            onComplete={handlePhaseComplete}
            participantId={participantId}
            onEndTask={handleOptOut}
        />;
    }

    if (phase === 'execution_sorting') {
        return <ExecutionPhase
            key="execution_sorting"
            type="sorting"
            initialVariant={getVariant('sorting') || 'letters'}
            onComplete={handlePhaseComplete}
            participantId={participantId}
            onEndTask={handleOptOut}
        />;
    }

    if (phase === 'execution_dragging') {
        return <ExecutionPhase
            key="execution_dragging"
            type="dragging"
            initialVariant={getVariant('dragging') || 'vr'}
            onComplete={handlePhaseComplete}
            participantId={participantId}
            onEndTask={handleOptOut}
        />;
    }

    if (phase === 'instr_sorting') {
        return <InstructionSlide
            message="You are now going to complete a Sorting Task."
            onNext={() => handlePhaseComplete()}
        />;
    }

    if (phase === 'sorting_choice') {
        return <ChoiceSelection
            options={SORTING_OPTIONS}
            choiceStep="sorting_choice"
            onConfirm={handlePhaseComplete}
            participantId={participantId}
        />;
    }

    if (phase === 'instr_dragging') {
        return <InstructionSlide
            message="You are now going to complete a Dragging Task."
            onNext={() => handlePhaseComplete()}
        />;
    }

    if (phase === 'dragging_choice') {
        return <ChoiceSelection
            options={DRAGGING_OPTIONS}
            choiceStep="dragging_choice"
            onConfirm={handlePhaseComplete}
            participantId={participantId}
        />;
    }

    if (phase === 'survey') {
        return <MiniSurvey
            phase="Genuine"
            participantId={participantId}
            onComplete={handlePhaseComplete}
        />;
    }

    return null;
};

// Internal sub-component for Execution Phase state management
const ExecutionPhase = ({ type, initialVariant, onComplete, participantId, onEndTask }) => {
    const [trial, setTrial] = useState(1);
    const [variant, setVariant] = useState(initialVariant);

    const TOTAL_TRIALS = type === 'dragging' ? 200 : 100;

    const handleNextTrial = () => {
        if (trial < TOTAL_TRIALS) {
            setTrial(t => t + 1);
        } else {
            onComplete();
        }
    };

    const handleSwitch = () => {
        if (type === 'matching') {
            setVariant(prev => prev === 'equations' ? 'mammals' : 'equations');
        } else if (type === 'sorting') {
            setVariant(prev => prev === 'letters' ? 'syllables' : 'letters');
        } else if (type === 'dragging') {
            setVariant(prev => prev === 'vr' ? 'pr' : 'vr');
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-green-900 mb-1">Condition 1</h2>
                <p className="text-green-700">Please complete the assigned tasks.</p>
            </div>

            <div className="text-center pb-2">
                <h2 className="text-2xl font-bold text-emerald-900">Task Execution Phase</h2>
                <p className="text-emerald-700 opacity-80">Accumulate earnings by completing tasks.</p>
            </div>

            <TaskTrialUI
                key={`${type}-${variant}`}
                type={type}
                variant={variant}
                phase="Genuine Execution"
                trialNumber={trial}
                totalTrials={TOTAL_TRIALS}
                onComplete={handleNextTrial}
                participantId={participantId}
                onOptOut={onEndTask}
                onSwitch={handleSwitch}
            />
        </div>
    );
};

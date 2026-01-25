import React, { useState } from 'react';
import { PreTraining } from './PreTraining';
import { ChoiceSelection } from './ChoiceSelection';
import { TaskTrialUI } from './TaskTrialUI';
import { MiniSurvey } from '../../common/MiniSurvey';

export const GenuineFlow = ({ onNext, participantId }) => {
    // Phases: matching_pt -> matching_choice -> execution -> sorting_pt -> sorting_choice -> dragging_pt -> dragging_choice -> execution(dragging) -> survey -> next
    const [phase, setPhase] = useState('matching_pt');
    const [choices, setChoices] = useState({ matching: null, sorting: null, dragging: null });
    const [executionTask, setExecutionTask] = useState(null);
    const [executionType, setExecutionType] = useState('matching');

    const handlePhaseComplete = (choiceData) => {
        if (phase === 'matching_pt') {
            setPhase('matching_choice');
        } else if (phase === 'matching_choice') {
            setChoices(prev => ({ ...prev, matching: choiceData }));
            const selectedVariant = typeof choiceData === 'object' ? choiceData.selection : choiceData;
            setExecutionTask(selectedVariant || 'equations');
            setExecutionType('matching');
            setPhase('execution');
        } else if (phase === 'execution') {
            if (executionType === 'matching') {
                setPhase('sorting_pt');
            } else if (executionType === 'sorting') {
                setPhase('dragging_pt');
            } else if (executionType === 'dragging') {
                setPhase('survey'); // Go to Survey
            }
        } else if (phase === 'sorting_pt') {
            setPhase('sorting_choice');
        } else if (phase === 'sorting_choice') {
            setChoices(prev => ({ ...prev, sorting: choiceData }));
            const selectedVariant = typeof choiceData === 'object' ? choiceData.selection : choiceData;
            setExecutionTask(selectedVariant || 'letters');
            setExecutionType('sorting');
            setPhase('execution');
        } else if (phase === 'dragging_pt') {
            setPhase('dragging_choice');
        } else if (phase === 'dragging_choice') {
            setChoices(prev => ({ ...prev, dragging: choiceData }));
            const selectedVariant = typeof choiceData === 'object' ? choiceData.selection : choiceData;
            setExecutionTask(selectedVariant || 'vr');
            setExecutionType('dragging');
            setPhase('execution');
        } else if (phase === 'survey') {
            onNext(null, null, choices);
        }
    };

    const handleOptOut = () => {
        if (phase === 'execution') {
            if (executionType === 'matching') {
                setPhase('sorting_pt');
            } else if (executionType === 'sorting') {
                setPhase('dragging_pt');
            } else if (executionType === 'dragging') {
                setPhase('survey'); // Go to Survey on Opt Out too?? 
                // Requirement: "mini survey after completion of each condition". 
                // Opting out of a task effectively ends that task. 
                // If they opt out of dragging (last task), they finish the condition. So yes, Survey.
            }
        } else {
            if (window.confirm("Are you sure you want to opt out of this task?")) {
                handlePhaseComplete();
            }
        }
    };

    // --- Configurations ---
    const MATCHING_TASKS = [
        { type: 'matching', label: 'Matching Equations', variantId: 'equations' },
        { type: 'matching', label: 'Matching Mammals', variantId: 'mammals' }
    ];
    const MATCHING_OPTIONS = [
        { id: 'equations', title: 'Matching Equations', description: 'Match math equations to their answers.' },
        { id: 'mammals', title: 'Matching Mammals', description: 'Match mammal names to their pictures.' }
    ];

    const SORTING_TASKS = [
        { type: 'sorting', label: 'Sorting Letters', variantId: 'letters' },
        { type: 'sorting', label: 'Sorting Syllables', variantId: 'syllables' }
    ];
    const SORTING_OPTIONS = [
        { id: 'letters', title: 'Sorting Letters', description: 'Sort letters into Vowels vs Consonants.' },
        { id: 'syllables', title: 'Sorting Syllables', description: 'Sort words by syllable count.' }
    ];

    const DRAGGING_TASKS = [
        { type: 'dragging', label: 'Dragging the Square', variantId: 'vr' },
        { type: 'dragging', label: 'Dragging the Circle', variantId: 'pr' }
    ];
    const DRAGGING_OPTIONS = [
        { id: 'vr', title: 'Dragging the Square', description: 'Variable Ratio dragging task.' },
        { id: 'pr', title: 'Dragging the Circle', description: 'Progressive Ratio dragging task.' }
    ];

    // --- Render ---
    if (phase === 'matching_pt') {
        return <PreTraining
            tasks={MATCHING_TASKS}
            onComplete={handlePhaseComplete}
            participantId={participantId}
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

    if (phase === 'execution') {
        return <ExecutionPhase
            type={executionType}
            initialVariant={executionTask}
            onComplete={handlePhaseComplete}
            participantId={participantId}
            onEndTask={handleOptOut}
        />;
    }

    if (phase === 'sorting_pt') {
        return <PreTraining
            tasks={SORTING_TASKS}
            onComplete={handlePhaseComplete}
            participantId={participantId}
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

    if (phase === 'dragging_pt') {
        return <PreTraining
            tasks={DRAGGING_TASKS}
            onComplete={handlePhaseComplete}
            participantId={participantId}
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

    // Dynamic Trial Counts: 100 for Matching/Sorting, 200 for Dragging
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
        // Do NOT reset trial count
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

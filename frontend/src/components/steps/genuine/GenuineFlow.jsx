import React, { useState } from 'react';
import { PreTraining } from './PreTraining';
import { ChoiceSelection } from './ChoiceSelection';
import { ConditionTask } from '../ConditionTask'; // Re-use potentially or use new Execution UI

export const GenuineFlow = ({ onNext, participantId }) => {
    // Phases: matching_pt -> matching_choice -> sorting_pt -> sorting_choice -> dragging_pt -> next
    const [phase, setPhase] = useState('matching_pt');
    const [choices, setChoices] = useState({ matching: null, sorting: null });

    const handlePhaseComplete = (choiceData) => {
        if (phase === 'matching_pt') {
            setPhase('matching_choice');
        } else if (phase === 'matching_choice') {
            setChoices(prev => ({ ...prev, matching: choiceData }));
            setPhase('sorting_pt');
        } else if (phase === 'sorting_pt') {
            setPhase('sorting_choice');
        } else if (phase === 'sorting_choice') {
            setChoices(prev => ({ ...prev, sorting: choiceData }));
            setPhase('dragging_pt');
        } else if (phase === 'dragging_pt') {
            // Pass the accumulated choices to the parent
            onNext(null, null, choices);
        }
    };

    const handleOptOut = () => {
        if (window.confirm("Are you sure you want to opt out of this task?")) {
            // For now, opting out just moves to next phase/task for simple simulation, 
            // or we could skip the rest of this block. 
            // Requirement says "Can opt out anytime".
            // We'll treat it as completing the current block interaction.
            handlePhaseComplete();
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
        { type: 'dragging', label: 'Dragging VR', variantId: 'vr' },
        { type: 'dragging', label: 'Dragging PR', variantId: 'pr' }
    ];

    // --- Render ---
    if (phase === 'matching_pt') {
        return <PreTraining
            tasks={MATCHING_TASKS}
            onComplete={handlePhaseComplete}
            participantId={participantId}
            onOptOut={handleOptOut}
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

    if (phase === 'sorting_pt') {
        return <PreTraining
            tasks={SORTING_TASKS}
            onComplete={handlePhaseComplete}
            participantId={participantId}
            onOptOut={handleOptOut}
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
            onOptOut={handleOptOut}
        />;
    }

    return null;
};

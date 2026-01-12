import React, { useState } from 'react';
import { PreTraining } from './PreTraining';
import { ChoiceSelection } from './ChoiceSelection';
import { ConditionTask } from '../ConditionTask'; // Re-use potentially or use new Execution UI

export const GenuineFlow = ({ onNext, participantId }) => {
    const [phase, setPhase] = useState('pre-training'); // pre-training -> choice -> execution
    const [chosenTask, setChosenTask] = useState(null);

    const handlePreTrainingComplete = () => {
        setPhase('choice');
    };

    const handleChoiceConfirm = (task) => {
        setChosenTask(task);
        setPhase('execution');
    };

    if (phase === 'pre-training') {
        return <PreTraining onComplete={handlePreTrainingComplete} participantId={participantId} />;
    }

    if (phase === 'choice') {
        return <ChoiceSelection onConfirm={handleChoiceConfirm} participantId={participantId} />;
    }

    if (phase === 'execution') {
        // For now, we reuse the existing ConditionTask UI but with a specific note or prop 
        // indicating it's the chosen task phase.
        return (
            <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-sm flex justify-between items-center">
                    <span className="font-semibold">Selected: {chosenTask === 'task-a' ? 'Task Bundle A' : 'Task Bundle B'}</span>
                    <span className="opacity-75">Genuine Choice Active</span>
                </div>
                <ConditionTask variant="genuine" onNext={onNext} />
            </div>
        );
    }

    return null;
};

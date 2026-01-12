import React, { useState } from 'react';
import { TaskTrialUI } from './TaskTrialUI';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export const PreTraining = ({ onComplete, participantId }) => {
    const [phase, setPhase] = useState('intro'); // intro -> matching -> sorting -> dragging -> complete
    const [trial, setTrial] = useState(1);
    const TRIALS_PER_TASK = 5;

    const handleNextTrial = () => {
        if (trial < TRIALS_PER_TASK) {
            setTrial(t => t + 1);
        } else {
            // Move to next phase
            setTrial(1);
            if (phase === 'matching') setPhase('sorting');
            else if (phase === 'sorting') setPhase('dragging');
            else if (phase === 'dragging') onComplete();
        }
    };

    if (phase === 'intro') {
        return (
            <div className="space-y-6 text-center max-w-2xl mx-auto pt-10">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Task Pre-Training</h1>
                <p className="text-lg text-gray-600">
                    Before making your choice, you will complete a series of practice trials
                    to familiarize yourself with the 3 available tasks.
                </p>

                <div className="grid md:grid-cols-3 gap-4 text-left my-8">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="font-bold text-blue-900 mb-1">Matching</div>
                        <p className="text-sm text-blue-700 opacity-80">5 Trials</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="font-bold text-green-900 mb-1">Sorting</div>
                        <p className="text-sm text-green-700 opacity-80">5 Trials</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="font-bold text-orange-900 mb-1">Dragging</div>
                        <p className="text-sm text-orange-700 opacity-80">5 Trials</p>
                    </div>
                </div>

                <Button onClick={() => setPhase('matching')} className="w-48 mx-auto">
                    Start Pre-Training
                </Button>
            </div>
        );
    }

    return (
        <TaskTrialUI
            key={phase} // Reset state on phase change
            type={phase}
            trialNumber={trial}
            totalTrials={TRIALS_PER_TASK}
            onComplete={handleNextTrial}
            participantId={participantId}
        />
    );
};

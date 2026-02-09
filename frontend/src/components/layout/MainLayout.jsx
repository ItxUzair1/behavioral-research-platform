import React from 'react';
import { Check } from 'lucide-react';

const steps = [
    { id: 1, label: 'Consent' },
    { id: 2, label: 'Demographics' },
    { id: 3, label: 'Pre-Training' },
    { id: 4, label: 'Condition 1' },
    { id: 5, label: 'Condition 2' },
    { id: 6, label: 'Condition 3' },
    { id: 7, label: 'Survey' },
    { id: 8, label: 'Payout' },
];

export const MainLayout = ({ currentStep, children, participantId, condition }) => {
    const getStepColor = (stepId) => {
        if (stepId === 4) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (stepId === 5) return 'text-violet-600 bg-violet-50 border-violet-200';
        if (stepId === 6) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-gray-900 bg-gray-50 border-gray-200';
    };

    const getProgressColor = (stepId, isActive) => {
        if (!isActive) return 'bg-gray-200 text-gray-400';
        // Special condition colors for active steps
        if (stepId === 4) return 'bg-emerald-600 text-white shadow-emerald-200';
        if (stepId === 5) return 'bg-violet-600 text-white shadow-violet-200';
        if (stepId === 6) return 'bg-amber-600 text-white shadow-amber-200';
        return 'bg-gray-900 text-white shadow-gray-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <span className="font-semibold tracking-tight">Behavioral Research Lab</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        {participantId && (
                            <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-500 font-mono text-xs">
                                PID: <span className="text-gray-900 font-semibold">{participantId}</span>
                            </div>
                        )}

                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-white border-b border-gray-100 py-6 px-6 shadow-sm">
                <div className="max-w-5xl mx-auto">
                    <div className="relative">
                        {/* Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 rounded-full" />
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-gray-900 -translate-y-1/2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        {/* Steps */}
                        <div className="relative flex justify-between">
                            {steps.map((step) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;

                                return (
                                    <div key={step.id} className="flex flex-col items-center group">
                                        <div
                                            className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                          border-2 transition-all duration-300 relative z-10
                          ${isActive || isCompleted
                                                    ? getProgressColor(step.id, true) + ' border-transparent shadow-lg scale-110'
                                                    : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'
                                                }
                        `}
                                        >
                                            {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                                        </div>
                                        <span
                                            className={`
                          absolute top-10 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-all duration-300
                          ${isActive ? 'text-gray-900 translate-y-0 opacity-100' : 'text-gray-400 -translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0'}
                        `}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 px-6 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-gray-400 text-sm">
                &copy; 2024 Behavioral Research Platform. All rights reserved.
            </footer>
        </div>
    );
};

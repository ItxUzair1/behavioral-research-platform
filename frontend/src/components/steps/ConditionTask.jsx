import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Clock, DollarSign, BrainCircuit, AlertCircle } from 'lucide-react';

const TASKS = {
    genuine: {
        title: "Genuine Assent Task",
        description: "In this task, you are free to choose your preferred strategy.",
        theme: "emerald",
        icon: BrainCircuit
    },
    apparent: {
        title: "Apparent Assent Task",
        description: "Please follow the instructions carefully. Your choice may appear constrained.",
        theme: "violet",
        icon: AlertCircle
    },
    coercion: {
        title: "Directed Task",
        description: "You must select the specific option indicated below to proceed.",
        theme: "amber",
        icon: AlertCircle
    }
};

export const ConditionTask = ({ variant = 'genuine', onNext }) => {
    const [loading, setLoading] = useState(true);
    const task = TASKS[variant];

    // Simulate data loading
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, [variant]);

    const getThemeStyles = () => {
        if (variant === 'genuine') return {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-900',
            icon: 'text-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-700'
        };
        if (variant === 'apparent') return {
            bg: 'bg-violet-50',
            border: 'border-violet-200',
            text: 'text-violet-900',
            icon: 'text-violet-600',
            button: 'bg-violet-600 hover:bg-violet-700'
        };
        if (variant === 'coercion') return {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-900',
            icon: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700'
        };
        return {};
    };

    const styles = getThemeStyles();
    const Icon = task.icon;

    if (loading) {
        return (
            <Card className="h-96 flex flex-col items-center justify-center animate-pulse">
                <div className={`w-12 h-12 rounded-full mb-4 bg-gray-200`} />
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${styles.bg} ${styles.border} flex items-start gap-4 transition-all duration-500`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm ${styles.icon}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className={`text-xl font-bold ${styles.text} mb-1`}>{task.title}</h2>
                    <p className={`${styles.text} opacity-80`}>{task.description}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Task Area */}
                <Card className="md:col-span-2 min-h-[400px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-gray-100 rounded-bl-xl text-xs font-mono text-gray-500 border-b border-l border-gray-200">
                        Dynamic Content Area
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
                            <span className="text-gray-400 font-bold text-xl">?</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Task Content Loading...</h3>
                        <p className="text-gray-500 max-w-sm">
                            Actual experimental task content (puzzles, choices, or allocation games)
                            will be injected here from the backend API.
                        </p>
                    </div>

                    <div className="bg-gray-50 -mx-8 -mb-8 p-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Time logged automatically</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Current Earnings:</span>
                            <span className="font-bold text-gray-900 flex items-center">
                                <DollarSign className="w-3 h-3" />
                                {variant === 'genuine' ? '2.50' : '5.00'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Controls */}
                <div className="space-y-4">
                    <Card className="h-full flex flex-col justify-between">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Action Panel</h3>
                            <p className="text-sm text-gray-500">
                                Please make your selection to continue.
                            </p>

                            <div className="space-y-2">
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${styles.button} w-2/3 opacity-50`} />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Progress</span>
                                    <span>Step 1/1</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-8">
                            <button
                                onClick={() => onNext()}
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-md transition-all active:scale-95 ${styles.button}`}
                            >
                                Submit & Next
                            </button>

                            <button
                                disabled={variant === 'coercion'}
                                className="w-full py-3 px-4 rounded-xl font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {variant === 'coercion' ? 'Opt out of task (Disabled)' : 'Opt out of task'}
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';

export const OptOutTraining = ({ conditionColor, conditionName, onComplete }) => {
    const [showModal, setShowModal] = useState(false);
    // Steps:
    // 0: Initial (Intro)
    // 1: After Return (Prompt to Switch if Green, or Opt Out if others)
    // 2: After Switch (Prompt to Opt Out) - Green Only
    const [step, setStep] = useState(0);

    const isGenuine = conditionColor === 'green';

    // Backgrounds & Themes
    const themes = {
        green: {
            textColor: 'text-green-900',
            headerBg: 'bg-green-50',
            headerBorder: 'border-green-200',
            headerText: 'text-green-900',
            iconText: 'text-green-600',
            taskBorder: 'border-green-400',
            taskBg: 'bg-green-100/50', // Light filled background
            modalAccent: 'bg-green-50 border-green-500 text-green-900',
            modalIcon: '✅'
        },
        purple: {
            textColor: 'text-indigo-900',
            headerBg: 'bg-indigo-50',
            headerBorder: 'border-indigo-200',
            headerText: 'text-indigo-900',
            iconText: 'text-indigo-600',
            taskBorder: 'border-indigo-400',
            taskBg: 'bg-indigo-100/50',
            modalAccent: 'bg-indigo-50 border-indigo-500 text-indigo-900', // Adjusted to indigo for consistency
            modalIcon: '✅' // Genuine-like?
        },
        orange: {
            textColor: 'text-orange-900',
            headerBg: 'bg-orange-50',
            headerBorder: 'border-orange-200',
            headerText: 'text-orange-900',
            iconText: 'text-orange-600',
            taskBorder: 'border-orange-400',
            taskBg: 'bg-orange-100/50',
            modalAccent: 'bg-red-50 border-red-500 text-red-900',
            modalIcon: '⚠️'
        },
        grey: {
            textColor: 'text-gray-900',
            headerBg: 'bg-gray-50',
            headerBorder: 'border-gray-200',
            headerText: 'text-gray-900',
            iconText: 'text-gray-600',
            taskBorder: 'border-gray-400',
            taskBg: 'bg-gray-100/50',
            modalAccent: 'bg-gray-50 border-gray-500 text-gray-900',
            modalIcon: 'ℹ️'
        }
    };

    const theme = themes[conditionColor] || themes.grey;

    const handleOptOutClick = () => {
        setShowModal(true);
    };

    const handleModalAction = (action) => {
        setShowModal(false);

        if (action === 'return') {
            // "Going back to task" experienced.
            setStep(1);
        } else if (action === 'switch') {
            // "Switching tasks" experienced.
            setStep(2);
        } else if (action === 'optout') {
            // "Opting out" experienced.
            onComplete();
        }
    };

    // Dynamic Instructions
    let instruction = "1. Click the 'Opt Out' button, then choose 'Return to Task'.";

    if (step === 1) {
        if (isGenuine) {
            instruction = "2. Click 'Opt Out' again, then choose 'Switch Task'.";
        } else {
            instruction = "2. Click 'Opt Out' again, then choose 'Confirm Opt Out'.";
        }
    } else if (step === 2) {
        instruction = "3. Click 'Opt Out' one last time, then choose 'Confirm Opt Out'.";
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">

            {/* Top Instructions */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10 text-center max-w-3xl w-full">
                <h2 className={`text-3xl font-bold mb-4 ${theme.textColor}`}>
                    {conditionName} Training
                </h2>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-4">
                    <p className="text-xl text-gray-800 font-medium leading-relaxed">
                        {instruction}
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-500 font-medium">
                    <span>Follow the instructions above to practice the opt-out flow</span>
                </div>
            </div>

            {/* Task Area Card */}
            <div className={`w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 ${theme.taskBorder} transform transition-all hover:scale-[1.005] duration-500`}>

                {/* Header */}
                <div className={`p-6 border-b-2 ${theme.headerBg} ${theme.headerBorder} flex items-center justify-between`}>
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-2xl font-bold ${theme.headerText}`}>Practice Task</h3>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full border border-yellow-200 font-bold uppercase tracking-wide">
                                    Demo Mode
                                </span>
                            </div>
                            <p className={`${theme.headerText} opacity-75 font-medium`}>Demonstration of task environment ({conditionName})</p>
                        </div>
                    </div>

                    <button
                        onClick={handleOptOutClick}
                        className="group flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <span>Opt Out of Task</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                {/* Game Area - Filled with Condition Color */}
                <div className={`h-[450px] w-full ${theme.taskBg} flex items-center justify-center relative`}>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>

                    {/* Placeholder Content */}
                    <div className="text-center opacity-60">
                        <p className={`text-2xl font-bold uppercase tracking-widest ${theme.headerText} opacity-70`}>
                            {conditionName} Task Area
                        </p>
                    </div>
                </div>
            </div>


            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Skip this Task?
                        </h3>

                        <div className="space-y-4 mb-8">
                            <p className="text-gray-600 text-lg">
                                You can choose to leave this specific task.
                            </p>

                            <div className={`p-4 rounded-xl border-l-4 ${theme.modalAccent} shadow-md`}>
                                <div className="flex items-start gap-4">
                                    <div>
                                        <p className="font-bold text-lg">
                                            {conditionColor === 'orange' ? 'Earnings Lost' : 'Earnings Kept'}
                                        </p>
                                        <p className="text-sm opacity-90 mt-1 leading-relaxed">
                                            {conditionColor === 'orange' ?
                                                'You will LOSE any money earned in this task.' :
                                                'You will KEEP all money earned in this task.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleModalAction('return')}
                                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all hover:shadow-md flex justify-between px-6 group"
                            >
                                <span>Return to Task</span>
                                <span className="text-gray-400 group-hover:text-gray-600 font-normal">Esc</span>
                            </button>

                            {isGenuine && (
                                <button
                                    onClick={() => handleModalAction('switch')}
                                    className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all hover:shadow-md flex justify-between px-6 group border border-blue-200"
                                >
                                    <span>Switch Task</span>
                                    <span className="text-blue-400 group-hover:text-blue-600">⇄</span>
                                </button>
                            )}

                            <button
                                onClick={() => handleModalAction('optout')}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all hover:shadow-xl hover:-translate-y-0.5 mt-2 flex justify-between px-6"
                            >
                                <span>Confirm Opt Out</span>
                                <span>✕</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Ban } from 'lucide-react';

export const OptOutTraining = ({ conditionColor, conditionName, onComplete }) => {
    // Stage of the guided tour
    // 0: Start - Highlight 'Opt Out' button
    // 1: Modal Open - Highlight 'Return to Task' button
    // 2: Explanation 'Return to Task' open -> "Try it"
    // 3: Simulation: Back to Task (Modal Closed) - Highlight 'Opt Out' again

    // -- If Genuine --
    // 5: Modal Open - Highlight 'Switch Task'
    // 6: Explanation 'Switch Task' open -> "Try it"
    // 7: Simulation: Switch Task (In-place Screenshot Change) -> "Continue"

    // -- Common --
    // 8: Modal Open - Highlight 'End Task'
    // 9: Explanation 'End Task' open -> "Finish"

    const [tourStage, setTourStage] = useState(0);

    const isGenuine = conditionColor === 'green';
    const isCoercion = conditionColor === 'orange';
    const isApparent = conditionColor === 'purple';

    // Theme Logic
    const getTaskTheme = () => {
        switch (conditionColor) {
            case 'green':
                return {
                    taskBg: 'bg-green-200',
                    taskBorder: 'border-green-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
            case 'purple': // Apparent
                return {
                    taskBg: 'bg-purple-200',
                    taskBorder: 'border-purple-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
            case 'orange':
                return {
                    taskBg: 'bg-orange-200',
                    taskBorder: 'border-orange-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
            default:
                return {
                    taskBg: 'bg-gray-200',
                    taskBorder: 'border-gray-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
        }
    };

    const theme = getTaskTheme();

    const modalTheme = {
        overlay: 'bg-gray-900/40',
        bg: 'bg-white',
        border: 'border-gray-400',
        title: 'text-gray-800',
        text: 'text-gray-800',
        icon: 'text-gray-600',
        primaryBtn: 'bg-gray-700 hover:bg-gray-800 text-white',
        secondaryBtn: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        tertiaryBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-800'
    };

    const handleOptOutClick = () => {
        if (tourStage === 0) {
            setTourStage(1);
        } else if (tourStage === 3) {
            // Re-opening modal after "Return to Task" simulation
            if (isGenuine) {
                setTourStage(5); // Go to Switch Task
            } else {
                setTourStage(8); // Go to End Task
            }
        } else if (tourStage === 7) {
            // Re-opening modal after "Switch Task" simulation
            setTourStage(8); // Go to End Task
        }
    };

    const handleReturnClick = () => {
        if (tourStage === 1) {
            setTourStage(2);
        }
    };

    const handleSwitchClick = () => {
        if (tourStage === 5) {
            setTourStage(6);
        }
    };

    const handleEndTaskClick = () => {
        if (tourStage === 8) {
            setTourStage(9);
        }
    };

    const handleNextStep = () => {
        if (tourStage === 2) {
            // Simulate "Back to Task" -> Close modal, go to stage 3
            setTourStage(3);
        } else if (tourStage === 6) {
            // Simulate "Switch Task" -> Show screenshot, go to stage 7
            setTourStage(7);
        } else if (tourStage === 9) {
            onComplete();
        }
    };


    const isDimmed = (targetStage) => tourStage !== targetStage;

    const ExplanationPopup = ({ title, text, onNext, buttonText = "Got it", position = "top" }) => (
        <div className={`absolute z-[100] w-64 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200
            ${position === 'top' ? '-top-32 left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? '-bottom-40 left-1/2 -translate-x-1/2' : ''}
            ${position === 'left' ? 'right-[110%] top-1/2 -translate-y-1/2' : ''}
            ${position === 'right' ? 'left-[110%] top-1/2 -translate-y-1/2' : ''}
        `}>
            <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
            <div className="text-sm text-gray-600 mb-4">{text}</div>
            <button
                onClick={onNext}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
                {buttonText}
            </button>
            <div className={`absolute w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45
                ${position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
                ${position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2 border-r-0 border-b-0 border-l border-t' : ''}
            `}></div>
        </div>
    );

    const ClickIndicator = ({ position = "top" }) => (
        <div className={`absolute z-[90] pointer-events-none flex flex-col items-center animate-bounce
             ${position === 'top' ? '-top-12 left-1/2 -translate-x-1/2' : ''}
        `}>
            <span className="text-white font-bold text-sm bg-black px-2 py-0.5 rounded mb-1">Click Here</span>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
        </div>
    );


    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Top Instructions */}
            <div className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-10 text-center max-w-3xl w-full z-0 transition-opacity duration-300
                ${(tourStage !== 3 && tourStage !== 7 && tourStage !== 0) ? 'opacity-30' : ''}
            `}>
                <h2 className={`text-3xl font-bold mb-4 ${theme.textColor}`}>
                    {conditionName} Training
                </h2>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-4">
                    <p className="text-xl text-gray-800 font-medium leading-relaxed">
                        {tourStage === 3
                            ? "Great! You are back in the task. Now click 'Opt Out' again to explore other options."
                            : tourStage === 7
                                ? "Notice the task has switched! Click 'Opt Out' again to proceed."
                                : "Practice the Opt-Out procedure."}
                    </p>
                </div>
            </div>

            {/* Task Area Card */}
            <div className={`w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 ${theme.taskBorder} relative z-0
                 ${(tourStage === 0 || tourStage === 3 || tourStage === 7) ? 'z-20 ring-4 ring-white' : ''}
            `}>

                {/* Header */}
                <div className={`p-6 border-b-2 ${theme.headerBg} ${theme.headerBorder} flex items-center justify-between relative`}>

                    <div className={`flex items-center gap-4 relative z-0 transition-opacity duration-300 ${(tourStage !== 0 && tourStage !== 3 && tourStage !== 7) ? 'opacity-30' : ''}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-2xl font-bold ${theme.headerText}`}>Practice Task</h3>
                            </div>
                            <p className={`${theme.headerText} opacity-75 font-medium`}>Demonstration of task environment</p>
                        </div>
                    </div>

                    <div className="relative z-20">
                        {(tourStage === 0 || tourStage === 3 || tourStage === 7) && <ClickIndicator position="top" />}
                        <button
                            onClick={handleOptOutClick}
                            disabled={tourStage !== 0 && tourStage !== 3 && tourStage !== 7}
                            className={`group flex items-center gap-2 bg-red-50 text-red-700 border-2 border-red-200 px-6 py-3 rounded-xl font-bold transition-all shadow-sm
                                ${(tourStage === 0 || tourStage === 3 || tourStage === 7) ? 'hover:bg-red-100 hover:shadow-md cursor-pointer scale-105 shadow-xl' : 'opacity-50 cursor-default'}
                            `}
                        >
                            <span>Opt Out of Task</span>
                        </button>
                    </div>
                </div>

                {/* Game Area */}
                <div className={`h-[450px] w-full ${theme.taskBg} flex items-center justify-center relative overflow-hidden transition-opacity duration-300 ${(tourStage !== 0 && tourStage !== 3 && tourStage !== 7) ? 'opacity-30' : ''}`}>
                    {/* Default View (No Image) */}
                    {!isGenuine && !isApparent && !isCoercion && (
                        <div className="text-center opacity-60">
                            <p className={`text-2xl font-bold uppercase tracking-widest ${theme.headerText} opacity-70`}>
                                {conditionName} Task Area
                            </p>
                        </div>
                    )}

                    {/* Genuine Condition: Show Screenshots */}
                    {isGenuine && (
                        <div className="absolute inset-0 w-full h-full">
                            {/* Matching Mammals (Default) */}
                            <img
                                src="/images/matching_mammals.png"
                                alt="Matching Mammals Task"
                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500
                                    ${tourStage === 7 ? 'opacity-0' : 'opacity-100'}
                                `}
                            />

                            {/* Matching Equations (Switched) */}
                            <img
                                src="/images/matching_equations.png"
                                alt="Matching Equations Task"
                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500
                                    ${tourStage === 7 ? 'opacity-100' : 'opacity-0'}
                                `}
                            />

                            {/* Overlay Text for context when not focused */}
                            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm transition-opacity duration-300
                                ${(tourStage !== 0 && tourStage !== 3 && tourStage !== 7) ? 'opacity-0' : 'opacity-100'}
                             `}>
                                <p className="text-sm font-bold text-gray-800">
                                    {tourStage === 7 ? "New Task: Matching Equations" : "Current Task: Matching"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Apparent (Purple) Condition */}
                    {isApparent && (
                        <div className="absolute inset-0 w-full h-full">
                            <img
                                src="/images/purple_mammals.png"
                                alt="Apparent Condition Task"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm transition-opacity duration-300
                                ${(tourStage !== 0 && tourStage !== 3 && tourStage !== 7) ? 'opacity-0' : 'opacity-100'}
                             `}>
                                <p className="text-sm font-bold text-gray-800">Current Task: Matching</p>
                            </div>
                        </div>
                    )}

                    {/* Coercion (Orange) Condition */}
                    {isCoercion && (
                        <div className="absolute inset-0 w-full h-full">
                            <img
                                src="/images/orange_mammals.png"
                                alt="Coercion Condition Task"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm transition-opacity duration-300
                                ${(tourStage !== 0 && tourStage !== 3 && tourStage !== 7) ? 'opacity-0' : 'opacity-100'}
                             `}>
                                <p className="text-sm font-bold text-gray-800">Current Task: Matching</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* CUSTOM MODAL */}
            {(tourStage === 1 || tourStage === 2 || tourStage === 4 || tourStage === 5 || tourStage === 6 || tourStage === 8 || tourStage === 9) && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${modalTheme.overlay} backdrop-blur-sm transition-opacity`}>

                    {/* Modal Container */}
                    <div className={`w-full max-w-xl p-6 rounded-2xl shadow-2xl border-2 transform transition-all scale-100 relative ${modalTheme.bg} ${modalTheme.border}`}>

                        {/* Overlay to dim non-active parts of modal */}
                        {(tourStage === 2 || tourStage === 6 || tourStage === 9) && (
                            <div className="absolute inset-0 bg-black/10 z-10 rounded-2xl pointer-events-none" />
                        )}

                        <div className="flex flex-col items-center text-center gap-4 relative z-0">
                            {/* Icon */}
                            <div className={`p-3 rounded-full bg-opacity-10 ${modalTheme.icon} bg-current opacity-50`}>
                                <AlertCircle className="w-8 h-8" />
                            </div>

                            {/* Title */}
                            <h2 className={`text-2xl font-bold ${modalTheme.title} opacity-50`}>
                                End Task Confirmation
                            </h2>

                            {/* Message Body */}
                            <div className="space-y-3 text-lg opacity-50">
                                <p className={modalTheme.text}>
                                    {isCoercion ? (
                                        <>
                                            If you opt out, you will <span className="font-bold underline text-black-600">lose all the money</span> earned so far in this task.
                                        </>
                                    ) : (
                                        <>
                                            If you opt out you can <span className="font-bold text-black-600">keep all the money</span> you have earned so far.
                                        </>
                                    )}
                                </p>
                                <p className="opacity-80 pb-2">
                                    Do you want to {isGenuine ? 'switch tasks or ' : ''}end the <strong>{conditionName}</strong> task?
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 w-full pt-4 relative">

                                {/* Return to Task */}
                                <div className="flex-1 relative z-20">
                                    {tourStage === 1 && <ClickIndicator position="top" />}
                                    {tourStage === 2 && (
                                        <ExplanationPopup
                                            title="Return to Task"
                                            text="The button will take you back to the task."
                                            onNext={handleNextStep}
                                            buttonText="Try it"
                                            position="top"
                                        />
                                    )}
                                    <button
                                        onClick={handleReturnClick}
                                        disabled={tourStage !== 1}
                                        className={`w-full py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform text-sm ${modalTheme.secondaryBtn}
                                            ${tourStage === 1 ? 'z-30 relative ring-4 ring-blue-400 scale-105 shadow-xl cursor-pointer' : 'opacity-40 cursor-default'}
                                            ${tourStage === 2 ? 'z-30 relative ring-4 ring-blue-400' : ''}
                                        `}
                                    >
                                        Return to Task
                                    </button>
                                </div>

                                {/* Switch Task (Genuine Only) */}
                                {isGenuine && (
                                    <div className="flex-1 relative z-20">
                                        {tourStage === 5 && <ClickIndicator position="top" />}
                                        {tourStage === 6 && (
                                            <ExplanationPopup
                                                title="Switch Task"
                                                text="This button will switch you to the other task type."
                                                onNext={handleNextStep}
                                                buttonText="Try it"
                                                position="top"
                                            />
                                        )}
                                        <button
                                            onClick={handleSwitchClick}
                                            disabled={tourStage !== 5}
                                            className={`w-full py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform text-sm ${modalTheme.tertiaryBtn}
                                                ${tourStage === 5 ? 'z-30 relative ring-4 ring-blue-400 scale-105 shadow-xl cursor-pointer' : 'opacity-40 cursor-default'}
                                                ${tourStage === 6 ? 'z-30 relative ring-4 ring-blue-400' : ''}
                                            `}
                                        >
                                            Switch Task
                                        </button>
                                    </div>
                                )}

                                {/* End Task */}
                                <div className="flex-1 relative z-20">
                                    {tourStage === 8 && <ClickIndicator position="top" />}
                                    {tourStage === 9 && (
                                        <ExplanationPopup
                                            title="End Task"
                                            text={isCoercion
                                                ? "Pressing this button will lose all the money earned in this task and finish the task."
                                                : "This button will let you keep all your money and finish the task."
                                            }
                                            onNext={handleNextStep}
                                            buttonText="Finish Training"
                                            position="top"
                                        />
                                    )}
                                    <button
                                        onClick={handleEndTaskClick}
                                        disabled={tourStage !== 8}
                                        className={`w-full py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform text-sm ${modalTheme.primaryBtn}
                                            ${tourStage === 8 ? 'z-30 relative ring-4 ring-blue-400 scale-105 shadow-xl cursor-pointer' : 'opacity-40 cursor-default'}
                                            ${tourStage === 9 ? 'z-30 relative ring-4 ring-blue-400' : ''}
                                        `}
                                    >
                                        End Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

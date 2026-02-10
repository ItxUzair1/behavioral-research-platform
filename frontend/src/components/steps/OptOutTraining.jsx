import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Ban } from 'lucide-react';

export const OptOutTraining = ({ conditionColor, conditionName, onComplete }) => {
    // Stage of the guided tour
    // 0: Start - Highlight 'Opt Out' button
    // 1: Modal Open - Highlight 'Return to Task' button
    // 2: Explanation 'Return to Task' open
    // 3: Highlight 'Switch Task' (if applicable)
    // 4: Explanation 'Switch Task' open
    // 5: Highlight 'End Task'
    // 6: Explanation 'End Task' open
    const [tourStage, setTourStage] = useState(0);

    const isGenuine = conditionColor === 'green';
    const isCoercion = conditionColor === 'orange';
    // const isApparent = conditionColor === 'purple'; // Not strictly needed if logic is just Genuine vs Non-Genuine switch

    // Theme Logic
    // Task Area gets the condition color. Steps/Header remain neutral (white/gray).
    const getTaskTheme = () => {
        switch (conditionColor) {
            case 'green':
                return {
                    taskBg: 'bg-green-200', // Matches MatchingGame/SortingGame Genuine
                    taskBorder: 'border-green-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
            case 'purple':
                return {
                    taskBg: 'bg-purple-200', // Matches Apparent condition
                    taskBorder: 'border-purple-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
            case 'orange':
                return {
                    taskBg: 'bg-orange-200', // Matches Coercion condition
                    taskBorder: 'border-orange-400',
                    headerBg: 'bg-white',
                    headerBorder: 'border-gray-200',
                    headerText: 'text-gray-900',
                    textColor: 'text-gray-900'
                };
            default: // Fallback / Grey
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

    // Modal Theme (Matches OptOutModal)
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
        }
    };

    const handleReturnClick = () => {
        if (tourStage === 1) {
            setTourStage(2);
        }
    };

    const handleSwitchClick = () => {
        if (tourStage === 3) {
            setTourStage(4);
        }
    };

    const handleEndTaskClick = () => {
        if (tourStage === 5) {
            setTourStage(6);
        }
    };

    const advanceTour = () => {
        if (tourStage === 2) {
            // If Genuine, go to Switch (3), else skip to End (5)
            if (isGenuine) setTourStage(3);
            else setTourStage(5);
        } else if (tourStage === 4) {
            setTourStage(5);
        } else if (tourStage === 6) {
            onComplete();
        }
    };

    // Overlay helper to spotlight an element
    // Since we are building a custom UI, we can just conditionally apply z-index and relative positioning
    // to the "active" element, and have a fixed overlay behind it.
    // However, for the Modal buttons, they are inside the modal.
    // Let's use a simpler approach: A full screen overlay is always present when tourStage > 0.
    // The Modal sits on top of that.
    // Inside the Modal, we can use another semi-transparent overlay to dim inactive buttons?
    // Or just disable them and highlight the active one with a ring/glow.
    // The prompt asks for "slightly fading out the background except the... button".

    // We can simulate this by having a backdrop that covers everything, and rendering the "active" element
    // ON TOP of the backdrop.
    // But moving DOM elements is hard.
    // Easier: Render the overlay *around* the active element? Hard.
    // Easiest: Use `box-shadow` on the active element to create a massive dark shadow?
    // Or just specific styles on the non-active elements to fade them out.

    // Let's try the "dim others" approach.
    const isDimmed = (targetStage) => tourStage !== targetStage;

    // Helper for popup explanation
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
            {/* Arrow */}
            <div className={`absolute w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45
                ${position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' : ''}
                ${position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2 border-r-0 border-b-0 border-l border-t' : ''}
            `}></div>
        </div>
    );

    // Click Here Indicator
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
                ${tourStage === 0 ? 'opacity-30' : ''}
            `}>
                <h2 className={`text-3xl font-bold mb-4 ${theme.textColor}`}>
                    {conditionName} Training
                </h2>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-4">
                    <p className="text-xl text-gray-800 font-medium leading-relaxed">
                        Practice the Opt-Out procedure.
                    </p>
                </div>
            </div>

            {/* Task Area Card */}
            <div className={`w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 ${theme.taskBorder} relative z-0
                 ${tourStage === 0 ? 'z-20 ring-4 ring-white' : ''}
            `}>

                {/* Header */}
                <div className={`p-6 border-b-2 ${theme.headerBg} ${theme.headerBorder} flex items-center justify-between relative`}>

                    <div className={`flex items-center gap-4 relative z-0 transition-opacity duration-300 ${tourStage === 0 ? 'opacity-30' : ''}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-2xl font-bold ${theme.headerText}`}>Practice Task</h3>
                            </div>
                            <p className={`${theme.headerText} opacity-75 font-medium`}>Demonstration of task environment</p>
                        </div>
                    </div>

                    <div className="relative z-20">
                        {tourStage === 0 && <ClickIndicator position="top" />}
                        <button
                            onClick={handleOptOutClick}
                            disabled={tourStage !== 0}
                            className={`group flex items-center gap-2 bg-red-50 text-red-700 border-2 border-red-200 px-6 py-3 rounded-xl font-bold transition-all shadow-sm
                                ${tourStage === 0 ? 'hover:bg-red-100 hover:shadow-md cursor-pointer scale-105 shadow-xl' : 'opacity-50 cursor-default'}
                            `}
                        >
                            <span>Opt Out of Task</span>
                        </button>
                    </div>
                </div>

                {/* Game Area */}
                <div className={`h-[450px] w-full ${theme.taskBg} flex items-center justify-center relative transition-opacity duration-300 ${tourStage === 0 ? 'opacity-30' : ''}`}>
                    <div className="text-center opacity-60">
                        <p className={`text-2xl font-bold uppercase tracking-widest ${theme.headerText} opacity-70`}>
                            {conditionName} Task Area
                        </p>
                    </div>
                </div>
            </div>


            {/* CUSTOM MODAL - REPLICA OF OptOutModal */}
            {tourStage > 0 && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${modalTheme.overlay} backdrop-blur-sm transition-opacity`}>

                    {/* Modal Container */}
                    <div className={`w-full max-w-xl p-6 rounded-2xl shadow-2xl border-2 transform transition-all scale-100 relative ${modalTheme.bg} ${modalTheme.border}`}>

                        {/* Overlay to dim non-active parts of modal */}
                        {(tourStage === 2 || tourStage === 4 || tourStage === 6) && (
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
                                            text="If you press this button, it will take you back to the task so you can continue working."
                                            onNext={advanceTour}
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
                                        {tourStage === 3 && <ClickIndicator position="top" />}
                                        {tourStage === 4 && (
                                            <ExplanationPopup
                                                title="Switch Task"
                                                text="If you press this button, you will switch to the other task type immediately."
                                                onNext={advanceTour}
                                                position="top"
                                            />
                                        )}
                                        <button
                                            onClick={handleSwitchClick}
                                            disabled={tourStage !== 3}
                                            className={`w-full py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform text-sm ${modalTheme.tertiaryBtn}
                                                ${tourStage === 3 ? 'z-30 relative ring-4 ring-blue-400 scale-105 shadow-xl cursor-pointer' : 'opacity-40 cursor-default'}
                                                ${tourStage === 4 ? 'z-30 relative ring-4 ring-blue-400' : ''}
                                            `}
                                        >
                                            Switch Task
                                        </button>
                                    </div>
                                )}

                                {/* End Task */}
                                <div className="flex-1 relative z-20">
                                    {tourStage === 5 && <ClickIndicator position="top" />}
                                    {tourStage === 6 && (
                                        <ExplanationPopup
                                            title="End Task"
                                            text="If you press this button, you will stop the task completely and move to the next section."
                                            onNext={advanceTour}
                                            buttonText="Finish Training"
                                            position="top"
                                        />
                                    )}
                                    <button
                                        onClick={handleEndTaskClick}
                                        disabled={tourStage !== 5}
                                        className={`w-full py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform text-sm ${modalTheme.primaryBtn}
                                            ${tourStage === 5 ? 'z-30 relative ring-4 ring-blue-400 scale-105 shadow-xl cursor-pointer' : 'opacity-40 cursor-default'}
                                            ${tourStage === 6 ? 'z-30 relative ring-4 ring-blue-400' : ''}
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

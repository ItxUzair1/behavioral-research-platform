import React from 'react';
import { AlertCircle, ArrowLeft, Ban } from 'lucide-react';

export const OptOutModal = ({ isOpen, onCancel, onConfirm, onSwitch, phase, taskName }) => {
    if (!isOpen) return null;

    const isCoercion = phase?.toLowerCase().includes('coercion');
    const isApparent = phase?.toLowerCase().includes('apparent');

    // Determine theme based on phase
    // Unified Grey Theme for all conditions
    const theme = {
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

    // Checking if we show the Switch option (Only for Genuine)
    const showSwitch = !isCoercion && !isApparent;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${theme.overlay} backdrop-blur-sm transition-opacity`}>
            {/* Modal Container */}
            <div className={`w-full max-w-xl p-6 rounded-2xl shadow-2xl border-2 transform transition-all scale-100 ${theme.bg} ${theme.border}`}>

                <div className="flex flex-col items-center text-center gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-full bg-opacity-10 ${theme.icon} bg-current`}>
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    {/* Title */}
                    <h2 className={`text-2xl font-bold ${theme.title}`}>
                        End Task Confirmation
                    </h2>

                    {/* Message Body */}
                    <div className="space-y-3 text-lg">
                        <p className={theme.text}>
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
                            Do you want to {showSwitch ? 'switch tasks or ' : ''}end the <strong>{taskName}</strong> task?
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 w-full pt-4">
                        {/* Return to Task */}
                        <button
                            onClick={onCancel}
                            className={`flex-1 py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm ${theme.secondaryBtn}`}
                        >
                            Return to Task
                        </button>

                        {/* Switch Task (Genuine Only) */}
                        {showSwitch && (
                            <button
                                onClick={onSwitch || (() => alert("Switch logic needs implementation"))}
                                className={`flex-1 py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm ${theme.tertiaryBtn}`}
                            >
                                Switch Task
                            </button>
                        )}

                        {/* End Task */}
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-sm ${theme.primaryBtn}`}
                        >
                            End Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

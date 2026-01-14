import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const SortingGame = ({ variant, participantId, phase, onComplete, onTrialEnd }) => {
    const [stimulus, setStimulus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);

    const fetchStimulus = async () => {
        if (!stimulus) setLoading(true);
        try {
            const res = await api.getStimulus('sorting', variant);
            if (res.success) {
                setStimulus(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStimulus();
    }, [variant]);

    const handleDrop = async (item, targetCategory) => {
        if (!stimulus) return;

        // Correct if the item's secret category matches the dropped target
        const isCorrect = item.category === targetCategory;

        const rt = Math.floor(Math.random() * 500 + 500);
        onTrialEnd(isCorrect, rt);

        // Submit Result
        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'sorting',
                phase,
                correct: isCorrect
            });

            if (res.success && res.reward) {
                setFeedback({ correct: isCorrect, amount: res.amount });
            } else {
                if (!res.reward) {
                    // Auto advance
                    setTimeout(fetchStimulus, 500);
                }
            }
        } catch (err) {
            console.error(err);
            setTimeout(fetchStimulus, 500);
        }
    };

    const handleModalClose = () => {
        setFeedback(null);
        fetchStimulus();
    };

    if (loading) return <div className="p-10 text-center font-mono text-gray-500">Loading Task...</div>;

    return (
        <div className="flex flex-col items-center gap-8 min-h-[500px] w-full max-w-4xl mx-auto bg-gray-200 p-8 border-2 border-gray-400 relative">

            {/* INSTRUCTIONS */}
            <div className="bg-white border-2 border-black p-4 text-center max-w-xl shadow-sm z-10">
                <h3 className="font-bold text-lg mb-1 font-serif">Instructions</h3>
                <p className="font-serif text-lg">
                    Accurately sort the items on the left to the items on the right
                </p>
            </div>

            {/* REWARD MODAL */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/10 backdrop-blur-[1px]">
                    <div className="bg-[#4ADE80] border-4 border-black p-8 w-[400px] text-center shadow-2xl animate-in zoom-in duration-200">
                        <p className="font-serif text-xl mb-6 text-black font-medium leading-tight">
                            You have earned money! Click "ok" to continue
                        </p>
                        <button
                            onClick={handleModalClose}
                            className="bg-[#FF0000] text-black border-2 border-black px-10 py-2 uppercase font-sans text-lg font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="flex w-full justify-between items-center px-12 mt-8 flex-1">
                {/* LEFT SIDE: Draggable Items */}
                <div className="flex flex-col gap-6">
                    {stimulus?.options.map((item, idx) => (
                        <div
                            key={idx}
                            draggable={!feedback}
                            onDragStart={(e) => e.dataTransfer.setData("text", JSON.stringify(item))}
                            className="w-32 h-24 bg-white border-4 border-black flex items-center justify-center cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg transition-transform"
                        >
                            <span className="text-2xl font-serif">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* RIGHT SIDE: Droppable Categories */}
                <div className="flex flex-col gap-6">
                    {stimulus?.targets.map((cat, idx) => (
                        <div
                            key={idx}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData("text"));
                                    handleDrop(data, cat);
                                } catch (err) { console.error("Drop error", err); }
                            }}
                            className="w-32 h-24 bg-white border-4 border-black flex items-center justify-center text-center p-2"
                        >
                            <span className="text-xl font-serif leading-tight">{cat}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export const MatchingGame = ({ variant, participantId, phase, onComplete, onTrialEnd }) => {
    const [stimulus, setStimulus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null); // { correct: boolean, amount: number }

    const fetchStimulus = async () => {
        if (!stimulus) setLoading(true);
        try {
            const res = await api.getStimulus('matching', variant);
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

    const handleDrop = async (droppedOption) => {
        if (!stimulus) return;

        // Validate against correctOption
        const isCorrect = droppedOption === stimulus.correctOption;

        const rt = Math.floor(Math.random() * 500 + 500);
        onTrialEnd(isCorrect, rt);

        // Submit to backend
        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'matching',
                phase,
                correct: isCorrect
            });

            if (res.success && res.reward) {
                setFeedback({ correct: isCorrect, amount: res.amount });
            } else {
                if (!res.reward) {
                    // Next trial automatically if no reward
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

            {/* INSTRUCTIONS BOX */}
            <div className="bg-white border-2 border-black p-4 text-center max-w-xl shadow-sm z-10">
                <h3 className="font-bold text-lg mb-1 font-serif">Instructions</h3>
                <p className="font-serif text-lg">
                    Accurately Match the items on the left to the item on the right
                </p>
            </div>

            {/* REWARD MODAL (Custom Green/Red style) */}
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
                {/* LEFT SIDE: Draggable Options */}
                <div className="flex flex-col gap-6">
                    {stimulus?.options.map((opt, idx) => {
                        const isObject = typeof opt === 'object';
                        const displayValue = isObject ? opt.name : opt;

                        return (
                            <div
                                key={idx}
                                draggable={!feedback}
                                onDragStart={(e) => e.dataTransfer.setData("text", displayValue)}
                                className="w-32 h-24 bg-white border-4 border-black flex items-center justify-center cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg transition-transform overflow-hidden relative"
                            >
                                {isObject && opt.id ? (
                                    <ImageWithFallback
                                        basePath={`/images/${opt.id}`}
                                        alt={opt.name}
                                    />
                                ) : (
                                    <span className="text-2xl font-serif">{displayValue}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT SIDE: Droppable Target */}
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData("text");
                        handleDrop(data);
                    }}
                    className="w-32 h-32 bg-white border-4 border-black flex items-center justify-center"
                >
                    <span className="text-3xl font-serif">{stimulus?.stimulus}</span>
                </div>
            </div>
        </div>
    );
};

// Helper Component for retrying extensions
const ImageWithFallback = ({ basePath, alt }) => {
    // Tries: .png -> .jpg -> .jpeg -> .jfif -> fallback text
    const extensions = ['.png', '.jpg', '.jpeg', '.jfif'];
    const [extIndex, setExtIndex] = React.useState(0);
    const [failed, setFailed] = React.useState(false);

    // Reset state when the image source changes (new trial)
    React.useEffect(() => {
        setExtIndex(0);
        setFailed(false);
    }, [basePath]);

    const handleError = () => {
        const nextIndex = extIndex + 1;
        if (nextIndex < extensions.length) {
            setExtIndex(nextIndex);
        } else {
            setFailed(true);
        }
    };

    if (failed) {
        return <span className="text-lg font-serif font-bold p-2 text-center text-xs leading-tight">{alt}</span>;
    }

    return (
        <img
            src={`${basePath}${extensions[extIndex]}`}
            alt={alt}
            className="w-full h-full object-cover pointer-events-none"
            onError={handleError}
        />
    );
};

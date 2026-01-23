import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RewardModal } from '../common/RewardModal';

export const MatchingGame = ({ variant, participantId, phase, onComplete, onTrialEnd, currentTrial, totalTrials }) => {
    const [stimulus, setStimulus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState(0);
    const [internalTrialCount, setInternalTrialCount] = useState(0);
    const [rewardData, setRewardData] = useState(null); // { amount: number }

    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isPreTraining = phase?.toLowerCase().includes('pre-training');

    // Use props if available (Execution/Apparent), else fallback to internal logic (Pre-Training initial load)
    const displayTrial = currentTrial || internalTrialCount;
    // Max trials: 15 for pre-training, 200 otherwise
    const displayMax = totalTrials || (isPreTraining ? 15 : 200);

    // Show earnings if NOT Pre-Training
    const showEarnings = !isPreTraining;

    const initTask = async () => {
        setLoading(true);
        try {
            // 1. Get Stimulus
            const res = await api.getStimulus('matching', variant);
            if (res.success) setStimulus(res.data);

            // 2. Initialize and get counts
            const startRes = await api.startTask(participantId, 'matching', phase, variant);
            if (startRes.success) {
                setEarnings(startRes.data.totalEarnings);
                setInternalTrialCount(startRes.data.trialsCompleted);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initTask();
    }, [variant]); // Re-init if variant changes

    const handleDrop = async (droppedOption) => {
        if (!stimulus) return;

        // Determine selected option label
        let selectedOptionLabel = droppedOption;
        // Check if droppedOption is an ID or Name
        // Try to find it in stimulus options
        if (stimulus && stimulus.options) {
            // Find index
            const idx = stimulus.options.findIndex(o => o === droppedOption || o.name === droppedOption || o.id === droppedOption);
            if (idx !== -1) {
                // selectedOptionLabel = `Position ${idx + 1} (${found.name})`; // Or just Position
                selectedOptionLabel = `Position ${idx + 1}`;
            }
        }

        const isCorrect = droppedOption === stimulus.correctOption;
        const rt = Math.floor(Math.random() * 500 + 500);


        // Submit to backend FIRST to get reward info
        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'matching',
                condition: phase,
                variant,  // Pass variant
                correct: isCorrect,
                selectedOption: selectedOptionLabel // Pass selected option
            });

            if (res.success) {
                // Update specific states
                setInternalTrialCount(res.trialsCompleted);

                // Log the trial with authoritative data
                onTrialEnd(isCorrect, rt, selectedOptionLabel, {
                    reward: res.reward,
                    currentThreshold: res.currentThreshold
                });

                if (showEarnings) {
                    setEarnings(res.totalEarnings);
                    if (res.reward) setRewardData({ amount: res.amount });
                    else setTimeout(fetchNextStimulus, 500);
                } else {
                    // Pre-Training: just next trial
                    setTimeout(fetchNextStimulus, 500);
                }
            }
        } catch (err) {
            console.error(err);
            // Fallback log without reward info if network fails?? 
            // Or just log failure.
            onTrialEnd(isCorrect, rt, selectedOptionLabel, {});
            setTimeout(fetchNextStimulus, 500);
        }
    };

    const fetchNextStimulus = async () => {
        try {
            const res = await api.getStimulus('matching', variant);
            if (res.success) setStimulus(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setRewardData(null);
        fetchNextStimulus();
    };

    if (loading) return <div className="p-10 text-center font-mono text-gray-500">Loading Task...</div>;

    // Determine background color based on phase
    let bgClass = 'bg-gray-200'; // Default
    if (phase?.toLowerCase().includes('genuine') || phase?.toLowerCase().includes('pre-training')) {
        bgClass = 'bg-green-200 border-green-400';
    } else if (phase?.toLowerCase().includes('apparent')) {
        bgClass = 'bg-purple-200 border-purple-400';
    } else if (phase?.toLowerCase().includes('coercion')) {
        bgClass = 'bg-orange-200 border-orange-400';
    }

    return (
        <div className={`flex flex-col items-center gap-4 min-h-[600px] w-full max-w-4xl mx-auto p-4 border-2 relative ${bgClass} transition-colors duration-500`}>

            {/* Top Bar with Trial Count */}
            <div className={`w-full flex justify-${showEarnings ? 'between' : 'center'} px-8 py-2 bg-gray-800 text-white font-mono text-lg shadow-md`}>
                <div>Trials: {displayTrial} / {displayMax}</div>
                {showEarnings && (
                    <div className="text-green-400 font-bold">Earnings: ${earnings.toFixed(2)}</div>
                )}
            </div>

            {/* INSTRUCTIONS BOX */}
            <div className="bg-white border-2 border-black p-4 text-center max-w-xl shadow-sm z-10 mt-2">
                <h3 className="font-bold text-lg mb-1 font-serif">Instructions</h3>
                <p className="font-serif text-lg">
                    Accurately Match the items on the left to the item on the right
                </p>
            </div>

            {/* REWARD MODAL */}
            {rewardData && (
                <RewardModal
                    amount={rewardData.amount}
                    onDismiss={handleModalClose}
                />
            )}

            <div className="flex w-full justify-between items-center px-12 mt-4 flex-1">
                {/* LEFT SIDE: Draggable Options */}
                <div className="flex flex-col gap-6">
                    {stimulus?.options.map((opt, idx) => {
                        const isObject = typeof opt === 'object';
                        const displayValue = isObject ? opt.name : opt;

                        return (
                            <div
                                key={idx}
                                draggable={!rewardData}
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

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RewardModal } from '../common/RewardModal';
import { playTrialCompleteSound } from '../../utils/audio';

export const MatchingGame = ({ variant, participantId, phase, onComplete, onTrialEnd, currentTrial, totalTrials }) => {
    // Queue State
    const stimulusQueue = useRef([]);
    const [stimulus, setStimulus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState(0);
    const [internalTrialCount, setInternalTrialCount] = useState(0);
    const [rewardData, setRewardData] = useState(null); // { amount: number }
    const [selectedOption, setSelectedOption] = useState(null); // Re-added for Tap interaction fallback

    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isPreTraining = phase?.toLowerCase().includes('pre-training');

    // Use props if available (Execution/Apparent), else fallback to internal logic (Pre-Training initial load)
    const displayTrial = currentTrial || internalTrialCount;
    // Max trials: 15 for pre-training, 200 otherwise
    const displayMax = totalTrials || (isPreTraining ? 10 : 200);

    // Show earnings if NOT Pre-Training
    const showEarnings = !isPreTraining;

    const fetchStimulusBatch = async (count = 5) => {
        try {
            const res = await api.getStimulus('matching', variant, count);
            if (res.success) {
                // Determine if we got an array or single item (backward compat)
                const newItems = Array.isArray(res.data) ? res.data : [res.data];

                // Preload images for these items
                newItems.forEach(item => preloadImages(item));

                return newItems;
            }
        } catch (err) {
            console.error(err);
        }
        return [];
    };

    const preloadImages = (stim) => {
        if (!stim || !stim.options) return;
        stim.options.forEach(opt => {
            if (typeof opt === 'object' && opt.id) {
                if (opt.ext) {
                    const img = new Image();
                    img.src = `/images/${opt.id}${opt.ext}`;
                } else {
                    const extensions = ['.png', '.jpg', '.jpeg', '.jfif'];
                    extensions.forEach(ext => {
                        const img = new Image();
                        img.src = `/images/${opt.id}${ext}`;
                    });
                }
            }
        });
    };

    // Effect: init task and fill queue
    const initTask = async () => {
        setLoading(true);
        try {
            // 1. Initial Batch Fetch (5 Items)
            const initialBatch = await fetchStimulusBatch(5);
            stimulusQueue.current = initialBatch;

            if (stimulusQueue.current.length > 0) {
                setStimulus(stimulusQueue.current.shift());
            }

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
    }, [variant]);

    const handleDrop = async (droppedOption) => {
        if (!stimulus) return;

        // ... Drop logic ... (unchanged part simplified for replacing surrounding code)
        // Determine selected option label
        let selectedOptionLabel = droppedOption;
        if (stimulus && stimulus.options) {
            const idx = stimulus.options.findIndex(o => o === droppedOption || o.name === droppedOption || o.id === droppedOption);
            if (idx !== -1) selectedOptionLabel = `Position ${idx + 1}`;
        }

        const isCorrect = droppedOption === stimulus.correctOption;
        const rt = Math.floor(Math.random() * 500 + 500);

        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'matching',
                condition: phase,
                variant,
                correct: isCorrect,
                selectedOption: selectedOptionLabel
            });

            if (res.success) {
                playTrialCompleteSound();
                setInternalTrialCount(res.trialsCompleted);
                onTrialEnd(isCorrect, rt, selectedOptionLabel, {
                    reward: res.reward,
                    currentThreshold: res.currentThreshold
                });

                if (res.reward) {
                    setRewardData({ amount: res.amount });
                } else {
                    setTimeout(advanceStimulus, 200); // reduced delay for speed
                }

                if (showEarnings) setEarnings(res.totalEarnings);
            }
        } catch (err) {
            console.error(err);
            onTrialEnd(isCorrect, rt, selectedOptionLabel, {});
            setTimeout(advanceStimulus, 200);
        }
    };

    const advanceStimulus = async () => {
        // Instant Next
        if (stimulusQueue.current.length > 0) {
            setStimulus(stimulusQueue.current.shift());
        } else {
            // Emergency fetch if empty
            setLoading(true);
            const batch = await fetchStimulusBatch(3);
            if (batch.length > 0) {
                stimulusQueue.current = batch;
                setStimulus(stimulusQueue.current.shift());
            }
            setLoading(false);
        }

        // Background Refill if low
        if (stimulusQueue.current.length < 3) {
            fetchStimulusBatch(5).then(newItems => {
                stimulusQueue.current = [...stimulusQueue.current, ...newItems];
            });
        }
    };

    const handleModalClose = () => {
        setRewardData(null);
        advanceStimulus(); // Use new advance function
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

            {/* Earnings Display Removed */}

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

            <div className="flex flex-col md:flex-row w-full justify-between items-center px-4 md:px-12 mt-4 flex-1 gap-8 md:gap-0">
                {/* LEFT SIDE: Draggable Options */}
                <div className="flex flex-row md:flex-col gap-4 md:gap-6 flex-wrap justify-center">
                    {stimulus?.options.map((opt, idx) => {
                        const isObject = typeof opt === 'object';
                        const displayValue = isObject ? opt.name : opt;
                        const isSelected = selectedOption === displayValue;

                        return (
                            <div
                                key={idx}
                                draggable={!rewardData}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text", displayValue);
                                    // IMPORTANT: Do NOT set selectedOption here to avoid interrupting drag
                                }}
                                onClick={() => setSelectedOption(displayValue)}
                                className={`w-20 h-16 md:w-32 md:h-24 bg-white border-2 md:border-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-black'} flex items-center justify-center cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg transition-transform overflow-hidden relative touch-none`}
                            >
                                {isObject && opt.id ? (
                                    <ImageWithFallback
                                        basePath={`/images/${opt.id}`}
                                        alt={opt.name}
                                        extension={opt.ext}
                                    />
                                ) : (
                                    <span className="text-sm md:text-2xl font-serif">{displayValue}</span>
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
                        setSelectedOption(null);
                    }}
                    onClick={() => {
                        if (selectedOption) {
                            handleDrop(selectedOption);
                            setSelectedOption(null);
                        }
                    }}
                    className={`w-24 h-24 md:w-32 md:h-32 bg-white border-2 md:border-4 ${selectedOption ? 'border-blue-500 border-dashed bg-blue-50' : 'border-black'} flex items-center justify-center transition-colors`}
                >
                    <span className="text-xl md:text-3xl font-serif">{stimulus?.stimulus}</span>
                </div>
            </div>
        </div>
    );
};

// Helper Component for retrying extensions
const ImageWithFallback = ({ basePath, alt, extension }) => {
    // Tries: provided extension -> .png -> .jpg -> .jpeg -> .jfif -> fallback text
    const defaultExtensions = ['.png', '.jpg', '.jpeg', '.jfif'];
    // If extension is provided, try that first. If it fails (unlikely), try others? 
    // Actually if extension is provided we should trust it to avoid 404s.
    // But for robustness, we can put it first in the list.
    const extensions = extension ? [extension] : defaultExtensions;

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

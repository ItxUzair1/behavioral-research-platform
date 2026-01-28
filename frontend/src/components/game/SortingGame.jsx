import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { RewardModal } from '../common/RewardModal';
import { playTrialCompleteSound } from '../../utils/audio';

export const SortingGame = ({ variant, participantId, phase, onComplete, onTrialEnd, currentTrial, totalTrials }) => {
    const [stimulus, setStimulus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState(0);
    const [internalTrialCount, setInternalTrialCount] = useState(0);
    const [rewardData, setRewardData] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null); // Re-added for Tap fallback

    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isPreTraining = phase?.toLowerCase().includes('pre-training');

    // Use props if available (Execution/Apparent), else fallback to internal logic (Pre-Training initial load)
    const displayTrial = currentTrial || internalTrialCount;
    const displayMax = totalTrials || (isPreTraining ? 10 : 200);

    // Queue State
    const stimulusQueue = useRef([]);

    // Show earnings if NOT Pre-Training
    const showEarnings = !isPreTraining;

    const fetchStimulusBatch = async (count = 5) => {
        try {
            const res = await api.getStimulus('sorting', variant, count);
            if (res.success) {
                const newItems = Array.isArray(res.data) ? res.data : [res.data];
                return newItems;
            }
        } catch (err) {
            console.error(err);
        }
        return [];
    };

    const initTask = async () => {
        setLoading(true);
        try {
            // 1. Initial Batch Fetch (5 Items)
            const initialBatch = await fetchStimulusBatch(5);
            stimulusQueue.current = initialBatch;

            if (stimulusQueue.current.length > 0) {
                setStimulus(stimulusQueue.current.shift());
            }

            // 2. Start Task API
            const startRes = await api.startTask(participantId, 'sorting', phase, variant);
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

    const handleDrop = async (item, targetCategory, targetIndex) => {
        const isCorrect = item.category === targetCategory;
        const selectedOptionLabel = `Bin ${targetIndex + 1}`;
        const rt = Math.floor(Math.random() * 500 + 500);

        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'sorting',
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
                    setTimeout(advanceStimulus, 200); // reduced delay
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
            // Emergency fetch
            setLoading(true);
            const batch = await fetchStimulusBatch(3);
            if (batch.length > 0) {
                stimulusQueue.current = batch;
                setStimulus(stimulusQueue.current.shift());
            }
            setLoading(false);
        }

        // Background Refill
        if (stimulusQueue.current.length < 3) {
            fetchStimulusBatch(5).then(newItems => {
                stimulusQueue.current = [...stimulusQueue.current, ...newItems];
            });
        }
    };

    const handleModalClose = () => {
        setRewardData(null);
        advanceStimulus();
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

            {/* INSTRUCTIONS */}
            <div className="bg-white border-2 border-black p-4 text-center max-w-xl shadow-sm z-10 mt-2">
                <h3 className="font-bold text-lg mb-1 font-serif">Instructions</h3>
                <p className="font-serif text-lg">
                    Sort the items into the correct category
                </p>
            </div>

            {/* REWARD MODAL */}
            {rewardData && (
                <RewardModal
                    amount={rewardData.amount}
                    onDismiss={handleModalClose}
                />
            )}

            <div className="flex flex-col md:flex-row w-full justify-between items-start px-4 md:px-8 mt-4 flex-1 gap-8">
                {/* LEFT SIDE: Draggable Options */}
                {/* Logic: Display 3 items, drag to targets? 
                    Actually, if we drag items to targets, we need to know WHICH item was dragged.
                    The previous code likely had drag logic.
                    Let's adapt the previous render logic.
                    Previous code: 
                    stimulus.options.map...
                    targets.map...
                */}

                <div className="flex flex-row md:flex-col gap-4 flex-wrap justify-center">
                    {stimulus?.options.map((opt, idx) => {
                        const isSelected = selectedOption === opt;
                        return (
                            <div
                                key={idx}
                                draggable={!rewardData}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("application/json", JSON.stringify(opt));
                                    // Do NOT set selectedOption here
                                }}
                                onClick={() => setSelectedOption(opt)}
                                className={`w-20 h-20 md:w-32 md:h-32 bg-white border-2 md:border-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-black'} flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-sm touch-none`}
                            >
                                <span className="text-sm md:text-xl font-serif font-bold">{opt.text}</span>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT SIDE: Categories */}
                <div className="flex flex-col gap-4">
                    {stimulus?.targets.map((cat, idx) => (
                        <div
                            key={idx}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                    handleDrop(data, cat, idx);
                                    setSelectedOption(null);
                                } catch (e) { console.error(e); }
                            }}
                            onClick={() => {
                                if (selectedOption) {
                                    handleDrop(selectedOption, cat, idx);
                                    setSelectedOption(null);
                                }
                            }}
                            className={`w-20 h-20 md:w-32 md:h-32 bg-white border-2 md:border-4 ${selectedOption ? 'border-blue-500 border-dashed bg-blue-50' : 'border-black'} flex items-center justify-center transition-colors shadow-sm`}
                        >
                            <span className="text-sm md:text-xl font-serif font-bold text-center px-1 md:px-2">{cat}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div >

    );
};

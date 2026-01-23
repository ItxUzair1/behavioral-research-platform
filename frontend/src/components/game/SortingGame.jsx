import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RewardModal } from '../common/RewardModal';

export const SortingGame = ({ variant, participantId, phase, onComplete, onTrialEnd, currentTrial, totalTrials }) => {
    const [stimulus, setStimulus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState(0);
    const [internalTrialCount, setInternalTrialCount] = useState(0);
    const [rewardData, setRewardData] = useState(null);

    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isPreTraining = phase?.toLowerCase().includes('pre-training');

    // Use props if available (Execution/Apparent), else fallback to internal logic (Pre-Training initial load)
    const displayTrial = currentTrial || internalTrialCount;
    const displayMax = totalTrials || (isPreTraining ? 15 : 200);

    // Show earnings if NOT Pre-Training
    const showEarnings = !isPreTraining;

    const initTask = async () => {
        setLoading(true);
        try {
            const res = await api.getStimulus('sorting', variant);
            if (res.success) setStimulus(res.data);

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
        // Validation handled by backend or frontend check?
        // Sorting usually checks category matching.
        // Assuming stimulus.options has the category.


        // Find the item in options to verify category? 
        // Logic depends on how drag/drop is implemented.
        // Reading the code below: 
        // <div ... onDrop={() => handleDrop(opt, target)} ... >
        // It seems 'opt' is the draggable item.

        const isCorrect = item.category === targetCategory;
        const selectedOptionLabel = `Bin ${targetIndex + 1}`;
        const rt = Math.floor(Math.random() * 500 + 500);

        // Submit to backend FIRST
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
                setInternalTrialCount(res.trialsCompleted);

                // Log with authoritative data
                onTrialEnd(isCorrect, rt, selectedOptionLabel, {
                    reward: res.reward,
                    currentThreshold: res.currentThreshold
                });

                if (showEarnings) {
                    setEarnings(res.totalEarnings);
                    if (res.reward) {
                        setRewardData({ amount: res.amount });
                    } else {
                        setTimeout(fetchNextStimulus, 500);
                    }
                } else {
                    setTimeout(fetchNextStimulus, 500);
                }
            }
        } catch (err) {
            console.error(err);
            // Fallback
            onTrialEnd(isCorrect, rt, selectedOptionLabel, {});
            setTimeout(fetchNextStimulus, 500);
        }
    };

    const fetchNextStimulus = async () => {
        try {
            const res = await api.getStimulus('sorting', variant);
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

            <div className="flex w-full justify-between items-start px-8 mt-4 flex-1 gap-8">
                {/* LEFT SIDE: Draggable Options */}
                {/* Logic: Display 3 items, drag to targets? 
                    Actually, if we drag items to targets, we need to know WHICH item was dragged.
                    The previous code likely had drag logic.
                    Let's adapt the previous render logic.
                    Previous code: 
                    stimulus.options.map...
                    targets.map...
                */}

                <div className="flex flex-col gap-4">
                    {stimulus?.options.map((opt, idx) => (
                        <div
                            key={idx}
                            draggable={!rewardData}
                            onDragStart={(e) => {
                                e.dataTransfer.setData("application/json", JSON.stringify(opt));
                            }}
                            className="w-32 h-32 bg-white border-4 border-black flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform shadow-sm"
                        >
                            <span className="text-xl font-serif font-bold">{opt.text}</span>
                        </div>
                    ))}
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
                                } catch (e) { console.error(e); }
                            }}
                            className="w-32 h-32 bg-white border-4 border-black flex items-center justify-center transition-colors shadow-sm"
                        >
                            <span className="text-xl font-serif font-bold text-center px-2">{cat}</span>
                        </div>
                    ))}
                </div>

            </div>
        </div >

    );
};

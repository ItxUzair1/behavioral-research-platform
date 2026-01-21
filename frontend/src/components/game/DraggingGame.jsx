import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { RewardModal } from '../common/RewardModal';

export const DraggingGame = ({ variant, participantId, phase, onComplete, onTrialEnd, currentTrial, totalTrials }) => {
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState(0);
    const [internalTrialCount, setInternalTrialCount] = useState(0);
    const [rewardData, setRewardData] = useState(null);

    // Draggable State
    const [position, setPosition] = useState(0); // 0 to 100 percentage
    const positionRef = useRef(0); // Ref to track position for event handlers
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef(null);
    const [dragSuccess, setDragSuccess] = useState(false);

    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isPreTraining = phase?.toLowerCase().includes('pre-training');
    const displayTrial = currentTrial || internalTrialCount;
    const displayMax = totalTrials || (isPreTraining ? 15 : 200);
    const showEarnings = !isPreTraining;

    // Config based on variant
    const isPR = variant === 'pr';
    const shapeClass = isPR ? 'rounded-full' : 'rounded-none'; // Circle vs Square

    const initTask = async () => {
        setLoading(true);
        try {
            const startRes = await api.startTask(participantId, 'dragging', phase, variant);
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

    // --- Drag Logic ---
    const handleStart = (e) => {
        if (rewardData) return; // Block input if showing reward
        setIsDragging(true);
    };

    const handleMove = (clientX) => {
        if (!isDragging || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const rawX = clientX - rect.left;
        const width = rect.width;

        // Constrain to 0 - 100%
        // Adjust for handle width (approx 80px or 10%)
        let newPos = (rawX / width) * 100;
        if (newPos < 0) newPos = 0;
        if (newPos > 90) newPos = 90; // Stop before end

        setPosition(newPos);
        positionRef.current = newPos; // Update Ref
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Check Success Condition (Drag > 75%)
        // Use REFINED value from Ref
        if (positionRef.current > 75) {
            handleSubmit(true);
        } else {
            // Snap back
            setPosition(0);
            positionRef.current = 0;
        }
    };

    // Mouse Events
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    // Touch Events
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    // Attach global listeners for drag continuation outside element
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', onTouchEnd);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging]);


    const handleSubmit = async (isCorrect) => {
        const rt = Math.floor(Math.random() * 500 + 500); // Mock RT
        const selectedOptionLabel = isCorrect ? "Target Reached" : "Incomplete Drag";
        onTrialEnd(isCorrect, rt, selectedOptionLabel);

        // Temporary success state to lock UI or animate
        setDragSuccess(true);

        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'dragging',
                condition: phase,
                variant,
                correct: isCorrect
            });

            if (res.success) {
                setInternalTrialCount(res.trialsCompleted);
                if (showEarnings) {
                    setEarnings(res.totalEarnings);
                    if (res.reward) {
                        setRewardData({ amount: res.amount });
                    } else {
                        // Reset immediately
                        setDragSuccess(false);
                        setPosition(0);
                    }
                } else {
                    setDragSuccess(false);
                    setPosition(0);
                }
            }
        } catch (err) {
            console.error(err);
            setDragSuccess(false);
            setPosition(0);
        }
    };

    const handleModalClose = () => {
        setRewardData(null);
        setDragSuccess(false);
        setPosition(0);
        positionRef.current = 0;
    };

    if (loading) return <div className="p-10 text-center font-mono text-gray-500">Loading Task...</div>;

    // Determine background color based on phase
    let bgClass = 'bg-gray-200';
    let dragShapeBg = 'bg-red-600 hover:bg-red-500';
    let dragInnerBg = 'bg-red-800';

    if (phase?.toLowerCase().includes('genuine') || phase?.toLowerCase().includes('pre-training')) {
        bgClass = 'bg-green-200 border-green-400';
    } else if (phase?.toLowerCase().includes('apparent')) {
        bgClass = 'bg-purple-200 border-purple-400';
    } else if (phase?.toLowerCase().includes('coercion')) {
        bgClass = 'bg-orange-200 border-orange-400';
    }

    return (
        <div className={`flex flex-col items-center gap-4 min-h-[500px] w-full max-w-4xl mx-auto p-4 border-2 relative ${bgClass} transition-colors duration-500`}>

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
                    Drag the {isPR ? 'Circle' : 'Square'} to the black box to earn points.
                </p>
            </div>

            {/* REWARD MODAL */}
            {rewardData && (
                <RewardModal
                    amount={rewardData.amount}
                    onDismiss={handleModalClose}
                />
            )}

            {/* GAME AREA - Dragging Track */}
            <div className="flex-1 w-full flex items-center justify-center relative p-8">

                {/* Track Container */}
                <div
                    ref={trackRef}
                    className="w-full max-w-2xl h-32 bg-gray-300 border-4 border-gray-500 relative flex items-center shadow-inner"
                >
                    {/* Target Area (Right) */}
                    <div className={`absolute right-0 top-0 bottom-0 w-32 bg-black h-full flex items-center justify-center ${shapeClass}`}>
                        {/* Visual indicator */}
                    </div>

                    {/* Draggable Shape */}
                    <div
                        onMouseDown={handleStart}
                        onTouchStart={handleStart}
                        style={{
                            left: `${position}%`,
                            transition: isDragging ? 'none' : 'left 0.3s ease-out'
                        }}
                        className={`absolute top-0 bottom-0 w-24 h-full ${dragShapeBg} border-2 border-black cursor-grab active:cursor-grabbing shadow-xl z-20 flex items-center justify-center ${shapeClass}`}
                    >
                        {/* Optional Inner Detail */}
                        <div className={`w-4 h-4 ${dragInnerBg} opacity-50 ${shapeClass}`}></div>
                    </div>

                </div>

            </div>
        </div>
    );
};

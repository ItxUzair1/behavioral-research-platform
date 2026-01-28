import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { RewardModal } from '../common/RewardModal';
import { playTrialCompleteSound } from '../../utils/audio';

export const DraggingGame = ({ variant, participantId, phase, onComplete, onTrialEnd, currentTrial, totalTrials }) => {
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState(0);
    const [internalTrialCount, setInternalTrialCount] = useState(0);
    const [rewardData, setRewardData] = useState(null);

    // Draggable State
    const [position, setPosition] = useState(0); // 0 to 100 percentage
    const positionRef = useRef(0); // Ref to track position for event handlers
    const maxPosRef = useRef(0); // Ref to track maximum reachable position
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef(null);
    const handleRef = useRef(null);
    const [dragSuccess, setDragSuccess] = useState(false);

    const isGenuine = phase?.toLowerCase().includes('genuine');
    const isPreTraining = phase?.toLowerCase().includes('pre-training');
    const displayTrial = currentTrial || internalTrialCount;
    const displayMax = totalTrials || (isPreTraining ? 10 : 200);
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
        // Prevent default browser behavior (text selection, image drag)
        if (e.cancelable && e.type !== 'touchstart') {
            e.preventDefault();
        }

        if (rewardData) return; // Block input if showing reward
        setIsDragging(true);
    };

    const handleMove = (clientX) => {
        if (!isDragging || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const rawX = clientX - rect.left;
        const width = rect.width;

        // Dynamic Handle Width
        const handleWidthPx = handleRef.current ? handleRef.current.offsetWidth : 96;
        const handlePercent = (handleWidthPx / width) * 100;
        const maxPos = 100 - handlePercent;
        maxPosRef.current = maxPos;

        // Constrain
        let newPos = (rawX / width) * 100;

        // Center the drag on cursor? 
        // Previously rawX was used directly as 'left'. 
        // If we want the cursor to be in the middle of the handle, offset by half handle.
        // But the previous logic just used rawX. Let's stick to rawX to minimize behavioral change, 
        // essentially the cursor pulls the left edge.
        // If users complain about "grabbing the middle", we can adjust: newPos = ((rawX - handleWidthPx/2) / width) * 100

        if (newPos < 0) newPos = 0;
        if (newPos > maxPos) newPos = maxPos;

        setPosition(newPos);
        positionRef.current = newPos; // Update Ref
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        // Check Success Condition (Drag > 90% of AVAILABLE distance)
        // Use REFINED value from Ref
        const threshold = maxPosRef.current ? (maxPosRef.current * 0.90) : 75;
        if (positionRef.current > threshold) {
            handleSubmit(true);
        } else {
            // Snap back (too small to count)
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

        // Temporary success state to lock UI or animate
        setDragSuccess(true);

        try {
            const res = await api.submitTaskResult({
                participantId,
                taskType: 'dragging',
                condition: phase,
                variant,
                correct: isCorrect,
                selectedOption: selectedOptionLabel
            });

            if (res.success) {
                // Play success sound
                playTrialCompleteSound();

                setInternalTrialCount(res.trialsCompleted);

                // Log with authoritative data
                onTrialEnd(isCorrect, rt, selectedOptionLabel, {
                    reward: res.reward,
                    currentThreshold: res.currentThreshold
                });

                // Handle Reward Modal - Show regardless of phase if triggered
                if (res.reward) {
                    setRewardData({ amount: res.amount });
                    // If reward, we wait for modal close to reset
                } else {
                    // No reward, reset immediately
                    setDragSuccess(false);
                    setPosition(0);
                }

                // Handle Earnings Display
                if (showEarnings) {
                    setEarnings(res.totalEarnings);
                }
            }
        } catch (err) {
            console.error(err);
            onTrialEnd(isCorrect, rt, selectedOptionLabel, {});
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

            {/* Earnings Display Removed */}

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
                    className="w-full max-w-2xl h-24 md:h-32 bg-gray-300 border-4 border-gray-500 relative flex items-center shadow-inner select-none"
                >
                    {/* Target Area (Right) */}
                    <div className={`absolute right-0 top-0 bottom-0 w-14 md:w-32 bg-black h-full flex items-center justify-center ${shapeClass}`}>
                        {/* Visual indicator */}
                    </div>

                    {/* Draggable Shape */}
                    <div
                        ref={handleRef}
                        onMouseDown={handleStart}
                        onTouchStart={handleStart}
                        style={{
                            left: `${position}%`,
                            transition: isDragging ? 'none' : 'left 0.3s ease-out',
                            touchAction: 'none' // CRITICAL for mobile/tablet touches
                        }}
                        className={`absolute top-0 bottom-0 w-12 md:w-24 h-full ${dragShapeBg} border-2 border-black cursor-grab active:cursor-grabbing shadow-xl z-20 flex items-center justify-center touch-none ${shapeClass}`}
                    >
                        {/* Optional Inner Detail */}
                        <div className={`w-4 h-4 ${dragInnerBg} opacity-50 ${shapeClass}`}></div>
                    </div>

                </div>

            </div>
        </div>
    );
};

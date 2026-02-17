import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';

import { api } from '../../services/api';

export const Payout = ({ participantId, onReset, startingBalance }) => {
    const [earnings, setEarnings] = React.useState(0);
    const [email, setEmail] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('PayPal');

    const [status, setStatus] = React.useState('Loading...');
    const [isStudyComplete, setIsStudyComplete] = React.useState(false);
    const [daysCompleted, setDaysCompleted] = React.useState(0);

    const [submitting, setSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [isCompletedToday, setIsCompletedToday] = React.useState(false);

    // Calculate session earnings
    // NEW: Final Payout Logic
    // If study is complete: Total = Days * $5.00
    // If active: Show accumulated task earnings
    const finalPayoutAmount = isStudyComplete ? (daysCompleted * 5) : 0;

    // Display Logic
    const displayAmount = isStudyComplete ? finalPayoutAmount : Math.max(0, earnings - (startingBalance || 0));

    React.useEffect(() => {
        const fetchEarnings = async () => {
            if (participantId) {
                try {
                    const res = await api.getParticipant(participantId);
                    if (res.success && res.participant) {
                        setEarnings(res.participant.earnings || 0);
                        setIsStudyComplete(res.participant.study_complete);
                        setDaysCompleted(res.participant.days_completed);

                        // Check if completed TODAY
                        const lastDate = res.participant.last_completed_date;
                        const todayCompleted = lastDate && new Date(lastDate).toDateString() === new Date().toDateString();
                        setIsCompletedToday(todayCompleted);

                        if (res.participant.payoutInfo) {
                            setStatus(res.participant.payoutInfo.status);
                        } else {
                            setStatus('Not Requested');
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch earnings:", err);
                }
            }
        };
        fetchEarnings();
    }, [participantId]);

    const handleCompleteSession = async () => {
        setSubmitting(true);
        try {
            // Action: complete_session
            const res = await api.submitPayoutDetails(participantId, null, null, 'complete_session');
            if (res.success) {
                setMessage('Session saved successfully.');
                setIsCompletedToday(true);
            }
        } catch (err) {
            console.error("Session completion failed:", err);
            setMessage('Failed to save session. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitPayout = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Action: request_payout
            const res = await api.submitPayoutDetails(participantId, email, paymentMethod, 'request_payout');
            if (res.success) {
                setStatus('Pending');
                setMessage('Payout request submitted successfully.');
            }
        } catch (err) {
            console.error("Payout submission failed:", err);
            // Show backend error message (e.g., duplicate email)
            setMessage(err.message || 'Failed to submit payout request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto text-center">
            <div className="mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Session Completed!</h1>
                <p className="text-gray-500">Thank you for your participation.</p>
            </div>

            <Card className="text-left bg-white text-gray-900 border-2 border-gray-100 shadow-xl">
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-gray-600 text-xl font-bold mb-2 uppercase tracking-wide">
                            {isStudyComplete ? "Total Study Earnings" : "Session Earnings"}
                        </p>
                        <div className="text-6xl font-black tracking-tighter text-gray-900">
                            ${displayAmount.toFixed(2)}
                        </div>

                        {isStudyComplete ? (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                                <p className="font-bold mb-1">Surprise! 🎉</p>
                                <p className="text-sm">
                                    Regardless of your task performance, you earn a fixed rate of
                                    <span className="font-bold"> $5.00 </span>
                                    for every day you completed.
                                </p>
                                <p className="text-sm mt-2 font-mono">
                                    {daysCompleted} Days × $5.00 = ${finalPayoutAmount.toFixed(2)}
                                </p>
                            </div>
                        ) : (
                            startingBalance > 0 && (
                                <p className="text-gray-400 text-sm mt-2">
                                    (Total Balance: ${earnings.toFixed(2)})
                                </p>
                            )
                        )}
                    </div>
                </div>
            </Card>

            <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left">

                {/* Logic Branch: Study Complete vs Ongoing */}

                {!isStudyComplete ? (
                    <div className="text-center space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Daily Check-In</h3>
                        <p className="text-sm text-gray-600">
                            You have completed today's tasks. Please verify completion to save your progress.
                        </p>

                        {isCompletedToday ? (
                            <div className="bg-green-50 text-green-800 p-4 rounded-lg">
                                <p className="font-bold">✓ Progress Saved</p>
                                <p className="text-sm">Please return tomorrow for the next session.</p>
                            </div>
                        ) : (
                            <Button
                                onClick={handleCompleteSession}
                                disabled={submitting}
                                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
                            >
                                {submitting ? 'Saving...' : 'Finish & Save Session'}
                            </Button>
                        )}
                        {message && !isCompletedToday && <p className="text-red-500 text-sm">{message}</p>}
                    </div>
                ) : (
                    // STUDY IS COMPLETE: Show Payout Form or Status
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Withdraw Earnings</h3>

                        {status === 'Not Requested' && (
                            <form onSubmit={handleSubmitPayout} className="space-y-4">
                                <div className="text-left">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method
                                    </label>
                                    <div className="flex gap-4 mb-4">
                                        {/* Same Radio Buttons */}
                                        <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'PayPal' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="PayPal"
                                                    checked={paymentMethod === 'PayPal'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="text-green-600 focus:ring-green-500"
                                                />
                                                <span className="font-medium text-gray-900">PayPal</span>
                                            </div>
                                        </label>
                                        <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'Amazon Gift Card' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value="Amazon Gift Card"
                                                    checked={paymentMethod === 'Amazon Gift Card'}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="text-green-600 focus:ring-green-500"
                                                />
                                                <span className="font-medium text-gray-900">Amazon Card</span>
                                            </div>
                                        </label>
                                    </div>

                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {paymentMethod === 'PayPal' ? 'PayPal Email Address' : 'Email Address for Gift Card'}
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900"
                                        placeholder="name@example.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        We will send your {paymentMethod} to this email.
                                    </p>
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full">
                                    {submitting ? 'Submitting...' : 'Request Payout'}
                                </Button>
                                {message && <p className="text-red-600 text-sm">{message}</p>}
                            </form>
                        )}

                        {/* Pending / Paid Status Blocks exist in previous code, assume rendered if active */}
                        {status === 'Pending' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                                <p className="font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                    Payout Pending
                                </p>
                                <p className="text-sm mt-1">
                                    Your request has been received. Please allow 24-48 hours for processing.
                                </p>
                            </div>
                        )}

                        {status === 'Paid' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                                <p className="font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Payment Sent
                                </p>
                                <p className="text-sm mt-1">
                                    Funds have been sent to your {paymentMethod || 'PayPal'} account.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-gray-200">
                <Button
                    variant="outline"
                    onClick={onReset}
                    className="w-full"
                >
                    Log Out / Return to Home
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                    Click here if you are done for the day or want to start a new participant.
                </p>
            </div>
        </div >
    );
};

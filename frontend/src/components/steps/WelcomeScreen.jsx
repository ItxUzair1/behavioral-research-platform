import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const WelcomeScreen = ({ onStartNew, onResume }) => {
    const [isEnrolled, setIsEnrolled] = useState(() => !!localStorage.getItem('brp_enrolled'));
    const [mode, setMode] = useState('selection'); // 'selection' or 'returning'
    const [participantId, setParticipantId] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');

    const handleValidate = async (e) => {
        e.preventDefault();
        const pid = participantId.trim().toUpperCase(); // Normalize
        if (!pid) return;

        setIsValidating(true);
        setError('');

        try {
            const data = await api.validateParticipant(pid);
            if (data.success) {
                // Pass all relevant data to App.jsx to restore state
                onResume(data);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Invalid Participant ID");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome</h1>
                    <p className="text-gray-600">Behavioral Research Study</p>
                </div>

                <Card className="p-8 shadow-xl border-t-4 border-t-blue-600">
                    {mode === 'selection' ? (
                        <div className="space-y-4">
                            {isEnrolled ? (
                                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 font-semibold mb-2">Study In Progress</p>
                                    <p className="text-sm text-yellow-700 mb-3">
                                        According to our records, a study was already started on this device.
                                        Please use <span className="font-bold">Returning Participant</span>.
                                    </p>
                                    <Button
                                        disabled
                                        className="w-full h-16 text-lg flex items-center justify-center gap-3 bg-gray-300 cursor-not-allowed"
                                    >
                                        <UserPlus className="w-6 h-6" />
                                        Start New Study
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={onStartNew}
                                    className="w-full h-16 text-lg flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700"
                                >
                                    <UserPlus className="w-6 h-6" />
                                    Start New Study
                                </Button>
                            )}

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className={isEnrolled ? "hidden" : "flex-shrink mx-4 text-gray-400 text-sm"}>Or</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setMode('returning')}
                                className="w-full h-16 text-lg flex items-center justify-center gap-3 border-2"
                            >
                                <LogIn className="w-6 h-6" />
                                Returning Participant
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
                                <p className="text-gray-500 text-sm">Enter your Participant ID to continue.</p>
                            </div>

                            <form onSubmit={handleValidate} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={participantId}
                                        onChange={(e) => {
                                            setParticipantId(e.target.value.toUpperCase());
                                            setError('');
                                        }}
                                        placeholder="e.g. PX7K29LMQ"
                                        className="w-full px-4 py-3 text-center text-2xl font-mono tracking-wider border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                                        autoFocus
                                    />
                                    {error && (
                                        <div className="mt-2 flex items-center justify-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        type="submit"
                                        disabled={!participantId.trim() || isValidating}
                                        className="w-full py-4 text-lg"
                                    >
                                        {isValidating ? 'Checking...' : 'Continue Study'}
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('selection');
                                            setError('');
                                            setParticipantId('');
                                        }}
                                        className="w-full text-gray-500 hover:text-gray-700 text-sm underline"
                                    >
                                        Back to Menu
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const Consent = ({ onNext }) => {
    const [loading, setLoading] = useState(false);
    const [consentGiven, setConsentGiven] = useState(null);
    const [newParticipantData, setNewParticipantData] = useState(null);
    const [confirmedId, setConfirmedId] = useState(false);

    const handleAgree = async () => {
        if (!consentGiven) return;

        setLoading(true);
        try {
            const data = await api.createParticipant();
            setNewParticipantData(data); // Store data, don't proceed yet
        } catch (error) {
            console.error("Consent Error:", error);
            alert("Failed to initialize session. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleProceed = () => {
        if (newParticipantData && confirmedId) {
            onNext(
                newParticipantData.participantId,
                newParticipantData.conditionOrder,
                null,
                newParticipantData.startingBalance || 0,
                newParticipantData.sessionNumber || 1
            );
        }
    };

    if (newParticipantData) {
        return (
            <div className="max-w-xl mx-auto space-y-8 pt-10">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registration Complete</h1>
                    <p className="text-gray-600">Your participant account has been created.</p>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 shadow-sm space-y-6">
                    <div className="text-center space-y-2">
                        <p className="font-semibold text-yellow-900 uppercase tracking-wide text-sm">Your Participant ID</p>
                        <div className="text-4xl font-mono font-bold text-gray-900 bg-white py-4 px-6 rounded-lg border border-yellow-200 inline-block tracking-wider">
                            {newParticipantData.participantId}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800 leading-relaxed">
                        <p className="font-bold mb-1">IMPORTANT:</p>
                        <p>Please save this ID immediately. You will need to enter this exact ID to continue the study on future days. We cannot recover it for you.</p>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-start gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-400"
                                checked={confirmedId}
                                onChange={(e) => setConfirmedId(e.target.checked)}
                            />
                            <span className="font-medium text-gray-900">
                                I have saved my Participant ID and understand I will need it later.
                            </span>
                        </label>
                    </div>

                    <Button
                        onClick={handleProceed}
                        disabled={!confirmedId}
                        className="w-full text-lg py-4"
                    >
                        Continue to Study
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Research Study Consent</h1>
            </div>

            <Card className="border-t-4 border-t-gray-900">
                <div className="prose prose-gray max-w-none text-gray-600">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Informed Consent Form</span>
                    </div>

                    <p className="text-lg leading-relaxed">
                        You are invited to take part in a research study on how people respond. During this study you will perform several short computer tasks. Participation is voluntary, and you may withdraw at any time without penalty. You will be compensated based on your performance on the tasks, up to a total of $5. Your responses will be anonymous and will be used only for research purposes.
                    </p>

                    <div className="mt-8 space-y-4">
                        <p className="font-semibold text-gray-900">Please indicate below whether you consent to participate.</p>

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="consent"
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    checked={consentGiven === true}
                                    onChange={() => setConsentGiven(true)}
                                />
                                <span className="text-gray-900">I have read and understand the information. I consent to participate in this study.</span>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="consent"
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    checked={consentGiven === false}
                                    onChange={() => setConsentGiven(false)}
                                />
                                <span className="text-gray-900">I do not consent to participate.</span>
                            </label>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex justify-center pt-4">
                <Button
                    onClick={handleAgree}
                    disabled={loading || !consentGiven}
                    className="w-64 text-lg py-6"
                >
                    {loading ? 'Initializing...' : 'Start Experiment'}
                </Button>
            </div>
        </div>
    );
};

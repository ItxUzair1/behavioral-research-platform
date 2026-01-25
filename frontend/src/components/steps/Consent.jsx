import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const Consent = ({ onNext }) => {
    const [loading, setLoading] = useState(false);
    const [consentGiven, setConsentGiven] = useState(null);

    const handleAgree = async () => {
        if (!consentGiven) return;

        setLoading(true);
        try {
            const data = await api.createParticipant();
            onNext(data.participantId, data.conditionOrder);
        } catch (error) {
            console.error("Consent Error:", error);
            alert("Failed to initialize session. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

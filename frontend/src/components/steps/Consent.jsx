import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ScrollText, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const Consent = ({ onNext }) => {
    const [loading, setLoading] = useState(false);

    const handleAgree = async () => {
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
                <p className="text-gray-500">Please review the following information carefully before proceeding.</p>
            </div>

            <Card className="max-h-[60vh] overflow-y-auto border-t-4 border-t-gray-900">
                <div className="prose prose-gray max-w-none text-gray-600">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
                        <ShieldCheck className="w-5 h-5" />
                        <span>Informed Consent Form</span>
                    </div>

                    <p>
                        You are invited to participate in a research study regarding decision-making under uncertainty.
                        This study is conducted by the Behavioral Research Lab.
                    </p>

                    <h3>Procedure</h3>
                    <p>
                        If you agree to participate, you will be asked to complete a series of tasks involving
                        cognitive puzzles and resource allocation decisions. The entire session will take approximately 15 minutes.
                    </p>

                    <h3>Risks and Benefits</h3>
                    <p>
                        There are no known risks associated with this study beyond those encountered in daily life.
                        Benefits include a monetary payment based on your performance and a fixed participation fee.
                    </p>

                    <h3>Confidentiality</h3>
                    <p>
                        Your responses will be anonymous. We will not collect any personally identifiable information
                        other than what is required for payment processing.
                    </p>

                    <h3>Voluntary Participation</h3>
                    <p>
                        Your participation is voluntary. You may withdraw at any time without penalty.
                    </p>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-8 text-sm">
                        <p className="font-mono text-xs text-gray-400 mb-1">SYSTEM NOTE</p>
                        <p>A unique participant ID will be legally assigned to you upon clicking "Agree".</p>
                    </div>
                </div>
            </Card>

            <div className="flex justify-center gap-4 pt-4">
                <Button variant="secondary" onClick={() => alert('You have declined to participate.')}>
                    I Disagree
                </Button>
                <Button onClick={handleAgree} disabled={loading} className="w-48">
                    {loading ? 'Initializing...' : 'I Agree & Begin'}
                </Button>
            </div>
        </div>
    );
};

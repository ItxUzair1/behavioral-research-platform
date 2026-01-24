import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';

import { api } from '../../services/api';

export const Payout = ({ onReset, participantId }) => {
    const [earnings, setEarnings] = React.useState(0);

    React.useEffect(() => {
        const fetchEarnings = async () => {
            if (participantId) {
                try {
                    const res = await api.getParticipant(participantId);
                    if (res.success && res.participant) {
                        setEarnings(res.participant.earnings || 0);
                    }
                } catch (err) {
                    console.error("Failed to fetch earnings:", err);
                }
            }
        };
        fetchEarnings();
    }, [participantId]);

    const handleDownload = async () => {
        if (!participantId) return;
        try {
            const res = await api.getParticipant(participantId);
            if (res.success && res.participant) {
                // Filter out internal state not needed for analysis
                const exportData = { ...res.participant };
                delete exportData.reinforcementState;

                // Transform Opt-Out Stats keys
                if (exportData.optOutStats) {
                    const newStats = {};
                    for (const [key, val] of Object.entries(exportData.optOutStats)) {
                        newStats[key] = {
                            "Opt-Out Latency": val.latency,
                            "Opt-Out Count": val.count
                        };
                    }
                    exportData.optOutStats = newStats;
                }

                const json = JSON.stringify(exportData, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Participant_${participantId}_Data.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to download data.");
        }
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto text-center">
            <div className="mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Study Completed!</h1>
                <p className="text-gray-500">Thank you for your participation.</p>
            </div>

            <Card className="text-left bg-white text-gray-900 border-2 border-gray-100 shadow-xl">
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-gray-600 text-xl font-bold mb-2 uppercase tracking-wide">Total Earnings</p>
                        <div className="text-6xl font-black tracking-tighter text-gray-900">
                            ${earnings.toFixed(2)}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                <p className="text-sm text-gray-500">
                    Your payment code has been generated. <br />
                    Please copy this code to MTurk/Prolific to verify completion.
                </p>

                <div className="flex gap-2">
                    <code className="flex-1 bg-white border border-gray-200 rounded-lg p-3 font-mono text-lg text-gray-900 tracking-widest text-center select-all">
                        C-8F29A10X
                    </code>
                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText("C-8F29A10X")}>
                        Copy
                    </Button>
                </div>

                <div className="pt-8">
                    <Button variant="outline" className="text-sm w-full font-bold" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Full Study Data (JSON)
                    </Button>
                </div>

                {onReset && (
                    <div className="pt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={onReset}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            Start New Experiment
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

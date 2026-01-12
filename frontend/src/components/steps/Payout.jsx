import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';

export const Payout = () => {
    return (
        <div className="space-y-6 max-w-lg mx-auto text-center">
            <div className="mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Study Completed!</h1>
                <p className="text-gray-500">Thank you for your participation.</p>
            </div>

            <Card className="text-left bg-gray-900 text-white border-none shadow-xl">
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Total Earnings</p>
                        <div className="text-5xl font-extrabold tracking-tighter">
                            $7.50
                        </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-gray-800">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Base Pay</span>
                            <span className="font-mono">$2.50</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Performance Bonus</span>
                            <span className="font-mono text-green-400">+$5.00</span>
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
                    <Button variant="ghost" className="text-sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Participation Receipt
                    </Button>
                </div>
            </div>
        </div>
    );
};

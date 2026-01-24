import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ClipboardList, Send } from 'lucide-react';
import { api } from '../../services/api';

export const PostSurvey = ({ onNext, participantId }) => {
    const [loading, setLoading] = useState(false);
    const [responses, setResponses] = useState({
        instructionsClarity: "",
        feltRushed: "",
        feedback: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setResponses(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!participantId) {
            console.error("No participant ID found");
            onNext();
            return;
        }

        setLoading(true);
        try {
            await api.updateParticipant(participantId, {
                postSurvey: {
                    ...responses,
                    timestamp: new Date()
                }
            });
            onNext();
        } catch (error) {
            console.error("Failed to submit survey:", error);
            // Optional: Show error to user, but for now we might just proceed or alert
            alert("Failed to save responses. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Post-Study Survey</h1>
                <p className="text-gray-500">Please answer a few final questions about your experience.</p>
            </div>

            <Card>
                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-4 mb-6">
                    <ClipboardList className="w-5 h-5" />
                    <span>Participant Feedback</span>
                </div>

                <div className="space-y-8">
                    {/* Question 1 */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-900">
                            1. How clear were the instructions provided during the tasks?
                        </label>
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5].map((val) => (
                                <label key={val} className="flex-1">
                                    <input
                                        type="radio"
                                        name="instructionsClarity"
                                        value={val}
                                        checked={responses.instructionsClarity === String(val)}
                                        onChange={handleChange}
                                        className="peer sr-only"
                                    />
                                    <div className="h-10 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 transition-all">
                                        {val}
                                    </div>
                                    <span className="block text-[10px] text-center mt-1 text-gray-400 peer-checked:text-gray-900">
                                        {val === 1 ? 'Unclear' : val === 5 ? 'Very Clear' : ''}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question 2 */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-900">
                            2. Did you feel rushed while making your decisions?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="feltRushed"
                                    value="Yes"
                                    checked={responses.feltRushed === "Yes"}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="p-3 border border-gray-200 rounded-xl text-center hover:bg-gray-50 peer-checked:border-gray-900 peer-checked:bg-gray-50 peer-checked:ring-1 peer-checked:ring-gray-900 transition-all">
                                    Yes
                                </div>
                            </label>
                            <label className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="feltRushed"
                                    value="No"
                                    checked={responses.feltRushed === "No"}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="p-3 border border-gray-200 rounded-xl text-center hover:bg-gray-50 peer-checked:border-gray-900 peer-checked:bg-gray-50 peer-checked:ring-1 peer-checked:ring-gray-900 transition-all">
                                    No
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Question 3 */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-900">
                            3. Any additional feedback? (Optional)
                        </label>
                        <textarea
                            name="feedback"
                            value={responses.feedback}
                            onChange={handleChange}
                            rows={4}
                            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-gray-900 focus:ring-0 resize-none"
                            placeholder="Type your response here..."
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
                            {loading ? 'Submitting...' : (
                                <>
                                    Submit Responses
                                    <Send className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

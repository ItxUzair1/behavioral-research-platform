import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Send, Trophy, BarChart, Activity, Heart } from 'lucide-react';
import { api } from '../../services/api';

const CONDITIONS = [
    { id: 'Genuine', label: 'Green Arrangement (Genuine)', color: 'bg-green-100 border-green-500', iconColor: 'text-green-600' },
    { id: 'Apparent', label: 'Purple Arrangement (Apparent)', color: 'bg-purple-100 border-purple-500', iconColor: 'text-purple-600' },
    { id: 'Coercion', label: 'Orange Arrangement (Coercion)', color: 'bg-orange-100 border-orange-500', iconColor: 'text-orange-600' }
];

export const PostSurvey = ({ onNext, participantId }) => {
    const [loading, setLoading] = useState(false);

    // State for questions
    const [preferenceRanking, setPreferenceRanking] = useState([...CONDITIONS]);
    const [demandRanking, setDemandRanking] = useState([...CONDITIONS]);
    const [controlChoice, setControlChoice] = useState(null);
    const [emotions, setEmotions] = useState({
        Genuine: 50,
        Apparent: 50,
        Coercion: 50
    });

    // --- Drag and Drop Logic ---
    const handleDragStart = (e, index, listType) => {
        e.dataTransfer.setData('sourceIndex', index);
        e.dataTransfer.setData('listType', listType);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, dropIndex, listType, listData, setList) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));
        const sourceList = e.dataTransfer.getData('listType');

        if (sourceList !== listType) return;
        if (sourceIndex === dropIndex) return;

        const newList = [...listData];
        const [movedItem] = newList.splice(sourceIndex, 1);
        newList.splice(dropIndex, 0, movedItem);
        setList(newList);
    };

    // --- Submission ---
    const handleSubmit = async () => {
        if (!participantId) {
            console.error("No participant ID found");
            onNext();
            return;
        }

        if (!controlChoice) {
            alert("Please select the arrangement where you felt the most control.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                postSurvey: {
                    preferenceRanking: preferenceRanking.map(c => c.label),
                    demandRanking: demandRanking.map(c => c.label),
                    senseOfControl: controlChoice,
                    emotionalResponse: {
                        genuine: emotions.Genuine,
                        apparent: emotions.Apparent,
                        coercion: emotions.Coercion
                    },
                    timestamp: new Date()
                }
            };

            await api.updateParticipant(participantId, payload);
            onNext();
        } catch (error) {
            console.error("Failed to submit survey:", error);
            alert("Failed to save responses. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Helpers ---
    const renderDraggableList = (items, setItems, listType) => (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, listType)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, listType, items, setItems)}
                    className={`p-4 border-2 rounded-lg cursor-grab active:cursor-grabbing shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${item.color}`}
                >
                    <span className="font-bold text-gray-500 text-lg w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-300">
                        {index + 1}
                    </span>
                    <span className="font-medium text-gray-800">{item.label}</span>
                </div>
            ))}
            <p className="text-xs text-gray-400 text-center italic mt-2">Drag items to reorder</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-12">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Post-Study Survey</h1>
                <p className="text-gray-500">Please answer the following questions about your experience.</p>
            </div>

            {/* 1. Preference Ranking */}
            <Card>
                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-4 mb-6">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>1. Preference Ranking</span>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                    Rank the three arrangements from <strong>Most Preferred</strong> (top) to <strong>Least Preferred</strong> (bottom).
                </p>
                {renderDraggableList(preferenceRanking, setPreferenceRanking, 'preference')}
            </Card>

            {/* 2. Perceived Demand Ranking */}
            <Card>
                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-4 mb-6">
                    <BarChart className="w-5 h-5 text-blue-500" />
                    <span>2. Perceived Difficulty Ranking</span>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                    Rank the three arrangements from <strong>Easiest / Least Demanding</strong> (top) to <strong>Hardest / Most Demanding</strong> (bottom).
                </p>
                {renderDraggableList(demandRanking, setDemandRanking, 'demand')}
            </Card>

            {/* 3. Sense of Control */}
            <Card>
                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-4 mb-6">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>3. Sense of Control</span>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                    In which arrangement did you feel the <strong>most control</strong> over whether to continue?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CONDITIONS.map((cond) => (
                        <button
                            key={cond.id}
                            onClick={() => setControlChoice(cond.label)}
                            className={`p-4 border-2 rounded-xl text-center transition-all ${controlChoice === cond.label
                                    ? 'ring-4 ring-offset-2 ring-blue-400 border-blue-600 bg-blue-50 scale-105'
                                    : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`w-full h-12 mb-2 rounded ${cond.color}`}></div>
                            <span className="font-medium text-sm text-gray-800">{cond.label}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* 4. Emotional Response Sliders */}
            <Card>
                <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-4 mb-6">
                    <Activity className="w-5 h-5 text-pink-500" />
                    <span>4. Emotional Response</span>
                </div>
                <p className="mb-6 text-sm text-gray-600">
                    For each arrangement, how did you feel?
                    <br />
                    <span className="text-xs text-gray-500">(0 = Discouraged/Stressed, 100 = Confident/Relaxed)</span>
                </p>

                <div className="space-y-8">
                    {CONDITIONS.map((cond) => (
                        <div key={cond.id} className="space-y-2">
                            <label className="flex justify-between items-center text-sm font-medium text-gray-800">
                                <span>{cond.label}</span>
                                <span className={`font-mono font-bold ${cond.iconColor}`}>{emotions[cond.id]}</span>
                            </label>
                            <div className={`p-4 rounded-lg bg-gray-50 border border-gray-100 ${cond.color.split(' ')[0]}`}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={emotions[cond.id]}
                                    onChange={(e) => setEmotions(prev => ({ ...prev, [cond.id]: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">
                                    <span>Stressed</span>
                                    <span>Neutral</span>
                                    <span>Relaxed</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="pt-4 flex justify-end">
                <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto text-lg py-3 px-8">
                    {loading ? 'Submitting...' : (
                        <>
                            Submit Survey
                            <Send className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

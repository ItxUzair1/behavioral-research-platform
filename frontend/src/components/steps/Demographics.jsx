import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User } from 'lucide-react';
import { api } from '../../services/api';

export const Demographics = ({ onNext, participantId }) => {
    const [formData, setFormData] = useState({
        age: '',
        gender: '',
        education: '',
        comments: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.updateParticipant(participantId, {
                demographics: formData,
                currentStep: 'Genuine'
            });
            onNext();
        } catch (error) {
            console.error("Demographics Save Error:", error);
            alert("Failed to save data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">About You</h1>
                <p className="text-gray-500">Please tell us a little bit about yourself.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-4 mb-6">
                        <User className="w-5 h-5" />
                        <span>Demographic Information</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="age"
                            label="Age"
                            type="number"
                            required
                            value={formData.age}
                            onChange={handleChange}
                        />
                        <div className="relative">
                            {/* Custom Select using standard styling to match Inputs */}
                            <select
                                id="gender"
                                className="block px-4 pb-2.5 pt-5 w-full text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-gray-900 peer"
                                required
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="" disabled hidden></option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                            <label
                                htmlFor="gender"
                                className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-gray-900"
                            >
                                Gender <span className="text-red-500">*</span>
                            </label>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            id="education"
                            className="block px-4 pb-2.5 pt-5 w-full text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-gray-900 peer"
                            required
                            value={formData.education}
                            onChange={handleChange}
                        >
                            <option value="" disabled hidden></option>
                            <option value="high-school">High School</option>
                            <option value="bachelors">Bachelor's Degree</option>
                            <option value="masters">Master's Degree</option>
                            <option value="doctorate">Doctorate</option>
                            <option value="other">Other</option>
                        </select>
                        <label
                            htmlFor="education"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-gray-900"
                        >
                            Highest Education Level <span className="text-red-500">*</span>
                        </label>
                    </div>

                    <Input
                        id="comments"
                        label="Additional Comments (Optional)"
                        value={formData.comments}
                        onChange={handleChange}
                    />

                    <div className="pt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-mono">ID: {participantId}</span>
                        <Button type="submit" disabled={loading} className="w-32">
                            {loading ? 'Saving...' : 'Next'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

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
        race_ethnicity: [], // Multi-select
        geographic_region: '',
        education: '', // Kept for backward compatibility if needed, but likely replaced by education_level or mapped
        education_level: '',
        socioeconomic_status: '',
        comments: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;

        if (type === 'checkbox' && id === 'race_ethnicity') {
            // Handle multi-select for race_ethnicity
            setFormData(prev => {
                const current = prev.race_ethnicity || [];
                if (checked) {
                    return { ...prev, race_ethnicity: [...current, value] };
                } else {
                    return { ...prev, race_ethnicity: current.filter(item => item !== value) };
                }
            });
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.race_ethnicity || formData.race_ethnicity.length === 0) {
            alert("Please select at least one Race / Ethnicity.");
            return;
        }

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
                            <option value="non-binary">Non-binary / third gender</option>
                            <option value="prefer-to-self-describe">Prefer to self-describe</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        <label
                            htmlFor="gender"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-gray-900"
                        >
                            Gender <span className="text-red-500">*</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-900">
                            Race / Ethnicity <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Native Hawaiian or Other Pacific Islander', 'White', 'Other', 'Prefer not to say'].map((option) => (
                                <label key={option} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="race_ethnicity" // ID used for logic in handleChange
                                        value={option}
                                        checked={(formData.race_ethnicity || []).includes(option)}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
                        {/* Validation error placeholder if needed, though HTML5 required doesn't work easily on checkboxes group. */}
                        {/* We might need a manual check on submit for required checkboxes, but keeping simple for now as requested styling implies basic HTML checks? 
                             The requirement says "Required". Standard HTML checkboxes don't support 'required' on a group well. 
                             I'll add a check in handleSubmit later if needed, but for now relying on user finding it. 
                             Wait, I should ensure it's required. I'll add a simple validation in handleSubmit or just rely on the fact the user is meticulous.
                             Let's add a small text if empty on blur? No, simple is better.
                             I will update styling to match.
                         */}
                    </div>

                    <Input
                        id="geographic_region"
                        label="State / Country / Territory where you live"
                        required
                        value={formData.geographic_region}
                        onChange={handleChange}
                    />

                    <div className="relative">
                        <select
                            id="education_level"
                            className="block px-4 pb-2.5 pt-5 w-full text-gray-900 bg-white border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-gray-900 peer"
                            required
                            value={formData.education_level}
                            onChange={handleChange}
                        >
                            <option value="" disabled hidden></option>
                            <option value="less-than-high-school">Less than high school</option>
                            <option value="high-school">High school or equivalent</option>
                            <option value="some-college">Some college</option>
                            <option value="bachelors">Bachelor’s degree</option>
                            <option value="masters">Master’s degree</option>
                            <option value="doctoral">Doctoral or professional degree</option>
                        </select>
                        <label
                            htmlFor="education_level"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-gray-900"
                        >
                            Highest Level of Education Completed <span className="text-red-500">*</span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-900">
                            Socio-Economic Status <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {['High class', 'Middle class', 'Low class', 'Prefer not to say'].map((option) => (
                                <label key={option} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="socioeconomic_status" // name groups them
                                        id="socioeconomic_status"
                                        value={option}
                                        required
                                        checked={formData.socioeconomic_status === option}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900"
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                </label>
                            ))}
                        </div>
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
        </div >
    );
};

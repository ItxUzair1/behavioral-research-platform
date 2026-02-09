import React from 'react';
import { Button } from '../ui/Button';

export const InstructionSlide = ({ message, onNext, buttonText = "Continue", bgColor = "bg-white" }) => {
    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${bgColor}`}>
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full text-center border-2 border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 font-serif">
                    {message}
                </h2>

                <Button
                    onClick={onNext}
                    className="px-8 py-3 text-xl w-full max-w-xs mx-auto"
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

import React from 'react';

export const RewardModal = ({ amount, onDismiss }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/10 backdrop-blur-[1px]">
            <div className="bg-[#4ADE80] border-4 border-black p-8 w-[400px] text-center shadow-2xl animate-in zoom-in duration-200">
                <p className="font-serif text-xl mb-6 text-black font-medium leading-tight">
                    You have earned some money!<br />Click "ok" to continue
                </p>
                <button
                    onClick={onDismiss}
                    className="bg-[#FF0000] text-black border-2 border-black px-10 py-2 uppercase font-sans text-lg font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

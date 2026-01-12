import React from 'react';

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    className = '',
    type = 'button'
}) => {
    const baseStyle = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg",
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        outline: "border-2 border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900"
    };

    return (
        <button
            type={type}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

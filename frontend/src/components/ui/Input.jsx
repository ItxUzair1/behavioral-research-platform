import React from 'react';

export const Input = ({
    label,
    id,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    error,
    className = ''
}) => {
    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <input
                    type={type}
                    id={id}
                    value={value}
                    onChange={onChange}
                    className={`
            block px-4 pb-2.5 pt-5 w-full text-gray-900 bg-white 
            border rounded-xl appearance-none focus:outline-none focus:ring-0 peer transition-colors
            ${error
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-gray-900'
                        }
          `}
                    placeholder=" "
                    required={required}
                />
                <label
                    htmlFor={id}
                    className={`
            absolute text-sm duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 
            peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
            peer-focus:scale-75 peer-focus:-translate-y-4
            ${error ? 'text-red-500' : 'text-gray-500 peer-focus:text-gray-900'}
          `}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

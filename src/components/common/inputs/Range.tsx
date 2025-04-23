import { useEffect, useState } from 'react';

export const Range = ({
    min,
    max,
    step,
    value,
    onChange,
    className = '',
}: {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
}) => {
    const [computedValue, setComputedValue] = useState(0);

    useEffect(() => {
        const computeValue = (value: number) => {
            const range = max - min;
            const percentage = (value - min) / range;
            return percentage * 100;
        };

        setComputedValue(computeValue(value));
    }, [max, min, value]);

    return (
        <div className="relative">
            <span
                className="absolute pointer-events-none z-50 text-black font-extrabold"
                style={{
                    left: `${computedValue}%`,
                    transform: `translateX(${-computedValue}%)`,
                }}
            >
                {Math.floor(value)}
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
            />
        </div>
    );
};

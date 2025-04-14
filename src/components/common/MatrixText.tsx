'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MatrixTextProps {
    minTimeToMatch?: number;
    maxTimeToMatch?: number;
    flickerInterval?: number;
    children: string;
    classNames?: string;
}

const MatrixText = ({
    children,
    classNames,
    minTimeToMatch = 300,
    maxTimeToMatch = 2000,
    flickerInterval = 15,
}: MatrixTextProps) => {
    const getRandomChar = (exclude: string): string => {
        const chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
        let newChar = exclude;
        while (newChar === exclude) {
            newChar = chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return newChar;
    };

    const headline = children.split('');
    const length = headline.length;

    const [displayText, setDisplayText] = useState<string[]>(() =>
        headline.map((ch) => (ch === ' ' ? ch : getRandomChar(ch))),
    );

    const displayRef = useRef(displayText); // holds latest state
    const statusRef = useRef<boolean[]>(headline.map((ch) => ch === ' '));
    const randomOpacities = useRef(headline.map(() => Math.random()));
    const timeToReveal = useRef<number[]>(
        Array.from(
            { length },
            () =>
                Math.random() * (maxTimeToMatch - minTimeToMatch) +
                minTimeToMatch,
        ),
    );
    const lastFlickerTime = useRef<number[]>(Array(length).fill(0));
    const animationFrame = useRef<number>();
    const startTime = useRef(performance.now());

    const animate = (time: number) => {
        const elapsed = time - startTime.current;
        const currentDisplay = [...displayRef.current];
        const currentStatus = [...statusRef.current];
        let hasChanged = false;

        for (let i = 0; i < length; i++) {
            if (currentStatus[i]) continue;

            const shouldReveal = elapsed >= timeToReveal.current[i];
            const timeSinceLastFlicker = time - lastFlickerTime.current[i];

            if (shouldReveal) {
                currentDisplay[i] = headline[i];
                currentStatus[i] = true;
                hasChanged = true;
            } else if (timeSinceLastFlicker > flickerInterval) {
                const newChar = getRandomChar(currentDisplay[i]);
                if (newChar !== currentDisplay[i]) {
                    currentDisplay[i] = newChar;
                    lastFlickerTime.current[i] = time;
                    hasChanged = true;
                }
            }
        }

        if (hasChanged) {
            displayRef.current = currentDisplay;
            statusRef.current = currentStatus;
            setDisplayText(currentDisplay);
        }

        if (!currentStatus.every(Boolean)) {
            animationFrame.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        animationFrame.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, []);

    return (
        <div className={classNames} style={{ fontFamily: 'monospace' }}>
            {displayText.map((char, index) => (
                <span
                    key={index}
                    style={{
                        opacity: statusRef.current[index]
                            ? 1
                            : randomOpacities.current[index],
                        willChange: 'opacity',
                        transition: statusRef.current.every(Boolean)
                            ? 'none'
                            : 'opacity 0.2s ease-in-out',
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
};

export default MatrixText;

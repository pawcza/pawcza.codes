'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MatrixTextProps {
    duration?: number;
    flickerInterval?: number;
    children: string;
    classNames?: string;
}

const MatrixText = ({
    children,
    classNames,
    duration,
    flickerInterval = 15,
}: MatrixTextProps) => {
    const getRandomChar = (exclude: string): string => {
        const chars =
            '0123456789#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let newChar = exclude;
        while (newChar === exclude) {
            newChar = chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return newChar;
    };

    const headline = children.split('');
    const length = headline.length;

    const effectiveDuration = duration ?? 500 + length * 20;

    const [displayText, setDisplayText] = useState<string[]>(() =>
        headline.map((ch) => (ch === ' ' ? ' ' : ch)),
    );

    const [hasStarted, setHasStarted] = useState(false);

    const displayRef = useRef(displayText);
    const statusRef = useRef<boolean[]>(headline.map((ch) => ch === ' '));
    const randomOpacities = useRef(headline.map(() => Math.random()));
    const lastFlickerTime = useRef<number[]>(Array(length).fill(0));
    const animationFrame = useRef<number>();
    const startTime = useRef<number>(performance.now());

    const timeToReveal = useRef<number[]>(
        headline.map((_, i) => (effectiveDuration / length) * i),
    );

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
                currentDisplay[i] = getRandomChar(currentDisplay[i] || ' ');
                lastFlickerTime.current[i] = time;
                hasChanged = true;
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
        // Delay visibility slightly so initial render shows nothing
        const frame = requestAnimationFrame(() => {
            setHasStarted(true);
            animationFrame.current = requestAnimationFrame(animate);
        });

        return () => {
            cancelAnimationFrame(frame);
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, []);

    return (
        <div
            className={classNames}
            style={{
                fontFamily: 'monospace',
                opacity: hasStarted ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
            }}
        >
            {displayText.map((char, index) => (
                <span
                    key={index}
                    style={{
                        opacity: statusRef.current[index]
                            ? 1
                            : randomOpacities.current[index],
                        willChange: 'opacity',
                        transition: statusRef.current[index]
                            ? 'opacity 0.2s ease-in-out'
                            : 'none',
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
};

export default MatrixText;

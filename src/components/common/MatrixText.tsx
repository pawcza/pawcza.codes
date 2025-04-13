'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MatrixTextProps {
    minTimeToMatch?: number;
    maxTimeToMatch?: number;
    minIntervalTime?: number;
    maxIntervalTime?: number;
    children: string;
    classNames?: string;
    infinite?: boolean;
    ordered?: boolean;
}

const MatrixText = ({
    children,
    classNames,
    infinite,
    ordered = false,
    minTimeToMatch = ordered ? 10 : 300,
    maxTimeToMatch = ordered ? 30 : 2000,
    minIntervalTime = ordered ? 10 : 30,
    maxIntervalTime = ordered ? 30 : 200,
}: MatrixTextProps) => {
    const getRandomChar = (): string => {
        const chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
        return chars.charAt(Math.floor(Math.random() * chars.length));
    };
    const headline = children.split('') || [];

    const [displayText, setDisplayText] = useState<string[]>(
        headline.map(() => (ordered ? '' : getRandomChar())),
    );
    const [status, setStatus] = useState<boolean[]>(
        headline.map(() => false), // false = animating, true = finished
    );

    const [height, setHeight] = useState<number>(0);

    const containerRef =
        useRef() as React.MutableRefObject<HTMLDivElement | null>;

    const calculateHeight = () => {
        if (containerRef.current) {
            const { height } = containerRef.current.getBoundingClientRect();
            setHeight(height);
        }
    };

    useEffect(() => {
        const intervalIds: NodeJS.Timeout[] = [];

        const animateText = (index: number) => {
            if (headline[index] === ' ') {
                setDisplayText((prev) => {
                    const newText = [...prev];
                    newText[index] = ' ';
                    return newText;
                });
                setStatus((prev) => {
                    const newStatus = [...prev];
                    newStatus[index] = true;
                    return newStatus;
                });
                return;
            }

            const intervalId = setInterval(
                () => {
                    setDisplayText((prev) => {
                        const newText = [...prev];
                        newText[index] = getRandomChar();
                        return newText;
                    });
                },
                Math.random() * (maxIntervalTime - minIntervalTime) +
                    minIntervalTime,
            );

            intervalIds.push(intervalId);

            if (infinite) {
                return;
            }

            setTimeout(
                () => {
                    clearInterval(intervalId);
                    setDisplayText((prev) => {
                        const newText = [...prev];
                        newText[index] = headline[index];
                        return newText;
                    });
                    setStatus((prev) => {
                        const newStatus = [...prev];
                        newStatus[index] = true;
                        return newStatus;
                    });

                    if (ordered && index < headline.length - 1) {
                        animateText(index + 1);
                    }
                },
                Math.random() * (maxTimeToMatch - minTimeToMatch) +
                    minTimeToMatch,
            );
        };

        calculateHeight();

        if (ordered) {
            animateText(0);
        } else {
            headline.forEach((_, index) => {
                animateText(index);
            });
        }

        return () => {
            intervalIds.forEach(clearInterval);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`${classNames}`}
            style={{
                height: height ? `${height}px` : 'auto',
                fontFamily: 'monospace',
            }}
        >
            {displayText.map((char, index) => (
                <span
                    key={index}
                    style={{
                        opacity: status[index] ? 1 : Math.random(),
                        transition:
                            status.filter((status) => status).length ===
                            headline.length
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

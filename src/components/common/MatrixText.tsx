'use client';

import { useEffect, useState } from 'react';

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

    useEffect(() => {
        const intervalIds: NodeJS.Timeout[] = [];

        const animateText = (index: number) => {
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

                    if (ordered && index < headline.length - 1) {
                        animateText(index + 1);
                    }
                },
                Math.random() * (maxTimeToMatch - minTimeToMatch) +
                    minTimeToMatch,
            );
        };

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

    return <div className={`monospace-font ${classNames}`}>{displayText}</div>;
};

export default MatrixText;

'use client';

import { useEffect, useState } from 'react';

/**
 * Fires as the loader starts fading out. Anything that reveals on load
 * waits for this, otherwise it plays out of sight behind the loader and is
 * already finished by the time the page is visible.
 */

let done = false;
const listeners = new Set<() => void>();

export const markIntroDone = () => {
    if (done) return;
    done = true;
    listeners.forEach((listener) => listener());
    listeners.clear();
};

export const useIntroDone = () => {
    // Always false on the server, so nothing starts before hydration.
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (done) {
            setReady(true);
            return;
        }

        const listener = () => setReady(true);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    return ready;
};

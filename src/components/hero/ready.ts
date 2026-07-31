/**
 * Tiny signal so the loader can wait for the tile field's first painted frame
 * rather than guessing with a timeout.
 */

let painted = false;
const listeners = new Set<() => void>();

export const markHeroPainted = () => {
    if (painted) return;
    painted = true;
    listeners.forEach((listener) => listener());
    listeners.clear();
};

export const whenHeroPainted = () =>
    new Promise<void>((resolve) => {
        if (painted) {
            resolve();
            return;
        }
        listeners.add(resolve);
    });

/**
 * The hero arrives in order: the field builds in first, then the title and
 * its line resolve, then the cube grows in. The field says when it is done;
 * anything waiting on it also gives up after a while, so a field that never
 * plays (no WebGL2, the page opened further down) holds nothing back for long.
 */
let built = false;
const waiting = new Set<() => void>();

/** Longest anything waits for the field, in ms. */
const GIVE_UP = 4000;

export const markFieldBuilt = () => {
    if (built) return;
    built = true;
    waiting.forEach((run) => run());
    waiting.clear();
};

/** Runs once the field has built in (or at once if it has); returns a cancel. */
export const afterFieldBuilt = (run: () => void) => {
    if (built) {
        run();
        return () => {};
    }
    const once = () => {
        clearTimeout(timer);
        waiting.delete(once);
        run();
    };
    const timer = setTimeout(once, GIVE_UP);
    waiting.add(once);
    return () => {
        clearTimeout(timer);
        waiting.delete(once);
    };
};

export const fieldBuilt = () => built;

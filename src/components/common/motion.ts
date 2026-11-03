/**
 * The page has one look for every machine; the only switch is the visitor's
 * own reduced-motion setting, which holds the heavy motion still (the field,
 * the cube's drift, the builds and scrambles) and shows everything at once.
 */
export const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs in a task of its own after the next paint. Creating a WebGL context can
 * block for hundreds of milliseconds; inside hydration that all lands in one
 * long task, with the title still waiting behind it.
 */
export const afterPaint = (work: () => void) => {
    let timer: ReturnType<typeof setTimeout>;
    const frame = requestAnimationFrame(() => {
        timer = setTimeout(work);
    });
    return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
    };
};

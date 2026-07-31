'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import MatrixText from '@/components/common/MatrixText';
import { markIntroDone } from '@/components/common/intro';
import { whenHeroPainted } from '@/components/hero/ready';

/** Held long enough that the loader never flashes on a fast connection. */
const MIN_VISIBLE = 320;
/** Never trap the page behind a stalled font or a canvas that failed. */
const HARD_TIMEOUT = 2500;
const REVEAL = 380;

type Phase = 'scrambling' | 'revealing' | 'gone';

/**
 * Covers the brief window between first paint and hydration, where the tile
 * canvas has not drawn yet and the server-rendered MatrixText is sitting
 * frozen on a random set of characters.
 */
const Loader = () => {
    const [phase, setPhase] = useState<Phase>('scrambling');

    useEffect(() => {
        const startedAt = performance.now();
        let cancelled = false;
        // Whichever of the ready-promise and the fallback timer wins, the
        // other must not run: a second pass would push `phase` back to
        // `revealing` and remount the whole overlay.
        let started = false;

        const finish = () => {
            if (cancelled || started) return;
            started = true;
            window.clearTimeout(fallback);

            const wait = Math.max(
                0,
                MIN_VISIBLE - (performance.now() - startedAt),
            );

            window.setTimeout(() => {
                if (cancelled) return;
                setPhase('revealing');
                window.setTimeout(() => {
                    if (!cancelled) setPhase('gone');
                }, REVEAL + 120);
            }, wait);
        };

        Promise.all([
            whenHeroPainted(),
            document.fonts ? document.fonts.ready : Promise.resolve(),
        ]).then(finish);

        const fallback = window.setTimeout(finish, HARD_TIMEOUT);

        return () => {
            cancelled = true;
            window.clearTimeout(fallback);
        };
    }, []);

    // Nothing behind the loader should scroll while it is up.
    useEffect(() => {
        if (phase === 'gone') return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [phase]);

    return (
        <AnimatePresence onExitComplete={markIntroDone}>
            {phase !== 'gone' && (
                <motion.div
                    className="site-loader fixed inset-0 z-[100] flex items-center justify-center bg-paper"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    role="status"
                    aria-label="Loading"
                >
                    <MatrixText
                        hasStarted={phase === 'revealing'}
                        duration={REVEAL}
                        classNames="text-sm font-medium tracking-tight text-ink-muted md:text-base"
                    >
                        pawcza.codes
                    </MatrixText>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Loader;

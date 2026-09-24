'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

import { Close, Sliders } from '@/components/common/Icons';
import { useScrollLock } from '@/components/common/scrollLock';
import { useTileSettings } from '@/components/hero/TileSettings';
import { mountCubeToy } from '@/components/cube/cubeToy';

/**
 * The cube, full-screen: opened by clicking either toy cube, over a dimmed
 * and blurred page, with the settings docked beside it. Drag anywhere to
 * spin, scroll or pinch to zoom; a click off the cube, the close button or
 * Escape brings the page back.
 */
const CubeView = () => {
    const settings = useTileSettings();
    const {
        cubeView: open,
        setCubeView,
        controlsOpen,
        setControlsOpen,
        controlsAnchor,
    } = settings;
    const docked = controlsOpen && controlsAnchor === 'view';

    useScrollLock(open);
    // Rendered into <body>, which only exists once mounted in the browser.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setCubeView(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, setCubeView]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="The cube, full-screen"
                    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    <Stage
                        settings={settings}
                        docked={docked}
                        onClose={() => setCubeView(false)}
                    />

                    <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
                        <button
                            type="button"
                            onClick={() =>
                                setControlsOpen(!controlsOpen, 'view')
                            }
                            aria-expanded={controlsOpen}
                            title="Settings"
                            className={`glass-pill btn-icon ${
                                controlsOpen
                                    ? '!text-ink ring-1 ring-inset ring-ink/30'
                                    : ''
                            }`}
                        >
                            <Sliders width={15} height={15} />
                            <span className="sr-only">Settings</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setCubeView(false)}
                            title="Close (Esc)"
                            className="glass-pill btn-icon"
                            autoFocus
                        >
                            <Close width={15} height={15} />
                            <span className="sr-only">Close the cube</span>
                        </button>
                    </div>

                    <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-micro text-white/60">
                        Drag to spin · scroll or pinch to zoom · click beside it
                        or Esc to close
                    </p>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};

/** The canvas and what it listens on: the whole screen. */
const Stage = ({
    settings,
    docked,
    onClose,
}: {
    settings: ReturnType<typeof useTileSettings>;
    /** The settings are docked beside it: keep the cube clear of them. */
    docked: boolean;
    onClose: () => void;
}) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const live = useRef({ settings, onClose });
    useEffect(() => {
        live.current = { settings, onClose };
    });

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        return mountCubeToy({
            host,
            hit: host,
            // Big, but leaving room around it to spin, grow and zoom, and
            // below it for its floor.
            edge: () => Math.min(host.clientWidth, host.clientHeight) * 0.22,
            zoomMax: 1.8,
            ctrlToZoom: false,
            scaleHit: false,
            // Floating over its floor, like the small ones.
            float: true,
            stage: true,
            // A click beside the cube, on the backdrop, closes the view.
            onTap: (onCube) => {
                if (!onCube) live.current.onClose();
            },
            read: () => {
                const s = live.current.settings;
                return {
                    gradient: s.gradient,
                    wave: s.wave,
                    effect: s.effect,
                    cube: s.cube,
                    shown: true,
                    active: true,
                };
            },
        });
    }, []);

    return (
        <div
            ref={hostRef}
            // With the settings docked the cube takes the space they leave:
            // above the drawer on a phone, following it as it is pulled up
            // (--settings-sheet), and to their left on anything wider.
            className={`absolute inset-x-0 top-0 cursor-grab touch-none select-none transition-[right] duration-300 active:cursor-grabbing ${
                docked
                    ? 'bottom-[var(--settings-sheet,0px)] sm:bottom-0 sm:right-[calc(20rem+1.5rem)]'
                    : 'bottom-0 right-0'
            }`}
        />
    );
};

export default CubeView;

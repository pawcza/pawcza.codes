'use client';

import { useEffect, useRef, useState } from 'react';

import { isSoftwareRendered } from '@/components/common/gpu';
import { useIntroDone } from '@/components/common/intro';
import { useTileSettings } from '@/components/hero/TileSettings';
import { mountCubeToy } from '@/components/cube/cubeToy';

/** How much bigger than its slot the canvas is, so a spin or relief has room. */
const ROOM = 2.6;
/** The cube's edge on screen, as a share of its slot. */
const EDGE = 0.5;

/**
 * A toy cube, built from the same field as the page: beside the hero's title
 * and in the footer. Drag to spin it; a click opens it up full-screen with
 * its settings (CubeView). It floats over a floor of its own, turning
 * slowly, like an artifact on display. Nothing on it is to be read.
 */
const ToyCube = ({ className = '' }: { className?: string }) => {
    const settings = useTileSettings();
    const introDone = useIntroDone();
    const [supported, setSupported] = useState(false);
    const slotRef = useRef<HTMLDivElement>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const hitRef = useRef<HTMLDivElement>(null);
    // Read by the render loop, so settings never restart it.
    const live = useRef({ settings, introDone });
    useEffect(() => {
        live.current = { settings, introDone };
    });

    // No GPU, no cube: drawn on the CPU it would drag the whole page.
    useEffect(() => {
        setSupported(!isSoftwareRendered());
    }, []);

    useEffect(() => {
        const slot = slotRef.current;
        const host = hostRef.current;
        const hit = hitRef.current;
        if (!supported || !slot || !host || !hit) return;

        return mountCubeToy({
            host,
            hit,
            edge: () => slot.clientWidth * EDGE,
            // Looking closer is what the full-screen view is for.
            zoomMax: 1,
            ctrlToZoom: true,
            scaleHit: false,
            float: true,
            onTap: (onCube) => {
                if (onCube) live.current.settings.setCubeView(true);
            },
            read: () => {
                const { settings: s, introDone: shown } = live.current;
                return {
                    gradient: s.gradient,
                    wave: s.wave,
                    effect: s.effect,
                    cube: s.cube,
                    shown,
                    // Held while the full-screen one is up in front of it.
                    active: !s.cubeView,
                };
            },
        });
    }, [supported]);

    if (!supported) return null;

    return (
        <div
            ref={slotRef}
            className={`relative aspect-square shrink-0 ${className}`}
            aria-hidden="true"
        >
            {/* Bigger than the slot, so a spin never clips. */}
            <div
                ref={hostRef}
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
                style={{ width: `${ROOM * 100}%` }}
            />
            <div
                ref={hitRef}
                title="Drag to spin · click to open it up"
                className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
            />
        </div>
    );
};

export default ToyCube;

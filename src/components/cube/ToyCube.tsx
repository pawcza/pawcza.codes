'use client';

import { useEffect, useRef } from 'react';

import { attachCube } from '@/components/field/pageField';
import type { ScrimName } from '@/components/hero/scrim';
import { useTileSettings } from '@/components/hero/TileSettings';

/**
 * A toy cube, built from the same tiles as the page, floating over the field
 * and casting a shadow on it: it is drawn in the field's own pass, and this
 * only marks where it goes and takes the pointer. Drag to spin it; a click
 * opens it up full-screen with its settings (CubeView).
 */
const ToyCube = ({
    place,
    className = '',
}: {
    place: ScrimName;
    className?: string;
}) => {
    const { setCubeView } = useTileSettings();
    const slotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const slot = slotRef.current;
        if (!slot) return;
        return attachCube(place, slot, slot, () => setCubeView(true));
    }, [place, setCubeView]);

    return (
        <div
            ref={slotRef}
            title="Drag to spin · click to open it up"
            className={`toy-cube relative aspect-square shrink-0 cursor-grab touch-none select-none active:cursor-grabbing ${className}`}
            aria-hidden="true"
        />
    );
};

export default ToyCube;

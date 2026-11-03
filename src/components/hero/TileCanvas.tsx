'use client';

import { useEffect, useRef } from 'react';

import { attachField } from '@/components/field/pageField';
import type { ScrimName } from '@/components/hero/scrim';

/** Where the page's one live canvas goes while this part of the page is showing. */
const TileCanvas = ({ scrim }: { scrim: ScrimName }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) return attachField(scrim, ref.current);
    }, [scrim]);

    return <div ref={ref} className="hero-canvas" aria-hidden="true" />;
};

export default TileCanvas;

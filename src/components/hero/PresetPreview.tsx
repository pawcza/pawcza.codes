'use client';

import { useEffect, useRef } from 'react';

import { colorIndexAt, ramps } from '@/components/hero/tiles';
import type { Preset } from '@/components/hero/presets';

/**
 * How much of the hero one thumbnail stands for, in CSS px. Tile sizes are
 * absolute, so drawing a real slice of the field scaled down keeps a preset's
 * density honest: 72px tiles read chunky, 32px tiles read fine.
 */
const FIELD_WIDTH = 900;

/**
 * A still of the preset's tile field, drawn with the same colour function as
 * the hero (phase 0, no lens), so the thumbnail is what the button applies.
 */
const PresetPreview = ({ preset }: { preset: Preset }) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        const scale = canvas.width / FIELD_WIDTH;
        const fieldHeight = canvas.height / scale;
        const { wave } = preset;
        const ramp = ramps[preset.gradient];

        const columns = Math.max(1, Math.ceil(FIELD_WIDTH / wave.tileSize));
        const rows = Math.max(1, Math.ceil(fieldHeight / wave.tileSize));
        const tileWidth = canvas.width / columns;
        const tileHeight = canvas.height / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                context.fillStyle =
                    ramp[colorIndexAt(col, row, 0, ramp.length, wave)];
                context.fillRect(
                    Math.floor(col * tileWidth),
                    Math.floor(row * tileHeight),
                    Math.ceil(tileWidth) + 1,
                    Math.ceil(tileHeight) + 1,
                );
            }
        }
    }, [preset]);

    return (
        <canvas
            ref={ref}
            aria-hidden="true"
            className="block aspect-[16/9] w-full rounded-[0.3rem]"
        />
    );
};

export default PresetPreview;

/**
 * The washes over the tile fields: what holds them back behind the copy and
 * fades them into the page. Drawn by the field's own shader, not as CSS
 * gradients on top of it. As layers they made the browser re-blend the whole
 * field every frame it moved, which without a GPU cost more than the field: on
 * Firefox with hardware acceleration off, removing them took it from 34 to
 * 60fps, more than halving the resolution did. globals.css keeps the same
 * gradients for before the field is running.
 *
 * Each layer mirrors a CSS linear-gradient: an angle, and stops of position
 * and paper's opacity.
 */
export interface ScrimLayer {
    angle: number;
    stops: [position: number, alpha: number][];
}

const LEANING: ScrimLayer = {
    angle: 100,
    stops: [
        [0, 0.93],
        [0.4, 0.89],
        [0.62, 0.58],
        [0.84, 0.18],
        [1, 0],
    ],
};

const scrims: Record<
    'hero' | 'footer',
    { wide: ScrimLayer[]; narrow: ScrimLayer[] }
> = {
    hero: {
        wide: [
            LEANING,
            {
                angle: 180,
                stops: [
                    [0.45, 0],
                    [0.78, 0.6],
                    [1, 1],
                ],
            },
        ],
        narrow: [
            {
                angle: 180,
                stops: [
                    [0.18, 0],
                    [0.34, 0.52],
                    [0.5, 0.74],
                    [1, 0.74],
                ],
            },
            {
                angle: 180,
                stops: [
                    [0.45, 0],
                    [0.78, 0.6],
                    [1, 1],
                ],
            },
        ],
    },
    footer: {
        wide: [
            LEANING,
            {
                angle: 180,
                stops: [
                    [0, 1],
                    [0.26, 0.6],
                    [0.6, 0],
                ],
            },
        ],
        narrow: [
            {
                angle: 180,
                stops: [
                    [0, 0.28],
                    [0.16, 0.7],
                    [0.84, 0.7],
                    [1, 0.22],
                ],
            },
            {
                angle: 180,
                stops: [
                    [0, 1],
                    [0.26, 0.6],
                    [0.6, 0],
                ],
            },
        ],
    },
};

export type ScrimName = keyof typeof scrims;

/** Must match the media queries in globals.css. */
const NARROW = '(max-width: 767px)';

const alphaAlong = (stops: ScrimLayer['stops'], t: number) => {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
        const [to, toAlpha] = stops[i];
        const [from, fromAlpha] = stops[i - 1];
        if (t <= to) {
            return (
                fromAlpha + (toAlpha - fromAlpha) * ((t - from) / (to - from))
            );
        }
    }
    return stops[stops.length - 1][1];
};

/** Resolution of the texture: the washes are soft, and this is one lookup a pixel. */
export const SCRIM_SIZE = 64;

/**
 * The washes for a field of this size, baked into a small texture of paper's
 * opacity, bottom row first. A CSS gradient runs along its angle for exactly
 * the length that reaches both corners, which is what `length` is here.
 */
export const scrimTexture = (
    name: ScrimName,
    width: number,
    height: number,
) => {
    const layers =
        scrims[name][window.matchMedia(NARROW).matches ? 'narrow' : 'wide'];
    const data = new Uint8Array(SCRIM_SIZE * SCRIM_SIZE);

    for (let row = 0; row < SCRIM_SIZE; row++) {
        const y = (1 - (row + 0.5) / SCRIM_SIZE) * height;
        for (let col = 0; col < SCRIM_SIZE; col++) {
            const x = ((col + 0.5) / SCRIM_SIZE) * width;
            let clear = 1;
            for (const layer of layers) {
                const turn = (layer.angle * Math.PI) / 180;
                const dx = Math.sin(turn);
                const dy = -Math.cos(turn);
                const length = Math.abs(width * dx) + Math.abs(height * dy);
                const t =
                    ((x - width / 2) * dx + (y - height / 2) * dy) / length +
                    0.5;
                clear *= 1 - alphaAlong(layer.stops, t);
            }
            data[row * SCRIM_SIZE + col] = (1 - clear) * 255;
        }
    }

    return data;
};

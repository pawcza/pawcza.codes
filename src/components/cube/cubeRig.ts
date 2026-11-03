import { Quat, compose } from '@/components/field/math';
import { createCubeSpin } from '@/components/cube/cubeSpin';
import type { CubeSettings } from '@/components/hero/TileSettings';
import {
    GradientName,
    PHASE_RATE,
    RAMP_LENGTH,
    WaveSettings,
    customPaletteVersion,
    paletteStops,
    rgbRamps,
} from '@/components/hero/tiles';

/** How long a new palette takes to fade in, in seconds. */
const PALETTE_FADE = 0.45;
/** How quickly the shape follows new settings. */
const SETTLE = 0.13;
/** Laid out as if each face were this many CSS pixels: see blockColumns. */
const FACE = 400;
/** Pale palettes blew it out, dark ones sank it: its average lands here. */
const CUBE_LUMINANCE = 0.14;

const linear = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const hexToUnit = (hex: string): [number, number, number] => {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/**
 * The colours of whatever palette is in force, cross-fading when it changes
 * from whatever shows now, which may be half way through the last fade.
 */
export const createPaletteFade = (reduced: boolean) => {
    const ramp = new Uint8Array(RAMP_LENGTH * 4);
    const from = new Float32Array(RAMP_LENGTH * 3);
    const to = new Float32Array(RAMP_LENGTH * 3);
    let key = '';
    let blend = 1;
    let gain = 1;
    let gainFrom = 1;
    let gainTo = 1;
    let tints: [number[], number[]] = [
        [1, 1, 1],
        [1, 1, 1],
    ];

    const paint = (t: number) => {
        for (let i = 0; i < RAMP_LENGTH; i++) {
            for (let k = 0; k < 3; k++) {
                const at = i * 3 + k;
                ramp[i * 4 + k] = from[at] + (to[at] - from[at]) * t;
            }
            ramp[i * 4 + 3] = 255;
        }
        gain = gainFrom + (gainTo - gainFrom) * t;
    };

    return {
        /** Returns the ramp when it changed, for the renderer to upload. */
        update: (name: GradientName, dt: number) => {
            const nextKey = `${name}:${customPaletteVersion()}`;
            if (nextKey !== key) {
                const first = key === '';
                key = nextKey;
                const channels = rgbRamps[name];
                let sum = 0;
                for (let i = 0; i < RAMP_LENGTH; i++) {
                    for (let k = 0; k < 3; k++) {
                        from[i * 3 + k] = ramp[i * 4 + k];
                        to[i * 3 + k] = channels[i * 3 + k];
                    }
                    sum +=
                        0.2126 * linear(channels[i * 3]) +
                        0.7152 * linear(channels[i * 3 + 1]) +
                        0.0722 * linear(channels[i * 3 + 2]);
                }
                gainFrom = gain;
                // Measured in linear light, applied to sRGB colours.
                gainTo = Math.min(
                    1.2,
                    Math.max(
                        0.6,
                        (CUBE_LUMINANCE / (sum / RAMP_LENGTH)) ** (1 / 2.2),
                    ),
                );
                const stops = paletteStops(name);
                const tint = (hex: string) =>
                    hexToUnit(hex).map((c) => 1 + (c - 1) * 0.35);
                tints = [tint(stops[0]), tint(stops[stops.length - 1])];
                blend = first || reduced ? 1 : 0;
                paint(blend);
                return ramp;
            }
            if (blend >= 1) return null;
            blend = Math.min(1, blend + dt / PALETTE_FADE);
            paint(blend * blend * (3 - 2 * blend));
            return ramp;
        },
        gain: () => gain,
        tints: () => tints,
        ramp,
    };
};

/** Blocks a side: at its real size the page's tile size left three, too few to show a wave. */
const blockColumns = (wave: WaveSettings) =>
    Math.min(24, Math.max(5, Math.ceil(FACE / wave.tileSize)));

/** The cube's body: how it turns, and the settings as eased so changes flow in. */
export const createCubeRig = (float: boolean, reduced: boolean) => {
    const spin = createCubeSpin(float, reduced);
    let wave: WaveSettings | null = null;
    let cube: CubeSettings | null = null;
    let phase = 0;
    let scale = 0;

    const approach = <T extends object>(shown: T, target: T, k: number) => {
        const from = shown as Record<string, unknown>;
        for (const [key, value] of Object.entries(target)) {
            const was = from[key];
            from[key] =
                typeof value === 'number' && typeof was === 'number'
                    ? was + (value - was) * k
                    : value;
        }
    };

    return {
        spin,
        step: (dt: number, wantWave: WaveSettings, wantCube: CubeSettings) => {
            const settle = reduced ? 1 : 1 - Math.exp(-dt / SETTLE);
            if (!wave || !cube) {
                wave = { ...wantWave };
                cube = { ...wantCube };
            } else {
                approach(wave, wantWave, settle);
                approach(cube, wantCube, settle);
            }
            phase += wave.speed * dt * PHASE_RATE;
            spin.step(dt);
            scale += (1 - scale) * (reduced ? 1 : 1 - Math.exp(-dt / 0.25));
            return { wave, cube, phase, columns: blockColumns(wave), scale };
        },
        lift: () => (cube ? 0.006 + cube.relief * 0.16 : 0.16),
        matrix: (
            size: number,
            x: number,
            y: number,
            z: number,
            q: Quat = spin.orientation(),
        ) => compose(q, size, x, y, z),
    };
};

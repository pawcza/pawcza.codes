export const gradients = {
    pinotNoir: [
        '#4b6cb7',
        '#405eaa',
        '#35509d',
        '#2a438f',
        '#1f3582',
        '#182848',
    ],
    purpleParadise: ['#1D2B64', '#3a3f77', '#57638a', '#74879d', '#93abc0'],
    titanium: ['#283048', '#3a475b', '#4c5b6f', '#5e6f83', '#70838f'],
    calming: ['#f6eeab', '#c9dd94', '#9dcf94', '#7ec796', '#5ebd96', '#11a797'],
    influenza: ['#C04848', '#9e3f3f', '#7c3636', '#5a2d2d', '#381414'],
    moonrise: ['#DAE2F8', '#cbd7f1', '#bccbf0', '#adc7f0', '#9eb2ef'],
    sunrise: ['#FFE0B2', '#FFC49B', '#F7A48A', '#E88387', '#CE6A8C', '#A9578C'],
    harbour: ['#B6CCDE', '#9BB8CF', '#7FA3C0', '#648FB1', '#487AA2', '#2D6693'],
    sand: ['#EFE6D6', '#E3D5BE', '#D6C4A6', '#C9B38E', '#BCA176', '#AF905E'],
} as const;

export type GradientName = keyof typeof gradients;

export const gradientNames = Object.keys(gradients) as GradientName[];

export interface WaveSettings {
    frequency: number;
    amplitude: number;
    secondaryFrequency: number;
    speed: number;
    /** Skews the wave sideways, so it travels at an angle instead of down. */
    tilt: number;
    /** Squeezes or stretches how much of the palette the wave sweeps through. */
    contrast: number;
    /** Edge length of one tile, in CSS pixels. */
    tileSize: number;
    /**
     * Bipolar: 50 is neutral, above pushes the field up towards the viewer,
     * below presses it down into the page.
     */
    lens: number;
    /** Stretches the lens sideways and vertically, making it an ellipse. */
    reachX: number;
    reachY: number;
}

export const defaultWave: WaveSettings = {
    frequency: 0.5,
    amplitude: 1.5,
    secondaryFrequency: 0.2,
    tilt: 0,
    contrast: 1,
    speed: 0.01,
    tileSize: 44,
    lens: 70,
    reachX: 1,
    reachY: 1,
};

/** Neutral point of the bipolar lens slider. */
export const LENS_NEUTRAL = 50;

/** Radius of the cursor's influence, scaled off how far the lens is pushed. */
export const lensRadius = (lens: number) =>
    110 + Math.abs(lens - LENS_NEUTRAL) * 4.4;

/**
 * How much the grid spreads at the cursor. Above 1 magnifies, so the field
 * bulges towards the viewer; below 1 minifies, so it dents inwards.
 *
 * The outward side is capped at 2.8 because the warp curve stops being
 * monotonic past 4 and folds. Inwards the curve's tightest slope equals the
 * magnification itself, so anything above 0 is safe; 0.3 is simply as deep a
 * dent as still looks like tiles.
 */
export const lensMagnify = (lens: number, influence: number) => {
    const push = (lens - LENS_NEUTRAL) / LENS_NEUTRAL;
    return 1 + push * (push >= 0 ? 1.8 : 0.7) * influence;
};

/**
 * Slider bounds. `min`/`max` are what the panel allows; `randomMin`/`randomMax`
 * are the narrower band randomise draws from, so a random roll never lands on
 * something degenerate like a frozen or perfectly flat field.
 */
export const waveRanges: Record<
    keyof WaveSettings,
    {
        label: string;
        min: number;
        max: number;
        step: number;
        randomMin: number;
        randomMax: number;
    }
> = {
    tileSize: {
        label: 'Tile size',
        min: 24,
        max: 200,
        step: 2,
        randomMin: 24,
        randomMax: 110,
    },
    frequency: {
        label: 'Wave frequency',
        min: 0,
        max: 1.5,
        step: 0.01,
        randomMin: 0.08,
        randomMax: 1.35,
    },
    amplitude: {
        label: 'Wave amplitude',
        min: 0,
        max: 3,
        step: 0.01,
        randomMin: 0.2,
        randomMax: 2.9,
    },
    secondaryFrequency: {
        label: 'Secondary frequency',
        min: 0,
        max: 1,
        step: 0.01,
        randomMin: 0.02,
        randomMax: 0.9,
    },
    tilt: {
        label: 'Tilt',
        min: -1.5,
        max: 1.5,
        step: 0.01,
        randomMin: -1.4,
        randomMax: 1.4,
    },
    contrast: {
        label: 'Contrast',
        min: 0.2,
        max: 2,
        step: 0.01,
        randomMin: 0.45,
        randomMax: 1.95,
    },
    speed: {
        label: 'Speed',
        min: 0,
        max: 0.06,
        step: 0.001,
        randomMin: 0.003,
        randomMax: 0.05,
    },
    lens: {
        label: 'Cursor lens',
        min: 0,
        max: 100,
        step: 1,
        randomMin: 4,
        randomMax: 99,
    },
    reachX: {
        label: 'Lens reach X',
        min: 0.3,
        max: 2.5,
        step: 0.05,
        randomMin: 0.4,
        randomMax: 2.4,
    },
    reachY: {
        label: 'Lens reach Y',
        min: 0.3,
        max: 2.5,
        step: 0.05,
        randomMin: 0.4,
        randomMax: 2.4,
    },
};

export const waveKeys = Object.keys(waveRanges) as (keyof WaveSettings)[];

/** A random but deliberately well-behaved set of wave settings. */
export const randomWave = (): WaveSettings =>
    waveKeys.reduce((settings, key) => {
        const { randomMin, randomMax, step } = waveRanges[key];
        const value = randomMin + Math.random() * (randomMax - randomMin);
        settings[key] = Math.round(value / step) * step;
        return settings;
    }, {} as WaveSettings);

export const randomGradient = (exclude?: GradientName): GradientName => {
    const options = gradientNames.filter((name) => name !== exclude);
    return options[Math.floor(Math.random() * options.length)];
};

/**
 * How many colours each palette is expanded to. The palettes only define 5 or
 * 6 stops, so rounding to the nearest one made tiles snap between them as the
 * wave passed. Interpolating to a fine ramp turns that into a continuous fade.
 */
const RAMP_STEPS = 256;

const hexToRgb = (hex: string): [number, number, number] => {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = (r: number, g: number, b: number) =>
    `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;

/** Expands a palette into RAMP_STEPS evenly interpolated colours. */
const buildRamp = (palette: readonly string[]): string[] => {
    const stops = palette.map(hexToRgb);
    const ramp: string[] = [];

    for (let i = 0; i < RAMP_STEPS; i++) {
        const position = (i / (RAMP_STEPS - 1)) * (stops.length - 1);
        const index = Math.min(Math.floor(position), stops.length - 2);
        const blend = position - index;

        const from = stops[index];
        const to = stops[index + 1];

        ramp.push(
            toHex(
                Math.round(from[0] + (to[0] - from[0]) * blend),
                Math.round(from[1] + (to[1] - from[1]) * blend),
                Math.round(from[2] + (to[2] - from[2]) * blend),
            ),
        );
    }

    return ramp;
};

/**
 * Precomputed once at module load, so the draw loop stays a plain array
 * lookup and never allocates a colour string per tile per frame.
 */
export const ramps = Object.fromEntries(
    gradientNames.map((name) => [name, buildRamp(gradients[name])]),
) as Record<GradientName, string[]>;

/** The same ramps as raw channels, so palettes can be cross-faded. */
export const rgbRamps = Object.fromEntries(
    gradientNames.map((name) => {
        const channels = new Uint8ClampedArray(RAMP_STEPS * 3);
        ramps[name].forEach((hex, i) => {
            const [r, g, b] = hexToRgb(hex);
            channels[i * 3] = r;
            channels[i * 3 + 1] = g;
            channels[i * 3 + 2] = b;
        });
        return [name, channels];
    }),
) as Record<GradientName, Uint8ClampedArray>;

export const RAMP_LENGTH = RAMP_STEPS;

/**
 * Which colour of the ramp a tile takes, given its grid position and the
 * wave's accumulated phase.
 *
 * Phase is passed in already accumulated rather than derived from elapsed
 * time multiplied by speed. Deriving it meant changing speed retroactively
 * rescaled the whole elapsed time and the pattern lurched.
 */
export const colorIndexAt = (
    col: number,
    row: number,
    phase: number,
    steps: number,
    wave: WaveSettings,
): number => {
    const value = Math.sin(
        wave.frequency * row +
            wave.tilt * col +
            wave.amplitude * Math.sin(wave.secondaryFrequency * col) -
            phase,
    );

    // Contrast pivots around the middle of the ramp, so turning it down keeps
    // the palette centred rather than draining it towards one end.
    const shaped = 0.5 + ((value + 1) / 2 - 0.5) * wave.contrast;
    const clamped = shaped < 0 ? 0 : shaped > 1 ? 1 : shaped;

    return Math.round(clamped * (steps - 1));
};

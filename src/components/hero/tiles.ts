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

/** A built-in palette, or the one the visitor mixes from two colours. */
export type GradientName = keyof typeof gradients | 'custom';

/** The built-in palettes only: what Randomise and the swatches draw from. */
export const gradientNames = Object.keys(gradients) as Exclude<
    GradientName,
    'custom'
>[];

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
    /**
     * Stretches the lens sideways and vertically, making it an ellipse. Wide
     * enough at the top of the range to turn it into a band that spans the
     * whole field on one axis, which is what makes a wave of vertical lines
     * bend along its entire length as the lens passes.
     */
    reachX: number;
    reachY: number;
    /** Grid effect: radius of the revealed patch of grid lines, in px. */
    gridReach: number;
    /** Grid effect: how strongly the lines show at the cursor. */
    gridOpacity: number;
    /** Rise effect: how high the tiles under the cursor stand up, in tiles. */
    riseHeight: number;
    /** Rise effect: how far around the cursor they rise, in px. */
    riseReach: number;
    /**
     * How deep the wave looks: the field is lit as if its colours were
     * heights, light rolling over the crests and into the troughs. 0 is flat.
     */
    relief: number;
}

/** What the cursor does to the field. */
export type HoverEffect = 'rise' | 'lens' | 'grid';

/** The settings each effect owns, so the panel shows only the chosen one's. */
export const effectKeys: Record<HoverEffect, (keyof WaveSettings)[]> = {
    rise: ['riseHeight', 'riseReach'],
    lens: ['lens', 'reachX', 'reachY'],
    grid: ['gridReach', 'gridOpacity'],
};

export type RiseKey = 'riseHeight' | 'riseReach';

export const defaultRise: Pick<WaveSettings, RiseKey> = {
    riseHeight: 2.5,
    riseReach: 220,
};

export type GridKey = 'gridReach' | 'gridOpacity';

export const defaultGrid: Pick<WaveSettings, GridKey> = {
    gridReach: 220,
    gridOpacity: 0.55,
};

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
    relief: 2,
    ...defaultGrid,
    ...defaultRise,
};

/**
 * How fast the wave moves per unit of the speed setting. Half the old flat
 * field's rate: as heights rather than colour bands, the same motion read
 * twice as fast.
 */
export const PHASE_RATE = 30;

/** Neutral point of the bipolar lens slider. */
export const LENS_NEUTRAL = 50;

/** Radius of the cursor's influence, scaled off how far the lens is pushed. */
export const lensRadius = (lens: number) =>
    110 + Math.abs(lens - LENS_NEUTRAL) * 4.4;

/**
 * How much the grid spreads at the cursor. Above 1 magnifies, so the field
 * bulges towards the viewer; below 1 minifies, so it dents inwards.
 *
 * The outward side tops out at 3.88 (slider at 130) because the warp curve
 * stops being monotonic past 4 and folds. Inwards the curve's tightest slope equals the
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
        /** One plain line for the settings panel: what moving it does. */
        description: string;
        min: number;
        max: number;
        step: number;
        randomMin: number;
        randomMax: number;
    }
> = {
    tileSize: {
        label: 'Tile size',
        description: 'How big each square is. Smaller is finer and busier.',
        min: 24,
        max: 200,
        step: 2,
        randomMin: 24,
        randomMax: 110,
    },
    frequency: {
        label: 'Wave frequency',
        description: 'How many bands of colour stack down the field.',
        min: 0,
        max: 1.5,
        step: 0.01,
        randomMin: 0.08,
        randomMax: 1.35,
    },
    amplitude: {
        label: 'Wave amplitude',
        description: 'How far the bands swing from side to side.',
        min: 0,
        max: 3,
        step: 0.01,
        randomMin: 0.2,
        randomMax: 2.9,
    },
    secondaryFrequency: {
        label: 'Secondary frequency',
        description: 'How quickly that swing repeats across the field.',
        min: 0,
        max: 1,
        step: 0.01,
        randomMin: 0.02,
        randomMax: 0.9,
    },
    tilt: {
        label: 'Tilt',
        description: 'Leans the bands, so they run at an angle.',
        min: -1.5,
        max: 1.5,
        step: 0.01,
        randomMin: -1.4,
        randomMax: 1.4,
    },
    contrast: {
        label: 'Contrast',
        description:
            'How much of the palette the wave sweeps through. Lower is calmer.',
        min: 0.2,
        max: 2,
        step: 0.01,
        randomMin: 0.45,
        randomMax: 1.95,
    },
    speed: {
        label: 'Speed',
        description: 'How fast the bands drift. All the way down stops them.',
        min: 0,
        max: 0.06,
        step: 0.001,
        randomMin: 0.003,
        randomMax: 0.05,
    },
    lens: {
        label: 'Lens',
        description:
            'Past the middle it bulges the tiles towards you, below it presses them in.',
        // Past 100 the bulge goes properly wild; 130 is as far as the warp
        // stays unfolded (see lensMagnify).
        min: 0,
        max: 130,
        step: 1,
        // Randomise keeps it gentle: a nudge either way, never a crater or
        // a blow-up. The slider still goes all the way.
        randomMin: 30,
        randomMax: 78,
    },
    reachX: {
        label: 'Lens reach X',
        description:
            'How far the lens reaches sideways. Stretch it into a band.',
        min: 0.2,
        max: 6,
        step: 0.05,
        randomMin: 0.8,
        randomMax: 1.8,
    },
    reachY: {
        label: 'Lens reach Y',
        description: 'How far the lens reaches up and down.',
        min: 0.2,
        max: 6,
        step: 0.05,
        randomMin: 0.8,
        randomMax: 1.8,
    },
    gridReach: {
        label: 'Grid reach',
        description: 'How big the patch of grid around the cursor is.',
        min: 60,
        max: 700,
        step: 10,
        randomMin: 120,
        randomMax: 520,
    },
    relief: {
        label: 'Relief',
        description:
            'How deep the wave looks, lit from the top left. All the way down, flat.',
        min: 0,
        max: 3,
        step: 0.05,
        randomMin: 1.5,
        randomMax: 2.8,
    },
    gridOpacity: {
        label: 'Grid strength',
        description: 'How strongly the lines show.',
        min: 0.1,
        max: 1,
        step: 0.05,
        randomMin: 0.3,
        randomMax: 0.9,
    },
    riseHeight: {
        label: 'Rise height',
        description: 'How high the tiles under the cursor stand up.',
        min: 0.5,
        max: 6,
        step: 0.1,
        randomMin: 1.5,
        randomMax: 4,
    },
    riseReach: {
        label: 'Rise reach',
        description: 'How wide the patch of rising tiles is.',
        min: 80,
        max: 600,
        step: 10,
        randomMin: 150,
        randomMax: 380,
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

/* ---------- Custom palette ---------- */

// sRGB <-> OKLab, for mixing two picked colours. A straight RGB blend between,
// say, blue and yellow passes through a muddy grey; OKLab keeps the middle
// of the ramp as bright and saturated as its ends.
const toLinear = (c: number) =>
    (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c: number) =>
    Math.round(
        255 *
            Math.min(
                1,
                Math.max(
                    0,
                    c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055,
                ),
            ),
    );

const toOklab = ([r, g, b]: [number, number, number]) => {
    const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
    const l = Math.cbrt(
        0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
    );
    const m = Math.cbrt(
        0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
    );
    const s = Math.cbrt(
        0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
    );
    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
};

const fromOklab = ([L, a, b]: number[]) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return toHex(
        fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    );
};

/** Five stops from `from` to `to`, evenly spaced in OKLab. */
export const mixPaletteStops = (from: string, to: string): string[] => {
    const a = toOklab(hexToRgb(from));
    const b = toOklab(hexToRgb(to));
    return [0, 0.25, 0.5, 0.75, 1].map((t) =>
        fromOklab(a.map((v, i) => v + (b[i] - v) * t)),
    );
};

export const defaultCustomColours: [string, string] = ['#1d2b64', '#f7a48a'];
let customStops = mixPaletteStops(...defaultCustomColours);

/** The stops behind any palette, the custom one included. */
export const paletteStops = (name: GradientName): readonly string[] =>
    name === 'custom' ? customStops : gradients[name];

const toChannels = (ramp: string[]) => {
    const channels = new Uint8ClampedArray(RAMP_STEPS * 3);
    ramp.forEach((hex, i) => {
        const [r, g, b] = hexToRgb(hex);
        channels[i * 3] = r;
        channels[i * 3 + 1] = g;
        channels[i * 3 + 2] = b;
    });
    return channels;
};

/**
 * Precomputed once at module load, so the draw loop stays a plain array
 * lookup and never allocates a colour string per tile per frame. The custom
 * entry is rebuilt in place by setCustomPalette.
 */
export const ramps = Object.fromEntries(
    [...gradientNames, 'custom' as const].map((name) => [
        name,
        buildRamp(paletteStops(name)),
    ]),
) as Record<GradientName, string[]>;

/** The same ramps as raw channels, so palettes can be cross-faded. */
export const rgbRamps = Object.fromEntries(
    [...gradientNames, 'custom' as const].map((name) => [
        name,
        toChannels(ramps[name]),
    ]),
) as Record<GradientName, Uint8ClampedArray>;

/**
 * Bumped on every custom-palette change, so a canvas already showing
 * "custom" knows to fade; it keeps the outgoing channels for that fade.
 */
let customVersion = 0;
let previousCustom = rgbRamps.custom;
export const customPaletteVersion = () => customVersion;
export const previousCustomChannels = () => previousCustom;

export const setCustomPalette = (from: string, to: string) => {
    previousCustom = rgbRamps.custom;
    customStops = mixPaletteStops(from, to);
    ramps.custom = buildRamp(customStops);
    rgbRamps.custom = toChannels(ramps.custom);
    customVersion++;
};

export const RAMP_LENGTH = RAMP_STEPS;

/** The most the cube's relief setting runs to. */
export const RELIEF_MAX = 3;

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

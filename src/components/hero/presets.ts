import type { CubeSettings } from '@/components/hero/TileSettings';
import {
    GradientName,
    GridKey,
    HoverEffect,
    WaveSettings,
    defaultGrid,
} from '@/components/hero/tiles';

export interface Preset {
    name: string;
    gradient: GradientName;
    wave: WaveSettings;
    /** Defaults to the lens. */
    effect?: HoverEffect;
    /** The cube's build; its core is left as the visitor set it. */
    cube: CubeShape;
    /**
     * Eligible to appear on page load. The fast ones stay off this list: a
     * first-time visitor should meet something bold, not something strobing.
     * They are still one click away in the settings.
     */
    calm: boolean;
}

/**
 * Hand-tuned showpieces, each pushed further than a random roll dares: deep
 * relief, wide swings, the whole palette, a lens that bends or craters the
 * field, and a cube built to match. One of the calm ones is picked at random
 * on every page load.
 */
export type CubeShape = Pick<
    CubeSettings,
    'relief' | 'blockWidth' | 'blockHeight'
>;

type RawPreset = Omit<Preset, 'wave'> & {
    wave: Omit<WaveSettings, GridKey> & Partial<Pick<WaveSettings, GridKey>>;
};

const rawPresets: RawPreset[] = [
    {
        name: 'Supernova',
        gradient: 'sunrise',
        wave: {
            tileSize: 30,
            frequency: 1.1,
            amplitude: 2.8,
            secondaryFrequency: 0.6,
            tilt: 0.9,
            contrast: 1.9,
            speed: 0.018,
            lens: 72,
            reachX: 1.2,
            reachY: 1.2,
            relief: 2.6,
        },
        cube: { relief: 0.7, blockWidth: 0.8, blockHeight: 0.5 },
        calm: true,
    },
    {
        name: 'Lava Lamp',
        gradient: 'influenza',
        wave: {
            tileSize: 56,
            frequency: 0.35,
            amplitude: 2.9,
            secondaryFrequency: 0.9,
            tilt: 0.4,
            contrast: 2,
            speed: 0.012,
            lens: 76,
            reachX: 1.3,
            reachY: 1.3,
            relief: 3,
        },
        cube: { relief: 2, blockWidth: 0.75, blockHeight: 0.6 },
        calm: true,
    },
    {
        name: 'Borealis',
        gradient: 'purpleParadise',
        wave: {
            tileSize: 40,
            frequency: 0.25,
            amplitude: 2.9,
            secondaryFrequency: 0.75,
            tilt: 1.3,
            contrast: 1.9,
            speed: 0.016,
            lens: 70,
            reachX: 1.6,
            reachY: 0.9,
            relief: 2.2,
        },
        cube: { relief: 1.8, blockWidth: 0.45, blockHeight: 0.9 },
        calm: true,
    },
    {
        name: 'Crater',
        gradient: 'titanium',
        wave: {
            tileSize: 34,
            frequency: 0.8,
            amplitude: 2.2,
            secondaryFrequency: 0.5,
            tilt: -0.6,
            contrast: 1.9,
            speed: 0.01,
            lens: 32,
            reachX: 1.3,
            reachY: 1.3,
            relief: 2.8,
        },
        cube: { relief: 2.2, blockWidth: 0.6, blockHeight: 0.8 },
        calm: true,
    },
    {
        name: 'Terraces',
        gradient: 'calming',
        wave: {
            tileSize: 72,
            frequency: 0.9,
            amplitude: 1.6,
            secondaryFrequency: 0.3,
            tilt: 0.6,
            contrast: 2,
            speed: 0.008,
            lens: 74,
            reachX: 1.1,
            reachY: 1.3,
            relief: 3,
        },
        cube: { relief: 1.8, blockWidth: 0.95, blockHeight: 0.5 },
        calm: true,
    },
    {
        name: 'Glacier',
        gradient: 'moonrise',
        wave: {
            tileSize: 48,
            frequency: 0.6,
            amplitude: 2.5,
            secondaryFrequency: 0.45,
            tilt: -0.9,
            contrast: 2,
            speed: 0.009,
            lens: 36,
            reachX: 1.4,
            reachY: 1.1,
            relief: 2.7,
        },
        cube: { relief: 2, blockWidth: 0.8, blockHeight: 0.35 },
        calm: true,
    },
    {
        name: 'Deep Sea',
        gradient: 'pinotNoir',
        wave: {
            tileSize: 64,
            frequency: 0.45,
            amplitude: 2.7,
            secondaryFrequency: 0.35,
            tilt: -0.4,
            contrast: 2,
            speed: 0.01,
            lens: 75,
            reachX: 1.2,
            reachY: 1.2,
            relief: 2.9,
        },
        cube: { relief: 2.2, blockWidth: 0.65, blockHeight: 0.55 },
        calm: true,
    },
    {
        name: 'Monolith',
        gradient: 'titanium',
        wave: {
            tileSize: 110,
            frequency: 0.55,
            amplitude: 2.4,
            secondaryFrequency: 0.6,
            tilt: 0.2,
            contrast: 2,
            speed: 0.006,
            lens: 70,
            reachX: 1,
            reachY: 1,
            relief: 3,
            gridReach: 700,
            gridLine: 3,
            gridOpacity: 1,
        },
        effect: 'grid',
        cube: { relief: 2, blockWidth: 0.95, blockHeight: 0.95 },
        calm: true,
    },
    {
        name: 'Dusk',
        gradient: 'sunrise',
        wave: {
            tileSize: 44,
            frequency: 0.7,
            amplitude: 2.6,
            secondaryFrequency: 0.7,
            tilt: 1.1,
            contrast: 1.8,
            speed: 0.015,
            lens: 70,
            reachX: 1,
            reachY: 1,
            relief: 2.5,
            gridReach: 450,
            gridLine: 2,
            gridOpacity: 0.8,
        },
        effect: 'grid',
        cube: { relief: 0.8, blockWidth: 0.75, blockHeight: 0.45 },
        calm: true,
    },
    {
        name: 'Mirage',
        gradient: 'sand',
        wave: {
            tileSize: 36,
            frequency: 1.2,
            amplitude: 2.9,
            secondaryFrequency: 0.3,
            tilt: 0,
            contrast: 1.7,
            speed: 0.024,
            lens: 72,
            reachX: 0.9,
            reachY: 1.6,
            relief: 2.3,
        },
        cube: { relief: 0.7, blockWidth: 0.8, blockHeight: 0.6 },
        calm: false,
    },
    {
        name: 'Riptide',
        gradient: 'harbour',
        wave: {
            tileSize: 26,
            frequency: 1.4,
            amplitude: 2.9,
            secondaryFrequency: 0.85,
            tilt: -1.2,
            contrast: 1.8,
            speed: 0.035,
            lens: 70,
            reachX: 1.6,
            reachY: 0.9,
            relief: 2.4,
        },
        cube: { relief: 0.7, blockWidth: 0.75, blockHeight: 0.4 },
        calm: false,
    },
    {
        name: 'Circuit',
        gradient: 'pinotNoir',
        wave: {
            tileSize: 28,
            frequency: 1.35,
            amplitude: 0.8,
            secondaryFrequency: 0.9,
            tilt: -1.4,
            contrast: 2,
            speed: 0.03,
            lens: 70,
            reachX: 1,
            reachY: 1,
            relief: 2.4,
            gridReach: 620,
            gridLine: 1.5,
            gridOpacity: 0.9,
        },
        effect: 'grid',
        cube: { relief: 0.6, blockWidth: 0.7, blockHeight: 0.5 },
        calm: false,
    },
];

/** The presets were tuned for the lens; the grid settings default. */
export const presets: Preset[] = rawPresets.map((preset) => ({
    ...preset,
    wave: { ...defaultGrid, ...preset.wave },
}));

/** Only ever draws from the calm set. */
export const randomPreset = (): Preset => {
    const options = presets.filter((preset) => preset.calm);
    return options[Math.floor(Math.random() * options.length)];
};

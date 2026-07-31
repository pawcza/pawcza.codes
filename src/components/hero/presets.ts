import { GradientName, WaveSettings } from '@/components/hero/tiles';

export interface Preset {
    name: string;
    gradient: GradientName;
    wave: WaveSettings;
    /**
     * Eligible to appear on page load. The loud ones stay off this list: a
     * first-time visitor should meet something composed, not a strobing
     * diagonal. They are still one click away in the playground.
     */
    calm: boolean;
}

/**
 * Hand-tuned starting points. A calm one is picked at random on every page
 * load, so the field looks different each visit without ever landing on the
 * duds a fully random roll can produce.
 */
export const presets: Preset[] = [
    {
        name: 'Pinot',
        gradient: 'pinotNoir',
        wave: {
            tileSize: 44,
            frequency: 0.5,
            amplitude: 1.5,
            secondaryFrequency: 0.2,
            tilt: 0,
            contrast: 1,
            speed: 0.01,
            lens: 70,
            reachX: 1,
            reachY: 1,
        },
        calm: true,
    },
    {
        name: 'Moonrise',
        gradient: 'moonrise',
        wave: {
            tileSize: 72,
            frequency: 0.3,
            amplitude: 1.1,
            secondaryFrequency: 0.12,
            tilt: 0.25,
            contrast: 0.75,
            speed: 0.006,
            lens: 64,
            reachX: 1.55,
            reachY: 0.8,
        },
        calm: true,
    },
    {
        name: 'Ember',
        gradient: 'influenza',
        wave: {
            tileSize: 32,
            frequency: 0.8,
            amplitude: 2.1,
            secondaryFrequency: 0.35,
            tilt: -0.5,
            contrast: 1.5,
            speed: 0.02,
            lens: 84,
            reachX: 1,
            reachY: 1,
        },
        calm: false,
    },
    {
        name: 'Meadow',
        gradient: 'calming',
        wave: {
            tileSize: 40,
            frequency: 0.45,
            amplitude: 1.8,
            secondaryFrequency: 0.28,
            tilt: 0.7,
            contrast: 1.15,
            speed: 0.014,
            lens: 76,
            reachX: 1.2,
            reachY: 1.2,
        },
        calm: false,
    },
    {
        name: 'Girder',
        gradient: 'titanium',
        wave: {
            tileSize: 96,
            frequency: 0.22,
            amplitude: 0.9,
            secondaryFrequency: 0.1,
            tilt: -0.2,
            contrast: 0.9,
            speed: 0.004,
            lens: 58,
            reachX: 2,
            reachY: 0.6,
        },
        calm: true,
    },
    {
        name: 'Undertow',
        gradient: 'purpleParadise',
        wave: {
            tileSize: 28,
            frequency: 1.05,
            amplitude: 2.4,
            secondaryFrequency: 0.45,
            tilt: 0.35,
            contrast: 1.35,
            speed: 0.026,
            lens: 92,
            reachX: 0.9,
            reachY: 1.4,
        },
        calm: false,
    },
    {
        name: 'Pressed',
        gradient: 'titanium',
        wave: {
            tileSize: 36,
            frequency: 0.6,
            amplitude: 1.3,
            secondaryFrequency: 0.22,
            tilt: 0,
            contrast: 1.1,
            // Below neutral, so the cursor dents the field inwards.
            lens: 14,
            speed: 0.009,
            reachX: 1.3,
            reachY: 1.3,
        },
        calm: true,
    },
    {
        name: 'Interference',
        gradient: 'pinotNoir',
        wave: {
            tileSize: 26,
            frequency: 1.35,
            amplitude: 0.5,
            secondaryFrequency: 0.8,
            tilt: -1.1,
            contrast: 1.7,
            speed: 0.032,
            lens: 34,
            reachX: 1,
            reachY: 1,
        },
        calm: false,
    },
    {
        name: 'Sunrise',
        gradient: 'sunrise',
        wave: {
            tileSize: 56,
            frequency: 0.34,
            amplitude: 1.25,
            secondaryFrequency: 0.16,
            tilt: 0.3,
            contrast: 0.9,
            speed: 0.007,
            lens: 66,
            reachX: 1.3,
            reachY: 0.95,
        },
        calm: true,
    },
    {
        name: 'Harbour',
        gradient: 'harbour',
        wave: {
            tileSize: 48,
            frequency: 0.42,
            amplitude: 1.35,
            secondaryFrequency: 0.18,
            tilt: -0.22,
            contrast: 1,
            speed: 0.008,
            lens: 72,
            reachX: 1.1,
            reachY: 1.1,
        },
        calm: true,
    },
    {
        name: 'Dunes',
        gradient: 'sand',
        wave: {
            tileSize: 88,
            frequency: 0.26,
            amplitude: 1,
            secondaryFrequency: 0.1,
            tilt: 0.15,
            contrast: 0.85,
            speed: 0.005,
            lens: 62,
            reachX: 1.6,
            reachY: 0.75,
        },
        calm: true,
    },
    {
        name: 'Drift',
        gradient: 'purpleParadise',
        wave: {
            tileSize: 60,
            frequency: 0.36,
            amplitude: 1.4,
            secondaryFrequency: 0.14,
            tilt: -0.35,
            contrast: 0.95,
            speed: 0.006,
            lens: 68,
            reachX: 1.25,
            reachY: 1.05,
        },
        calm: true,
    },
    {
        name: 'Slate',
        gradient: 'titanium',
        wave: {
            tileSize: 52,
            frequency: 0.4,
            amplitude: 1.2,
            secondaryFrequency: 0.2,
            tilt: 0.18,
            contrast: 0.95,
            speed: 0.007,
            lens: 74,
            reachX: 1,
            reachY: 1.35,
        },
        calm: true,
    },
];

/** Only ever draws from the calm set. */
export const randomPreset = (): Preset => {
    const options = presets.filter((preset) => preset.calm);
    return options[Math.floor(Math.random() * options.length)];
};

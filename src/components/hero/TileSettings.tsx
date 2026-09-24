'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    GradientName,
    HoverEffect,
    WaveSettings,
    defaultCustomColours,
    paletteStops,
    setCustomPalette,
    randomGradient,
    randomWave,
} from '@/components/hero/tiles';
import {
    CubeShape,
    Preset,
    presets,
    randomPreset,
} from '@/components/hero/presets';
import Controls from '@/components/hero/Controls';
import CubeView from '@/components/cube/CubeView';

interface TileSettings {
    gradient: GradientName;
    setGradient: (name: GradientName) => void;
    wave: WaveSettings;
    setWave: (wave: WaveSettings) => void;
    /** What the cursor does to the field: bend it (lens) or reveal its grid. */
    effect: HoverEffect;
    setEffect: (effect: HoverEffect) => void;
    /** The two colours the custom palette is mixed from. */
    customColours: [string, string];
    setCustomColours: (colours: [string, string]) => void;
    /** Name of the preset currently in force, or null once it's been edited. */
    preset: string | null;
    applyPreset: (preset: Preset) => void;
    randomise: () => void;
    controlsOpen: boolean;
    /**
     * `from` is where it was opened: the nav drops the panel just under
     * itself, everything else floats it bottom-right by the field's buttons.
     */
    setControlsOpen: (open: boolean, from?: ControlsAnchor) => void;
    controlsAnchor: ControlsAnchor;
    /** True once the visitor has touched the field, so hints can step aside. */
    played: boolean;
    /** The toy cubes, by the hero's title and in the footer. */
    cube: CubeSettings;
    setCube: (cube: CubeSettings) => void;
    /** The cube full-screen, with the settings beside it. */
    cubeView: boolean;
    setCubeView: (open: boolean) => void;
}

/** `view`: docked beside the full-screen cube (CubeView). */
export type ControlsAnchor = 'nav' | 'page' | 'view';

export interface CubeSettings {
    /** 0–3: how far the wave lifts its blocks off the faces. */
    relief: number;
    /** 0.2–1: each block's footprint, as a share of its tile. */
    blockWidth: number;
    /** 0.1–1: each block's thickness, as a share of its tile. */
    blockHeight: number;
    /** What sits inside the shell of blocks, if anything. */
    core: CoreShape;
    coreColor: string;
    /** 0.1–1: how much of the space inside the blocks the core fills. */
    coreSize: number;
}

export type CoreShape = 'none' | 'cube' | 'sphere' | 'diamond';

// Small cuboids with room between them, so relief pulls them visibly apart.
export const defaultCube: CubeSettings = {
    relief: 1,
    blockWidth: 0.78,
    blockHeight: 0.55,
    // Hollow by default: the gaps show straight through.
    core: 'none',
    coreColor: '#0b0b0f',
    coreSize: 1,
};

/** A random build for the cube, from the tidy to the scattered. */
const randomCubeShape = (): CubeShape => {
    const roll = (min: number, max: number) =>
        Math.round((min + Math.random() * (max - min)) * 20) / 20;
    return {
        relief: roll(0.4, 2.6),
        blockWidth: roll(0.35, 0.95),
        blockHeight: roll(0.2, 0.9),
    };
};

const TileSettingsContext = createContext<TileSettings | null>(null);

/**
 * The hero and the footer each render their own tile field, so the palette and
 * wave live above both. Randomising or dragging a slider moves them together.
 */
export const TileSettingsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    // The first preset on both server and client, so hydration matches; a
    // random one is swapped in on mount below, while the loader still covers
    // the page.
    const [gradient, setGradientState] = useState<GradientName>(
        presets[0].gradient,
    );
    const [wave, setWaveState] = useState<WaveSettings>(presets[0].wave);
    const [effect, setEffectState] = useState<HoverEffect>(
        presets[0].effect ?? 'lens',
    );
    const [customColours, setCustomColoursState] =
        useState<[string, string]>(defaultCustomColours);
    const [preset, setPreset] = useState<string | null>(presets[0].name);
    const [controlsOpen, setControlsOpenState] = useState(false);
    const [controlsAnchor, setControlsAnchor] =
        useState<ControlsAnchor>('page');
    const [played, setPlayed] = useState(false);
    // Presets and randomising set its build along with the field; the core
    // stays as the visitor set it.
    const [cube, setCubeState] = useState<CubeSettings>({
        ...defaultCube,
        ...presets[0].cube,
    });
    const setCube = (next: CubeSettings) => {
        setCubeState(next);
        setPlayed(true);
    };
    const [cubeView, setCubeViewState] = useState(false);
    // Stable, so the view's Escape listener is not re-registered mid-event.
    const setCubeView = useCallback((open: boolean) => {
        setCubeViewState(open);
        setPlayed(true);
        // The settings come and go with it, docked beside the cube.
        setControlsAnchor('view');
        setControlsOpenState(open);
    }, []);

    const load = (next: Preset) => {
        setGradientState(next.gradient);
        setWaveState(next.wave);
        setEffectState(next.effect ?? 'lens');
        setCubeState((current) => ({ ...current, ...next.cube }));
        setPreset(next.name);
    };

    const applyPreset = (next: Preset) => {
        load(next);
        setPlayed(true);
    };

    const setControlsOpen = (open: boolean, from: ControlsAnchor = 'page') => {
        if (open) setControlsAnchor(from);
        setControlsOpenState(open);
        if (open) setPlayed(true);
    };

    // Editing anything by hand means no preset is in force any more.
    const setGradient = (name: GradientName) => {
        setGradientState(name);
        setPreset(null);
        setPlayed(true);
    };

    // Picking a colour switches to the custom palette straight away.
    const setCustomColours = (next: [string, string]) => {
        setCustomPalette(...next);
        setCustomColoursState(next);
        setGradientState('custom');
        setPreset(null);
        setPlayed(true);
    };

    const setEffect = (next: HoverEffect) => {
        setEffectState(next);
        setPreset(null);
        setPlayed(true);
    };

    const setWave = (next: WaveSettings) => {
        setWaveState(next);
        setPreset(null);
        setPlayed(true);
    };

    const randomise = () => {
        setGradientState((current) => randomGradient(current));
        setWaveState(randomWave());
        setEffectState(Math.random() < 0.5 ? 'lens' : 'grid');
        setCubeState((current) => ({ ...current, ...randomCubeShape() }));
        setPreset(null);
        setPlayed(true);
    };

    useEffect(() => {
        // Swapped in after mount rather than during render: picking randomly
        // while rendering would give the server and the client different
        // values. The loader is still covering the page at this point, so the
        // change is never seen.
        // `load`, not `applyPreset`: this is not the visitor playing.
        load(randomPreset());
    }, []);

    // The page's ambient glow takes its colours from the tile palette: the
    // first, middle and last stops. globals.css fades between them.
    useEffect(() => {
        const stops = paletteStops(gradient);
        const root = document.documentElement.style;
        root.setProperty('--palette-a', stops[0]);
        root.setProperty('--palette-b', stops[Math.floor(stops.length / 2)]);
        root.setProperty('--palette-c', stops[stops.length - 1]);
        // customColours: re-mixing the custom palette keeps its name.
    }, [gradient, customColours]);

    return (
        <TileSettingsContext.Provider
            value={{
                gradient,
                setGradient,
                wave,
                setWave,
                effect,
                setEffect,
                customColours,
                setCustomColours,
                preset,
                applyPreset,
                randomise,
                controlsOpen,
                setControlsOpen,
                controlsAnchor,
                played,
                cube,
                setCube,
                cubeView,
                setCubeView,
            }}
        >
            {children}
            {/* Fixed, so one instance serves the hero and the footer alike. */}
            <Controls />
            <CubeView />
        </TileSettingsContext.Provider>
    );
};

export const useTileSettings = () => {
    const settings = useContext(TileSettingsContext);
    if (!settings) {
        throw new Error(
            'useTileSettings must be used inside TileSettingsProvider',
        );
    }
    return settings;
};

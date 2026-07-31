'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import {
    GradientName,
    WaveSettings,
    randomGradient,
    randomWave,
} from '@/components/hero/tiles';
import { Preset, presets, randomPreset } from '@/components/hero/presets';
import Controls from '@/components/hero/Controls';

interface TileSettings {
    gradient: GradientName;
    setGradient: (name: GradientName) => void;
    wave: WaveSettings;
    setWave: (wave: WaveSettings) => void;
    /** Name of the preset currently in force, or null once it's been edited. */
    preset: string | null;
    applyPreset: (preset: Preset) => void;
    randomise: () => void;
    controlsOpen: boolean;
    setControlsOpen: (open: boolean) => void;
    /** True once the visitor has touched the field, so hints can step aside. */
    played: boolean;
}

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
    const [preset, setPreset] = useState<string | null>(presets[0].name);
    const [controlsOpen, setControlsOpenState] = useState(false);
    const [played, setPlayed] = useState(false);

    const load = (next: Preset) => {
        setGradientState(next.gradient);
        setWaveState(next.wave);
        setPreset(next.name);
    };

    const applyPreset = (next: Preset) => {
        load(next);
        setPlayed(true);
    };

    const setControlsOpen = (open: boolean) => {
        setControlsOpenState(open);
        if (open) setPlayed(true);
    };

    // Editing anything by hand means no preset is in force any more.
    const setGradient = (name: GradientName) => {
        setGradientState(name);
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

    return (
        <TileSettingsContext.Provider
            value={{
                gradient,
                setGradient,
                wave,
                setWave,
                preset,
                applyPreset,
                randomise,
                controlsOpen,
                setControlsOpen,
                played,
            }}
        >
            {children}
            {/* Fixed, so one instance serves the hero and the footer alike. */}
            <Controls />
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

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { Close, Restore, Shuffle } from '@/components/common/Icons';
import {
    WaveSettings,
    defaultWave,
    gradientNames,
    gradients,
    waveKeys,
    waveRanges,
} from '@/components/hero/tiles';
import { presets } from '@/components/hero/presets';
import PresetPreview from '@/components/hero/PresetPreview';
import { useTileSettings } from '@/components/hero/TileSettings';

const Slider = ({
    settingKey,
    value,
    onChange,
}: {
    settingKey: keyof WaveSettings;
    value: number;
    onChange: (value: number) => void;
}) => {
    const { label, min, max, step } = waveRanges[settingKey];
    // Match the readout to the slider's precision: 0.05 steps reading "1.000"
    // implies a resolution the control does not have.
    const decimals = step >= 1 ? 0 : step >= 0.01 ? 2 : 3;

    return (
        <label className="block">
            <span className="flex items-baseline justify-between gap-3">
                <span className="eyebrow !text-ink-muted">{label}</span>
                <span className="font-mono text-micro tabular-nums text-ink-muted">
                    {value.toFixed(decimals)}
                </span>
            </span>
            <input
                type="range"
                className="mt-2 w-full"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    );
};

const Controls = () => {
    const {
        gradient,
        setGradient,
        wave,
        setWave,
        preset,
        applyPreset,
        randomise,
        controlsOpen: open,
        setControlsOpen,
    } = useTileSettings();

    const onClose = useCallback(() => setControlsOpen(false), [setControlsOpen]);

    const panelRef = useRef<HTMLDivElement>(null);
    const isDefault = waveKeys.every((key) => wave[key] === defaultWave[key]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (panelRef.current?.contains(target)) return;
            // The toggle and randomise buttons live outside the panel but must
            // not dismiss it.
            if (target.closest('[data-hero-controls]')) return;
            onClose();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={panelRef}
                    role="dialog"
                    aria-label="Background controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="card glass-solid fixed bottom-20 right-4 z-40 flex max-h-[min(34rem,calc(100dvh-7rem))] w-[min(20rem,calc(100vw-2rem))] flex-col p-5 backdrop-blur-md sm:right-6"
                >
                    <div className="flex items-center justify-between">
                        <p className="eyebrow !text-ink-muted">Playground</p>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close controls"
                            className="-mr-1 -mt-1 p-1 text-ink-muted transition-colors hover:text-ink"
                        >
                            <Close width={15} height={15} />
                        </button>
                    </div>

                    <div className="-mr-2 mt-4 overflow-y-auto pr-2">
                        <p className="eyebrow !text-ink-muted mb-2">Presets</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {presets.map((item) => (
                                <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => applyPreset(item)}
                                    aria-pressed={preset === item.name}
                                    className={`group rounded-md border p-1 text-left font-mono text-micro transition-colors ${
                                        preset === item.name
                                            ? 'border-ink bg-ink text-paper'
                                            : 'border-line-strong text-ink hover:border-ink'
                                    }`}
                                >
                                    <PresetPreview preset={item} />
                                    <span className="block px-1 pb-0.5 pt-1.5">
                                        {item.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <p className="eyebrow !text-ink-muted mb-2 mt-5">Palette</p>
                        <div className="grid grid-cols-3 gap-1.5">
                            {gradientNames.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setGradient(name)}
                                    title={name}
                                    aria-pressed={gradient === name}
                                    className={`h-7 overflow-hidden rounded-md border transition-all ${
                                        gradient === name
                                            ? 'border-ink ring-1 ring-ink'
                                            : 'border-line hover:border-line-strong'
                                    }`}
                                >
                                    <span className="flex h-full w-full">
                                        {gradients[name].map((color) => (
                                            <span
                                                key={color}
                                                className="h-full flex-1"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                        ))}
                                    </span>
                                    <span className="sr-only">{name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-5 space-y-4 pb-1">
                            {waveKeys.map((key) => (
                                <Slider
                                    key={key}
                                    settingKey={key}
                                    value={wave[key]}
                                    onChange={(value) =>
                                        setWave({ ...wave, [key]: value })
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex shrink-0 gap-2 border-t border-line pt-4">
                        <button
                            type="button"
                            onClick={randomise}
                            className="glass-pill btn btn-primary flex-1 px-3 py-2 text-small"
                        >
                            <Shuffle width={13} height={13} />
                            Randomise
                        </button>
                        <button
                            type="button"
                            onClick={() => setWave(defaultWave)}
                            disabled={isDefault}
                            className="glass-pill btn px-3 py-2 text-small disabled:pointer-events-none disabled:opacity-40"
                        >
                            <Restore width={13} height={13} />
                            Reset
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Controls;

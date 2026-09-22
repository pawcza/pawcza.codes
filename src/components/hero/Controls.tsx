'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
    Close,
    Grid,
    Lens as LensIcon,
    Restore,
    Shuffle,
} from '@/components/common/Icons';
import {
    WaveSettings,
    defaultWave,
    gradientNames,
    mixPaletteStops,
    gradients,
    HoverEffect,
    effectKeys,
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

/** Wave settings shared by both hover effects. */
const sharedKeys = waveKeys.filter(
    (key) => !effectKeys.lens.includes(key) && !effectKeys.grid.includes(key),
);

const effects: {
    id: HoverEffect;
    label: string;
    Icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}[] = [
    { id: 'lens', label: 'Lens', Icon: LensIcon },
    { id: 'grid', label: 'Grid', Icon: Grid },
];

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
        effect,
        setEffect,
        customColours,
        setCustomColours,
    } = useTileSettings();
    const mixed = mixPaletteStops(...customColours);

    const onClose = useCallback(
        () => setControlsOpen(false),
        [setControlsOpen],
    );

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
                                    <span className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1.5">
                                        {item.name}
                                        {item.effect === 'grid' ? (
                                            <Grid
                                                width={11}
                                                height={11}
                                                aria-label="Grid"
                                            />
                                        ) : (
                                            <LensIcon
                                                width={11}
                                                height={11}
                                                aria-label="Lens"
                                            />
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <p className="eyebrow !text-ink-muted mb-2 mt-5">
                            Palette
                        </p>
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

                        <div
                            className={`mt-2 flex items-center gap-2 rounded-md border p-1.5 transition-colors ${
                                gradient === 'custom'
                                    ? 'border-ink ring-1 ring-ink'
                                    : 'border-line'
                            }`}
                        >
                            {/* The mixed palette itself, as the preview. */}
                            <span className="flex h-7 flex-1 overflow-hidden rounded-[0.3rem]">
                                {mixed.map((color, index) => (
                                    <span
                                        key={index}
                                        className="h-full flex-1"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </span>
                            {customColours.map((color, index) => (
                                <label
                                    key={index}
                                    title={`Custom colour ${index + 1}`}
                                    className="relative block h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line-strong"
                                    style={{ backgroundColor: color }}
                                >
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(event) => {
                                            const next: [string, string] = [
                                                ...customColours,
                                            ];
                                            next[index] = event.target.value;
                                            setCustomColours(next);
                                        }}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                        aria-label={`Custom colour ${index + 1}`}
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="mt-5 space-y-4">
                            {sharedKeys.map((key) => (
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

                        <p className="eyebrow !text-ink-muted mb-2 mt-6">
                            Hover
                        </p>
                        <div
                            role="radiogroup"
                            aria-label="Hover effect"
                            className="grid grid-cols-2 gap-1.5"
                        >
                            {effects.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="radio"
                                    aria-checked={effect === id}
                                    onClick={() => setEffect(id)}
                                    className={`flex items-center justify-center gap-2 rounded-md border px-2 py-2 font-mono text-micro transition-colors ${
                                        effect === id
                                            ? 'border-ink bg-ink text-paper'
                                            : 'border-line-strong text-ink hover:border-ink'
                                    }`}
                                >
                                    <Icon width={14} height={14} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 space-y-4 pb-1">
                            {effectKeys[effect].map((key) => (
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

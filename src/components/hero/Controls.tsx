'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
    ChevronLeft,
    ChevronRight,
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
    paletteStops,
    waveKeys,
    waveRanges,
} from '@/components/hero/tiles';
import { presets } from '@/components/hero/presets';
import PresetPreview from '@/components/hero/PresetPreview';
import { useTileSettings } from '@/components/hero/TileSettings';
import { useScrollLock } from '@/components/common/scrollLock';

const Slider = ({
    settingKey,
    value,
    onChange,
}: {
    settingKey: keyof WaveSettings;
    value: number;
    onChange: (value: number) => void;
}) => {
    const { label, description, min, max, step } = waveRanges[settingKey];
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
            <span className="mt-1 block text-micro leading-snug text-ink-faint">
                {description}
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

const effects: {
    id: HoverEffect;
    label: string;
    Icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}[] = [
    { id: 'lens', label: 'Lens', Icon: LensIcon },
    { id: 'grid', label: 'Grid', Icon: Grid },
];

/**
 * The panel opens on these as tiles, each leading to a page of its own. One
 * long scroll of every control buried the useful ones; grouped by what they
 * change, each page is short enough to take in at a glance.
 */
type Section = 'presets' | 'colour' | 'pattern' | 'cursor';

const sections: {
    id: Section;
    label: string;
    /** On the tile: what is inside, in a few words. */
    hint: string;
    /** Atop the page itself. */
    description: string;
}[] = [
    {
        id: 'presets',
        label: 'Presets',
        hint: 'Hand-tuned looks to start from.',
        description:
            'Hand-tuned starting points. The icon shows what the cursor does.',
    },
    {
        id: 'colour',
        label: 'Colour',
        hint: 'Palettes, your own mix and contrast.',
        description:
            'The palette the wave paints with, or a mix of two colours of your own.',
    },
    {
        id: 'pattern',
        label: 'Pattern',
        hint: 'Tile size, speed and the shape of the wave.',
        description: 'The shape of the wave, and the tiles it is drawn on.',
    },
    {
        id: 'cursor',
        label: 'Cursor',
        hint: 'Lens or grid, and how far it reaches.',
        description:
            'What happens to the field around your cursor, or wherever it wanders on its own.',
    },
];

/** Every wave setting lives on exactly one page. */
const colourKeys: (keyof WaveSettings)[] = ['contrast'];
const patternKeys: (keyof WaveSettings)[] = [
    'tileSize',
    'speed',
    'frequency',
    'amplitude',
    'secondaryFrequency',
    'tilt',
];

const Swatches = ({ colors }: { colors: readonly string[] }) => (
    <span className="flex h-full w-full">
        {colors.map((color, index) => (
            <span
                key={index}
                className="h-full flex-1"
                style={{ backgroundColor: color }}
            />
        ))}
    </span>
);

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
        controlsAnchor,
        effect,
        setEffect,
        customColours,
        setCustomColours,
    } = useTileSettings();
    const mixed = mixPaletteStops(...customColours);

    const [section, setSection] = useState<Section | null>(null);
    const backRef = useRef<HTMLButtonElement>(null);
    // The tile to focus as the tiles come back: the one whose page was left.
    // They only mount once that page has animated out, hence on mount.
    const returnTo = useRef<Section | null>(null);

    const onClose = useCallback(
        () => setControlsOpen(false),
        [setControlsOpen],
    );

    // Every opening starts on the tiles.
    useEffect(() => {
        if (!open) setSection(null);
    }, [open]);

    // Opening a page moves focus to its back button, so keyboard users are
    // not left on a tile that no longer exists.
    useEffect(() => {
        if (open && section) backRef.current?.focus();
    }, [open, section]);

    const goBack = () => {
        returnTo.current = section;
        setSection(null);
    };

    const panelRef = useRef<HTMLDivElement>(null);
    // On a phone the panel covers most of the screen, so it takes the scroll.
    // On wider screens it is a small float and the page stays scrollable.
    useScrollLock(open, '(max-width: 767px)');
    const isDefault = waveKeys.every((key) => wave[key] === defaultWave[key]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (panelRef.current?.contains(target)) return;
            // The toggles (the hero's, the nav's) and randomise live outside
            // the panel but must not dismiss it.
            if (
                target.closest('[data-hero-controls], [data-settings-toggle]')
            ) {
                return;
            }
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

    const sliders = (keys: (keyof WaveSettings)[]) => (
        <div className="space-y-5">
            {keys.map((key) => (
                <Slider
                    key={key}
                    settingKey={key}
                    value={wave[key]}
                    onChange={(value) => setWave({ ...wave, [key]: value })}
                />
            ))}
        </div>
    );

    /** What each tile says is set right now. */
    const summary: Record<Section, React.ReactNode> = {
        presets: preset ?? 'Your own mix',
        colour: (
            <span className="block h-2.5 w-full overflow-hidden rounded-sm">
                <Swatches
                    colors={
                        gradient === 'custom' ? mixed : paletteStops(gradient)
                    }
                />
            </span>
        ),
        pattern: `${Math.round(wave.tileSize)}px tiles`,
        cursor: effect === 'lens' ? 'Lens' : 'Grid',
    };

    const current = sections.find((item) => item.id === section);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={panelRef}
                    role="dialog"
                    aria-label="Background settings"
                    // One fixed height for every page, so moving between them
                    // never makes the panel jump; the pages scroll inside it.
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`card glass-solid fixed z-40 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(20rem,calc(100vw-2rem))] flex-col p-5 backdrop-blur-md ${
                        controlsAnchor === 'nav'
                            ? 'inset-x-0 top-[calc(4.25rem+env(safe-area-inset-top))] mx-auto'
                            : 'bottom-20 right-4 sm:right-6'
                    }`}
                >
                    {/* Fixed height, so the back button on a page and the
                        plain title on home line everything up identically. */}
                    <div className="flex h-7 shrink-0 items-center justify-between gap-2">
                        {current ? (
                            <button
                                ref={backRef}
                                type="button"
                                onClick={goBack}
                                // The chevron hangs in the panel's padding (its
                                // 14px plus the 4px gap), so the page title
                                // starts exactly where "Settings" does.
                                className="-ml-[1.125rem] flex items-center gap-1 text-ink-muted transition-colors hover:text-ink"
                            >
                                <ChevronLeft width={14} height={14} />
                                <span className="eyebrow !text-inherit">
                                    {current.label}
                                </span>
                                <span className="sr-only">
                                    , back to all settings
                                </span>
                            </button>
                        ) : (
                            <p className="eyebrow !text-ink-muted">Settings</p>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close settings"
                            className="-mr-1 p-1 text-ink-muted transition-colors hover:text-ink"
                        >
                            <Close width={15} height={15} />
                        </button>
                    </div>

                    <div className="-mr-2 mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-2">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={section ?? 'home'}
                                // Pages slide in from the side they sit on:
                                // deeper to the right, home to the left.
                                // Home fills the panel with its tiles.
                                className={current ? undefined : 'h-full'}
                                initial={{ opacity: 0, x: section ? 12 : -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: section ? -12 : 12 }}
                                transition={{ duration: 0.14, ease: 'easeOut' }}
                            >
                                {!current && (
                                    <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5">
                                        {sections.map((item) => (
                                            <button
                                                key={item.id}
                                                ref={(el) => {
                                                    if (
                                                        el &&
                                                        returnTo.current ===
                                                            item.id
                                                    ) {
                                                        returnTo.current = null;
                                                        el.focus();
                                                    }
                                                }}
                                                type="button"
                                                onClick={() =>
                                                    setSection(item.id)
                                                }
                                                className="group flex min-h-[7rem] flex-col gap-2 rounded-md border border-line-strong p-3 text-left transition-colors hover:border-ink"
                                            >
                                                <span className="flex items-center justify-between gap-2 text-small font-medium text-ink">
                                                    {item.label}
                                                    <ChevronRight
                                                        width={13}
                                                        height={13}
                                                        className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                                                    />
                                                </span>
                                                <span className="block text-micro leading-snug text-ink-faint">
                                                    {item.hint}
                                                </span>
                                                <span className="mt-auto block truncate font-mono text-micro text-ink-muted">
                                                    {summary[item.id]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {current && (
                                    <p className="mb-5 text-small leading-snug text-ink-muted">
                                        {current.description}
                                    </p>
                                )}

                                {section === 'presets' && (
                                    <div className="grid grid-cols-2 gap-1.5 pb-1">
                                        {presets.map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() =>
                                                    applyPreset(item)
                                                }
                                                aria-pressed={
                                                    preset === item.name
                                                }
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
                                )}

                                {section === 'colour' && (
                                    <>
                                        <p className="eyebrow !text-ink-muted mb-2">
                                            Palette
                                        </p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {gradientNames.map((name) => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() =>
                                                        setGradient(name)
                                                    }
                                                    title={name}
                                                    aria-pressed={
                                                        gradient === name
                                                    }
                                                    className={`h-7 overflow-hidden rounded-md border transition-all ${
                                                        gradient === name
                                                            ? 'border-ink ring-1 ring-ink'
                                                            : 'border-line hover:border-line-strong'
                                                    }`}
                                                >
                                                    <Swatches
                                                        colors={gradients[name]}
                                                    />
                                                    <span className="sr-only">
                                                        {name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <p className="eyebrow !text-ink-muted mb-1 mt-5">
                                            Your own
                                        </p>
                                        <p className="mb-2 text-micro leading-snug text-ink-faint">
                                            Pick two colours and the palette is
                                            mixed between them.
                                        </p>
                                        <div
                                            className={`flex items-center gap-2 rounded-md border p-1.5 transition-colors ${
                                                gradient === 'custom'
                                                    ? 'border-ink ring-1 ring-ink'
                                                    : 'border-line'
                                            }`}
                                        >
                                            {/* The mixed palette itself, as the preview. */}
                                            <span className="flex h-7 flex-1 overflow-hidden rounded-[0.3rem]">
                                                <Swatches colors={mixed} />
                                            </span>
                                            {customColours.map(
                                                (color, index) => (
                                                    <label
                                                        key={index}
                                                        title={`Custom colour ${index + 1}`}
                                                        className="relative block h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line-strong"
                                                        style={{
                                                            backgroundColor:
                                                                color,
                                                        }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={color}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                const next: [
                                                                    string,
                                                                    string,
                                                                ] = [
                                                                    ...customColours,
                                                                ];
                                                                next[index] =
                                                                    event.target.value;
                                                                setCustomColours(
                                                                    next,
                                                                );
                                                            }}
                                                            className="absolute inset-0 cursor-pointer opacity-0"
                                                            aria-label={`Custom colour ${index + 1}`}
                                                        />
                                                    </label>
                                                ),
                                            )}
                                        </div>

                                        <div className="mt-6 pb-1">
                                            {sliders(colourKeys)}
                                        </div>
                                    </>
                                )}

                                {section === 'pattern' && (
                                    <div className="pb-1">
                                        {sliders(patternKeys)}
                                    </div>
                                )}

                                {section === 'cursor' && (
                                    <>
                                        <div
                                            role="radiogroup"
                                            aria-label="Cursor effect"
                                            className="grid grid-cols-2 gap-1.5"
                                        >
                                            {effects.map(
                                                ({ id, label, Icon }) => (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={
                                                            effect === id
                                                        }
                                                        onClick={() =>
                                                            setEffect(id)
                                                        }
                                                        className={`flex items-center justify-center gap-2 rounded-md border px-2 py-2 font-mono text-micro transition-colors ${
                                                            effect === id
                                                                ? 'border-ink bg-ink text-paper'
                                                                : 'border-line-strong text-ink hover:border-ink'
                                                        }`}
                                                    >
                                                        <Icon
                                                            width={14}
                                                            height={14}
                                                        />
                                                        {label}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                        <p className="mb-5 mt-2 text-micro leading-snug text-ink-faint">
                                            {effect === 'lens'
                                                ? 'Magnifies the tiles like a glass bead rolled over them.'
                                                : 'Draws the grid between the tiles, fading out from the centre.'}
                                        </p>
                                        <div className="pb-1">
                                            {sliders(effectKeys[effect])}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
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

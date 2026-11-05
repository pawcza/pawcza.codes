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
    Rise,
    Shuffle,
} from '@/components/common/Icons';
import {
    WaveSettings,
    defaultWave,
    gradientNames,
    mixPaletteStops,
    gradients,
    HoverEffect,
    RELIEF_MAX,
    effectKeys,
    paletteStops,
    waveKeys,
} from '@/components/hero/tiles';
import { presets } from '@/components/hero/presets';
import PresetPreview from '@/components/hero/PresetPreview';
import { CoreShape, useTileSettings } from '@/components/hero/TileSettings';
import { useScrollLock } from '@/components/common/scrollLock';
import { RangeSlider, Slider, Swatches } from '@/components/hero/ControlsParts';
import { useSettingsSheet } from '@/components/hero/useSettingsSheet';

const effects: {
    id: HoverEffect;
    label: string;
    description: string;
    Icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}[] = [
    {
        id: 'rise',
        label: 'Rise',
        description: 'Lifts the tiles under the cursor up off the field.',
        Icon: Rise,
    },
    {
        id: 'lens',
        label: 'Lens',
        description: 'Magnifies the tiles like a glass bead rolled over them.',
        Icon: LensIcon,
    },
    {
        id: 'grid',
        label: 'Grid',
        description:
            'Draws the grid between the tiles, fading out from the centre.',
        Icon: Grid,
    },
];

const effectOf = (id: HoverEffect) =>
    effects.find((item) => item.id === id) ?? effects[0];

/**
 * The panel opens on these as tiles, each leading to a page of its own. One
 * long scroll of every control buried the useful ones; grouped by what they
 * change, each page is short enough to take in at a glance.
 */
type Section = 'presets' | 'colour' | 'pattern' | 'cursor' | 'cube';

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
        hint: 'Rise, lens or grid, and how far it reaches.',
        description:
            'What happens to the field around your cursor, or wherever it wanders on its own.',
    },
    {
        id: 'cube',
        label: 'Cube',
        hint: 'The toy cubes: their relief and the size of their blocks.',
        description:
            'The cubes beside the title and in the footer, built from the same field, one block per tile. Drag one to spin it, click it to open it up.',
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
    'relief',
];

const coreShapes: { id: CoreShape; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'cube', label: 'Cube' },
    { id: 'sphere', label: 'Sphere' },
    { id: 'diamond', label: 'Diamond' },
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
        controlsAnchor,
        effect,
        setEffect,
        customColours,
        setCustomColours,
        cube,
        setCube,
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

    // Every opening starts on the tiles: everything there matters to the
    // cube as much as to the page.
    useEffect(() => {
        if (!open) setSection(null);
    }, [open]);

    const panelRef = useRef<HTMLDivElement>(null);
    const {
        sheet,
        sheetHeight,
        grabRef,
        scrollRef,
        footerRef,
        onGrabDown,
        onGrabMove,
        onGrabUp,
    } = useSettingsSheet(open, controlsAnchor, panelRef);

    // Opening a page moves focus to its back button, so keyboard users are
    // not left on a tile that no longer exists.
    // Not when it opens docked beside the full-screen cube: that view puts
    // focus on its own close button, and the panel is only alongside it.
    useEffect(() => {
        if (open && section && controlsAnchor !== 'view') {
            backRef.current?.focus();
        }
    }, [open, section, controlsAnchor]);

    const goBack = () => {
        returnTo.current = section;
        setSection(null);
    };

    // On a phone the panel covers most of the screen, so it takes the scroll.
    // On wider screens it is a small float and the page stays scrollable.
    useScrollLock(open, '(max-width: 767px)');
    const isDefault = waveKeys.every((key) => wave[key] === defaultWave[key]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            // Beside the full-screen cube, dragging the cube must not close
            // it: that view has its own way out.
            if (controlsAnchor === 'view') return;
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
            // Beside the full-screen cube, Escape belongs to the view, which
            // closes this panel along with itself.
            if (event.key === 'Escape' && controlsAnchor !== 'view') onClose();
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, controlsAnchor]);

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
        cursor: effectOf(effect).label,
        cube: `Relief ${cube.relief.toFixed(1)}`,
    };

    const current = sections.find((item) => item.id === section);

    // Where the floating panel sits (from the phone's drawer up).
    const panelPlace =
        controlsAnchor === 'nav'
            ? 'z-40 inset-x-0 top-[calc(4.25rem+env(safe-area-inset-top))] mx-auto'
            : controlsAnchor === 'view'
              ? // Docked beside the full-screen cube, above its backdrop.
                'z-[70] right-6 top-1/2 -translate-y-1/2'
              : 'z-40 bottom-20 right-4 sm:right-6';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={panelRef}
                    role="dialog"
                    aria-label="Background settings"
                    // One fixed height for every page, so moving between them
                    // never makes the panel jump; the pages scroll inside it.
                    initial={{ opacity: 0, y: sheet ? 24 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: sheet ? 24 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={sheet ? { height: sheetHeight } : undefined}
                    className={`card fixed flex flex-col ${
                        sheet
                            ? `inset-x-0 bottom-0 overflow-hidden rounded-b-none px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] ${
                                  controlsAnchor === 'view' ? 'z-[70]' : 'z-40'
                              }`
                            : `h-[min(34rem,calc(100dvh-7rem))] w-[min(20rem,calc(100vw-2rem))] p-5 ${panelPlace}`
                    }`}
                >
                    {sheet && (
                        // The drawer's handle: drag it up or down, or tap it.
                        <div
                            ref={grabRef}
                            onPointerDown={onGrabDown}
                            onPointerMove={onGrabMove}
                            onPointerUp={onGrabUp}
                            onPointerCancel={onGrabUp}
                            aria-hidden="true"
                            className="-mx-4 flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
                        >
                            <span className="h-1 w-12 rounded-full bg-ink-faint" />
                        </div>
                    )}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                                <p className="eyebrow !text-ink-muted">
                                    Settings
                                </p>
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

                        <div
                            ref={scrollRef}
                            className="-mr-2 mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-2"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={section ?? 'home'}
                                    // Pages slide in from the side they sit on:
                                    // deeper to the right, home to the left.
                                    // Home fills the panel with its tiles.
                                    className={current ? undefined : 'h-full'}
                                    initial={{
                                        opacity: 0,
                                        x: section ? 12 : -12,
                                    }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: section ? -12 : 12 }}
                                    transition={{
                                        duration: 0.14,
                                        ease: 'easeOut',
                                    }}
                                >
                                    {!current && (
                                        <div className="grid min-h-full grid-cols-2 grid-rows-[repeat(3,minmax(min-content,1fr))] gap-1.5">
                                            {sections.map((item) => (
                                                <button
                                                    key={item.id}
                                                    ref={(el) => {
                                                        if (
                                                            el &&
                                                            returnTo.current ===
                                                                item.id
                                                        ) {
                                                            returnTo.current =
                                                                null;
                                                            el.focus();
                                                        }
                                                    }}
                                                    type="button"
                                                    onClick={() =>
                                                        setSection(item.id)
                                                    }
                                                    className={`group flex flex-col rounded-md border border-line-strong text-left transition-colors hover:border-ink ${
                                                        sheet
                                                            ? 'min-h-[4.5rem] gap-1 p-2.5'
                                                            : 'min-h-[6rem] gap-2 p-3'
                                                    } ${
                                                        item.id === 'cube'
                                                            ? 'col-span-2'
                                                            : ''
                                                    }`}
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
                                                    <PresetPreview
                                                        preset={item}
                                                    />
                                                    <span className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1.5">
                                                        {item.name}
                                                        {(() => {
                                                            const {
                                                                Icon,
                                                                label,
                                                            } = effectOf(
                                                                item.effect ??
                                                                    'rise',
                                                            );
                                                            return (
                                                                <Icon
                                                                    width={11}
                                                                    height={11}
                                                                    aria-label={
                                                                        label
                                                                    }
                                                                />
                                                            );
                                                        })()}
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
                                                            colors={
                                                                gradients[name]
                                                            }
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
                                                Pick two colours and the palette
                                                is mixed between them.
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
                                                                    next[
                                                                        index
                                                                    ] =
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
                                                className="grid grid-cols-3 gap-1.5"
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
                                                {effectOf(effect).description}
                                            </p>
                                            <div className="pb-1">
                                                {sliders(effectKeys[effect])}
                                            </div>
                                        </>
                                    )}
                                    {section === 'cube' && (
                                        <div className="space-y-5 pb-1">
                                            <RangeSlider
                                                label="Relief"
                                                description="How far the wave lifts the blocks off the cube. All the way up, they fly apart."
                                                min={0}
                                                max={RELIEF_MAX}
                                                step={0.05}
                                                value={cube.relief}
                                                onChange={(relief) =>
                                                    setCube({ ...cube, relief })
                                                }
                                            />
                                            <RangeSlider
                                                label="Block width"
                                                description="Each block's footprint, as a share of its tile. Smaller leaves gaps between them."
                                                min={0.2}
                                                max={1}
                                                step={0.01}
                                                value={cube.blockWidth}
                                                onChange={(blockWidth) =>
                                                    setCube({
                                                        ...cube,
                                                        blockWidth,
                                                    })
                                                }
                                            />
                                            <RangeSlider
                                                label="Block height"
                                                description="How thick each block is: thin tiles at the bottom, tall columns at the top."
                                                min={0.1}
                                                max={1}
                                                step={0.01}
                                                value={cube.blockHeight}
                                                onChange={(blockHeight) =>
                                                    setCube({
                                                        ...cube,
                                                        blockHeight,
                                                    })
                                                }
                                            />

                                            <div className="border-t border-line pt-5">
                                                <p className="eyebrow !text-ink-muted">
                                                    Core
                                                </p>
                                                <p className="mt-1 text-micro leading-snug text-ink-faint">
                                                    What sits inside the blocks,
                                                    if anything. None leaves the
                                                    cube hollow.
                                                </p>
                                                <div
                                                    role="radiogroup"
                                                    aria-label="Core shape"
                                                    className="mt-2 grid grid-cols-4 gap-1.5"
                                                >
                                                    {coreShapes.map(
                                                        ({ id, label }) => (
                                                            <button
                                                                key={id}
                                                                type="button"
                                                                role="radio"
                                                                aria-checked={
                                                                    cube.core ===
                                                                    id
                                                                }
                                                                onClick={() =>
                                                                    setCube({
                                                                        ...cube,
                                                                        core: id,
                                                                    })
                                                                }
                                                                className={`rounded-md border px-1 py-2 font-mono text-micro transition-colors ${
                                                                    cube.core ===
                                                                    id
                                                                        ? 'border-ink bg-ink text-paper'
                                                                        : 'border-line-strong text-ink hover:border-ink'
                                                                }`}
                                                            >
                                                                {label}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {cube.core !== 'none' && (
                                                <>
                                                    <label className="flex items-center justify-between gap-3">
                                                        <span>
                                                            <span className="eyebrow !text-ink-muted">
                                                                Core colour
                                                            </span>
                                                            <span className="mt-1 block text-micro leading-snug text-ink-faint">
                                                                Lit by the same
                                                                palette light as
                                                                the blocks.
                                                            </span>
                                                        </span>
                                                        <span
                                                            className="relative block h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line-strong"
                                                            style={{
                                                                backgroundColor:
                                                                    cube.coreColor,
                                                            }}
                                                        >
                                                            <input
                                                                type="color"
                                                                value={
                                                                    cube.coreColor
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setCube({
                                                                        ...cube,
                                                                        coreColor:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                }
                                                                aria-label="Core colour"
                                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                            />
                                                        </span>
                                                    </label>
                                                    <RangeSlider
                                                        label="Core size"
                                                        description="How much of the space inside the blocks it fills."
                                                        min={0.1}
                                                        max={1}
                                                        step={0.01}
                                                        value={cube.coreSize}
                                                        onChange={(coreSize) =>
                                                            setCube({
                                                                ...cube,
                                                                coreSize,
                                                            })
                                                        }
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div
                        ref={footerRef}
                        className={
                            sheet
                                ? 'mt-2 flex shrink-0 gap-2'
                                : 'mt-4 flex shrink-0 gap-2 border-t border-line pt-4'
                        }
                    >
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

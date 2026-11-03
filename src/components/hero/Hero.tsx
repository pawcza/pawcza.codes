'use client';

import MatrixText from '@/components/common/MatrixText';
import TileCanvas from '@/components/hero/TileCanvas';
import { useTileSettings } from '@/components/hero/TileSettings';
import { Shuffle, Sliders } from '@/components/common/Icons';
import { profile } from '@/content/profile';
import ThemeToggle from '@/components/common/ThemeToggle';
import ToyCube from '@/components/cube/ToyCube';

const Hero = () => {
    const { randomise, controlsOpen, setControlsOpen, played } =
        useTileSettings();

    return (
        <header
            id="top"
            className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden"
        >
            <TileCanvas scrim="hero" />
            <div className="hero-scrim" aria-hidden="true" />
            <div className="hero-fade" aria-hidden="true" />

            <div className="relative mx-auto flex w-full max-w-content flex-col-reverse gap-6 px-6 pb-20 pt-32 sm:flex-row sm:items-end sm:justify-between md:pb-28">
                {/* The title and its line; on phones the cube sits above them. */}
                <div className="min-w-0">
                    {/* Everything in the hero builds in square by square,
                        once the field has. */}
                    <h1 data-squares="" data-squares-after="field">
                        {/* Long enough to still be resolving as its big
                            squares land. */}
                        <MatrixText
                            intro
                            mono={false}
                            duration={1600}
                            classNames="display text-display"
                        >
                            pawcza.codes
                        </MatrixText>
                    </h1>

                    {/* Dash and all, just after the title. */}
                    <div
                        data-squares=""
                        data-squares-after="field"
                        data-squares-delay="0.3"
                        className="mt-5 flex items-center gap-3"
                    >
                        <span
                            className="h-px w-8 bg-line-strong shrink-0"
                            aria-hidden="true"
                        />
                        <MatrixText
                            intro
                            classNames="text-small font-medium tracking-tight text-ink"
                        >
                            {profile.tagline}
                        </MatrixText>
                    </div>
                </div>

                <ToyCube
                    place="hero"
                    className="w-32 self-end sm:mb-2 sm:w-44 md:w-56"
                />
            </div>

            {/* On phones the nav carries the toggle but only appears once the
                hero scrolls away, so until then the switch lives up here. On
                wider screens the nav is always there, toggle included. */}
            <div className="absolute right-4 top-4 z-40 sm:right-6 sm:top-6 md:hidden">
                <ThemeToggle className="glass-pill btn-icon" />
            </div>

            <div
                data-hero-controls
                className="absolute bottom-6 right-4 z-40 flex items-center gap-2 sm:right-6"
            >
                {/* Quiet nudge, and only until the visitor takes it. */}
                <span
                    className={`hidden font-mono text-micro tracking-tight text-ink-faint transition-opacity duration-500 sm:inline ${
                        played ? 'opacity-0' : 'opacity-100'
                    }`}
                    aria-hidden={played}
                >
                    play with the background
                </span>
                <button
                    type="button"
                    onClick={randomise}
                    title="Randomise the background"
                    className="glass-pill btn-icon"
                >
                    <Shuffle width={15} height={15} />
                    <span className="sr-only">Randomise the background</span>
                </button>
                <button
                    type="button"
                    onClick={() => setControlsOpen(!controlsOpen)}
                    title="Play with the background"
                    aria-expanded={controlsOpen}
                    // Open reads as pressed: same button, ink icon and a ring.
                    className={`glass-pill btn-icon ${
                        controlsOpen
                            ? '!text-ink ring-1 ring-inset ring-ink/30'
                            : ''
                    }`}
                >
                    <Sliders width={15} height={15} />
                    <span className="sr-only">Play with the background</span>
                </button>
            </div>
        </header>
    );
};

export default Hero;

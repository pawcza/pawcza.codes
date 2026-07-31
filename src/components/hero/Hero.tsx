'use client';

import MatrixText from '@/components/common/MatrixText';
import TileCanvas from '@/components/hero/TileCanvas';
import { useTileSettings } from '@/components/hero/TileSettings';
import { Shuffle, Sliders } from '@/components/common/Icons';
import { useIntroDone } from '@/components/common/intro';
import { profile } from '@/content/profile';

const Hero = () => {
    const { gradient, wave, randomise, controlsOpen, setControlsOpen, played } =
        useTileSettings();
    // Hold every load-time reveal until the loader has cleared the screen.
    const introDone = useIntroDone();

    return (
        <header
            id="top"
            className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden"
        >
            <TileCanvas gradient={gradient} wave={wave} />
            <div className="hero-scrim" aria-hidden="true" />
            <div className="hero-fade" aria-hidden="true" />

            <div className="relative mx-auto w-full max-w-content px-6 pb-20 pt-32 md:pb-28">
                <h1>
                    <MatrixText
                        hasStarted={introDone}
                        mono={false}
                        classNames="display text-[clamp(2.75rem,1.5rem+6vw,6.5rem)]"
                    >
                        {'Paweł\nCzarniecki'}
                    </MatrixText>
                </h1>

                <div className="mt-5 flex items-center gap-3">
                    <span
                        className="h-px w-8 bg-line-strong shrink-0"
                        aria-hidden="true"
                    />
                    <MatrixText
                        hasStarted={introDone}
                        classNames="text-sm md:text-base font-medium tracking-tight text-ink"
                    >
                        {profile.role}
                    </MatrixText>
                </div>
            </div>

            <div
                data-hero-controls
                className="absolute bottom-6 right-4 z-40 flex items-center gap-2 sm:right-6"
            >
                {/* Quiet nudge, and only until the visitor takes it. */}
                <span
                    className={`hidden font-mono text-[0.6875rem] tracking-tight text-ink-faint transition-opacity duration-500 sm:inline ${
                        introDone && !played ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden={played}
                >
                    play with the background
                </span>
                <button
                    type="button"
                    onClick={randomise}
                    title="Randomise the background"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper/60 text-ink-faint backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink"
                >
                    <Shuffle width={15} height={15} />
                    <span className="sr-only">Randomise the background</span>
                </button>
                <button
                    type="button"
                    onClick={() => setControlsOpen(!controlsOpen)}
                    title="Play with the background"
                    aria-expanded={controlsOpen}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
                        controlsOpen
                            ? 'border-ink bg-ink text-paper'
                            : 'border-line bg-paper/60 text-ink-faint hover:border-line-strong hover:text-ink'
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

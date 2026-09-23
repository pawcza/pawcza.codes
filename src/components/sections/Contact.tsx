'use client';

import Reveal from '@/components/common/Reveal';
import TileCanvas from '@/components/hero/TileCanvas';
import { useTileSettings } from '@/components/hero/TileSettings';
import MatrixText from '@/components/common/MatrixText';
import {
    ArrowUpRight,
    Download,
    Github,
    LinkedIn,
    Shuffle,
    Sliders,
} from '@/components/common/Icons';
import { profile } from '@/content/profile';
import ContactForm from '@/components/sections/ContactForm';

const links = [
    { label: 'GitHub', href: profile.github, Icon: Github },
    { label: 'LinkedIn', href: profile.linkedin, Icon: LinkedIn },
];

const Contact = () => {
    const { gradient, wave, effect, randomise, setControlsOpen } = useTileSettings();

    return (
        <footer
            id="contact"
            className="relative isolate mt-8 overflow-hidden"
        >
            <TileCanvas gradient={gradient} wave={wave} effect={effect} />
            <div className="footer-scrim" aria-hidden="true" />
            <div className="footer-fade" aria-hidden="true" />

            <div className="relative mx-auto w-full max-w-content px-6 py-20 md:py-28">
                <div>
                    <div>
                        <p data-squares="" className="eyebrow">
                            05
                        </p>
                        <h2 className="mt-3">
                            <MatrixText
                                startOnView
                                mono={false}
                                classNames="heading max-w-prose text-title"
                            >
                                Let’s build yours
                            </MatrixText>
                        </h2>
                        <p
                            data-squares=""
                            className="mt-4 text-heading font-medium text-ink"
                        >
                            You bring the idea, I’ll handle the rest.
                        </p>
                        <p
                            data-squares=""
                            data-squares-delay="0.1"
                            className="lede mt-3 max-w-prose"
                        >
                            Design, code and launch. Tell me what you’re
                            building and I’ll show you how I’d get it live.
                        </p>
                    </div>

                    <Reveal delay={0.1}>
                        <div className="mt-10">
                            <ContactForm />
                        </div>

                        <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <li>
                                <a
                                    href={profile.cv}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-small text-ink-muted transition-colors hover:text-ink"
                                >
                                    <Download width={15} height={15} />
                                    <span className="link-underline">CV</span>
                                </a>
                            </li>
                            {links.map(({ label, href, Icon }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-small text-ink-muted transition-colors hover:text-ink"
                                    >
                                        <Icon width={15} height={15} />
                                        <span className="link-underline">
                                            {label}
                                        </span>
                                        <ArrowUpRight width={12} height={12} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    <Reveal delay={0.15}>
                        {/* No surface of its own: the point is to watch the field react. */}
                        <div className="mt-20 md:mt-24">
                            <p className="eyebrow">The background</p>
                            <h3 className="heading mt-2 text-heading">
                                By the way, all of this is a toy.
                            </h3>
                            <p className="prose-body mt-3 max-w-prose text-body">
                                Try to break it.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={randomise}
                                    className="glass-pill btn btn-primary"
                                >
                                    <Shuffle width={15} height={15} />
                                    Randomise it
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setControlsOpen(true)}
                                    className="glass-pill btn"
                                >
                                    <Sliders width={15} height={15} />
                                    Open the settings
                                </button>
                            </div>
                        </div>
                    </Reveal>
                </div>

                <div className="edge-line mt-16 border-t border-line pt-6">
                    <p className="font-mono text-micro text-ink-muted">
                        © {new Date().getFullYear()} pawcza.codes
                    </p>
                </div>
            </div>
            {/* The top rule as an element rather than a border: the footer
                clips its overflow, which would clip a glow on its own edge.
                Last in the footer so it paints over the canvas; no z-index,
                which would isolate its difference-blended glow. */}
            <div
                aria-hidden
                className="edge-line absolute inset-x-0 top-0 h-px bg-line"
            />
        </footer>
    );
};

export default Contact;

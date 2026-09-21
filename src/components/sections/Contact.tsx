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
    Mail,
    Phone,
    Shuffle,
    Sliders,
} from '@/components/common/Icons';
import { profile } from '@/content/profile';

const links = [
    { label: 'GitHub', href: profile.github, Icon: Github },
    { label: 'LinkedIn', href: profile.linkedin, Icon: LinkedIn },
];

const Contact = () => {
    const { gradient, wave, randomise, setControlsOpen } =
        useTileSettings();

    return (
    <footer
        id="contact"
        className="relative isolate mt-8 overflow-hidden border-t border-line"
    >
        <TileCanvas gradient={gradient} wave={wave} />
            <div className="footer-scrim" aria-hidden="true" />
            <div className="footer-fade" aria-hidden="true" />

            <div className="relative mx-auto w-full max-w-content px-6 py-20 md:py-28">
            <Reveal>
                <h2>
                    <MatrixText
                        startOnView
                        mono={false}
                        classNames="heading max-w-prose text-[clamp(1.75rem,1.2rem+2.6vw,3.25rem)]"
                    >
                        Say hello
                    </MatrixText>
                </h2>
                <p className="mt-4 text-[clamp(1.125rem,0.95rem+0.8vw,1.5rem)] font-medium tracking-tight text-ink">
                    Hey, I’m Paweł.
                </p>
                <p className="lede mt-3 max-w-prose">
                    Work, a side project, or something you are just tinkering
                    with. Always up for a conversation and open to new projects.
                </p>
            </Reveal>

            <Reveal delay={0.1}>
                <div className="mt-10 flex flex-wrap items-center gap-2">
                    <a
                        href={`mailto:${profile.email}`}
                        className="glass-pill btn btn-primary"
                    >
                        <Mail />
                        {profile.email}
                    </a>
                    <a
                        href={`tel:${profile.phoneHref}`}
                        className="glass-pill btn"
                    >
                        <Phone />
                        {profile.phone}
                    </a>
                    <a
                        href={profile.cv}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-pill btn"
                    >
                        <Download />
                        CV
                    </a>
                </div>

                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                    {links.map(({ label, href, Icon }) => (
                        <li key={label}>
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
                            >
                                <Icon width={15} height={15} />
                                <span className="link-underline">{label}</span>
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
                        <h3 className="heading mt-2 text-xl md:text-2xl">
                            By the way, all of this is a toy.
                        </h3>
                        <p className="prose-body mt-3 max-w-prose text-[0.9375rem]">
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
                                Open the playground
                            </button>
                        </div>
                    </div>
                </Reveal>

                <div className="edge-line mt-16 border-t border-line pt-6">
                <p className="font-mono text-xs text-ink-muted">
                    © {new Date().getFullYear()} pawcza.codes
                </p>
            </div>
        </div>
        </footer>
    );
};

export default Contact;

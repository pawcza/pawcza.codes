'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/components/common/motion';
import TileReveal from '@/components/work/TileReveal';
import { Project } from '@/content/projects';

/** How far a cover leans towards the cursor, in degrees. */
const MAX_TILT = 5;

/**
 * The project's logo on its brand background, framed.
 *
 * With a `preview` clip, the still crossfades into a short looping recording:
 * on hover or focus with a mouse, and on touch screens while the thumbnail is
 * mostly on screen (an IntersectionObserver, so nothing runs per scroll
 * event). The clip is not fetched until it is first needed. Reduced motion
 * keeps the still, and so does a touch device with Data Saver on.
 */
const ProjectCover = ({
    project,
    sizes,
    priority = false,
}: {
    project: Project;
    sizes: string;
    priority?: boolean;
}) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const tiltRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);

    // Leans towards the cursor. Only ever set while hovering, so nine covers
    // are not nine layers for the whole visit.
    useEffect(() => {
        const tilt = tiltRef.current;
        const card = tilt?.closest('article');
        if (
            !tilt ||
            !card ||
            prefersReducedMotion() ||
            !window.matchMedia('(hover: hover) and (pointer: fine)').matches
        ) {
            return;
        }
        let frame = 0;
        let x = 0;
        let y = 0;
        const apply = () => {
            frame = 0;
            const box = tilt.getBoundingClientRect();
            const rx = ((y - box.top) / box.height - 0.5) * -2;
            const ry = ((x - box.left) / box.width - 0.5) * 2;
            const clamp = (v: number) =>
                Math.max(-1, Math.min(1, v)) * MAX_TILT;
            tilt.style.transform = `perspective(70rem) rotateX(${clamp(rx).toFixed(2)}deg) rotateY(${clamp(ry).toFixed(2)}deg)`;
        };
        const onMove = (event: Event) => {
            const { clientX, clientY } = event as PointerEvent;
            x = clientX;
            y = clientY;
            frame ||= requestAnimationFrame(apply);
        };
        const onLeave = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            tilt.style.transform = '';
        };
        card.addEventListener('pointermove', onMove);
        card.addEventListener('pointerleave', onLeave);
        return () => {
            cancelAnimationFrame(frame);
            card.removeEventListener('pointermove', onMove);
            card.removeEventListener('pointerleave', onLeave);
        };
    }, []);

    // Progress bar: driven by rAF while playing and written straight to the
    // DOM, so it moves smoothly without re-rendering the card every frame.
    useEffect(() => {
        const video = videoRef.current;
        const bar = progressRef.current;
        if (!playing || !video || !bar) return;

        let frame = 0;
        const tick = () => {
            if (video.duration) {
                bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [playing]);

    // Scroll reveal: the first time the cover is a third on screen it builds
    // itself from squares (TileReveal), then the real image takes over and
    // the squares are dropped. Skipped, straight to the image, for reduced
    // motion.
    const [reveal, setReveal] = useState<'waiting' | 'building' | 'done'>(
        'waiting',
    );

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;
        if (prefersReducedMotion()) {
            setReveal('done');
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                setReveal('building');
            },
            { threshold: 0.33 },
        );
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const card = frameRef.current?.closest('article');
        if (!video || !card) return;

        if (prefersReducedMotion()) return;
        const hover = window.matchMedia(
            '(hover: hover) and (pointer: fine)',
        ).matches;

        const start = () => {
            video.preload = 'auto';
            video.play().catch(() => {});
        };
        const stop = () => {
            setPlaying(false);
            video.pause();
            // Rewind once the fade-out is over, so the next hover starts clean.
            window.setTimeout(() => {
                if (video.paused) video.currentTime = 0;
            }, 500);
        };

        if (!hover) {
            const saveData = (
                navigator as Navigator & { connection?: { saveData?: boolean } }
            ).connection?.saveData;
            if (saveData) return;

            // Plays while at least 60% of the thumbnail is visible, so only
            // the one being looked at runs as the page scrolls past.
            const observer = new IntersectionObserver(
                ([entry]) => (entry.isIntersecting ? start() : stop()),
                { threshold: 0.6 },
            );
            observer.observe(video);
            return () => observer.disconnect();
        }

        const onFocusOut = (event: FocusEvent) => {
            if (!card.contains(event.relatedTarget as Node | null)) stop();
        };

        card.addEventListener('pointerenter', start);
        card.addEventListener('pointerleave', stop);
        card.addEventListener('focusin', start);
        card.addEventListener('focusout', onFocusOut);
        return () => {
            card.removeEventListener('pointerenter', start);
            card.removeEventListener('pointerleave', stop);
            card.removeEventListener('focusin', start);
            card.removeEventListener('focusout', onFocusOut);
        };
    }, []);

    return (
        // The only surface a project gets: glass sitting right on the image
        // edge (rim and edge glow from .glass), with a gloss laid over the top
        // of the screenshot. The entry around it stays open.
        // No blur: the opaque image fills it, so there is nothing to see through.
        <div
            ref={tiltRef}
            className="cover-tilt glass glass-frame rounded-[var(--radius)]"
        >
            <div
                ref={frameRef}
                className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius)] bg-paper"
            >
                <div
                    className={`absolute inset-0 ${
                        reveal === 'done' ? '' : 'cover-wait'
                    }`}
                >
                    <Image
                        ref={imageRef}
                        src={project.logo}
                        alt=""
                        fill
                        sizes={sizes}
                        priority={priority}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    />
                </div>
                {reveal !== 'done' && (
                    <TileReveal
                        image={imageRef}
                        seed={project.slug}
                        playing={reveal === 'building'}
                        onDone={() => setReveal('done')}
                    />
                )}
                {project.preview && (
                    <video
                        ref={videoRef}
                        src={project.preview}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden
                        tabIndex={-1}
                        // Only fade in once frames are actually painting, so a
                        // slow first load never flashes an empty black box.
                        onPlaying={() => setPlaying(true)}
                        className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ease-out ${
                            playing ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                )}
                <div aria-hidden className="cover-gloss" />
                {project.preview && (
                    <div
                        aria-hidden
                        className={`absolute inset-x-0 bottom-0 h-[3px] bg-black/20 transition-opacity duration-500 ${
                            playing ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div
                            ref={progressRef}
                            className="h-full origin-left scale-x-0 bg-white/85"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCover;

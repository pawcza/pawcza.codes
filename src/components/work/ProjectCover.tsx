'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { Project } from '@/content/projects';

/**
 * The first screenshot, framed. Projects without screenshots yet fall back to
 * a typographic tile so the layout never shows an empty box.
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
    const cover = project.shots.find((shot) => shot.device === 'desktop');
    const frameRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);

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

    useEffect(() => {
        const video = videoRef.current;
        const card = frameRef.current?.closest('article');
        if (!video || !card) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
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
        <div className="glass rounded-[var(--radius)]">
            <div
                ref={frameRef}
                className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius)] bg-paper"
            >
                {cover ? (
                    <Image
                        src={cover.src}
                        alt=""
                        fill
                        sizes={sizes}
                        priority={priority}
                        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    />
                ) : (
                    <div className="flex h-full items-end p-6">
                        <span className="heading text-3xl text-ink-faint">
                            {project.name}
                        </span>
                    </div>
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

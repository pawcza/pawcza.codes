'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { ArrowUpRight, Close, Lock } from '@/components/common/Icons';
import { Project, Shot } from '@/content/projects';
import { useScrollLock } from '@/components/common/scrollLock';

/** Intrinsic sizes of the exported screenshots, per device. */
const dimensions = {
    desktop: { width: 2400, height: 1500 },
    mobile: { width: 780, height: 1688 },
} as const;

const Chevron = ({ flip = false }: { flip?: boolean }) => (
    <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
        <path d="m9 6 6 6-6 6" />
    </svg>
);

const Gallery = ({ shots, name }: { shots: Shot[]; name: string }) => {
    const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
    const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const rootRef = useRef<HTMLDivElement>(null);

    const go = useCallback(
        (next: number) => {
            const wrapped = (next + shots.length) % shots.length;
            setPage(([current]) => [wrapped, next > current ? 1 : -1]);
        },
        [shots.length],
    );

    useEffect(() => {
        thumbRefs.current[index]?.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
            behavior: 'smooth',
        });
    }, [index]);

    // Listens on the dialog, so arrows work wherever focus is inside it.
    useEffect(() => {
        const dialog = rootRef.current?.closest('dialog');
        if (!dialog || shots.length < 2) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (!dialog.open) return;
            if (event.key === 'ArrowRight') go(index + 1);
            if (event.key === 'ArrowLeft') go(index - 1);
        };

        dialog.addEventListener('keydown', onKeyDown);
        return () => dialog.removeEventListener('keydown', onKeyDown);
    }, [go, index, shots.length]);

    if (shots.length === 0) {
        return (
            <div className="flex h-full min-h-[16rem] flex-col items-start justify-end gap-2 p-8">
                <span className="heading text-title text-ink-faint">
                    {name}
                </span>
                <span className="eyebrow">Screenshots on the way</span>
            </div>
        );
    }

    const shot = shots[index];
    const size = dimensions[shot.device];

    return (
        <div
            ref={rootRef}
            className="flex h-full min-h-0 flex-col"
            aria-roledescription="carousel"
            aria-label={`${name} screenshots`}
        >
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={index}
                        custom={direction}
                        className="absolute inset-4 flex cursor-grab items-center justify-center active:cursor-grabbing md:inset-8"
                        initial={{ opacity: 0, x: direction * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -40 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.2, 0.8, 0.2, 1],
                        }}
                        drag={shots.length > 1 ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.x < -60) go(index + 1);
                            if (info.offset.x > 60) go(index - 1);
                        }}
                    >
                        <Image
                            src={shot.src}
                            alt={shot.alt}
                            width={size.width}
                            height={size.height}
                            sizes={
                                shot.device === 'mobile'
                                    ? '(min-width: 768px) 24rem, 60vw'
                                    : '(min-width: 768px) 56rem, 100vw'
                            }
                            draggable={false}
                            className={`h-auto max-h-full w-auto max-w-full select-none border border-line shadow-[var(--shadow-card)] ${
                                shot.device === 'mobile'
                                    ? 'rounded-[1.25rem]'
                                    : 'rounded-lg'
                            }`}
                        />
                    </motion.div>
                </AnimatePresence>

                {shots.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => go(index - 1)}
                            aria-label="Previous screenshot"
                            className="absolute left-3 top-1/2 hidden -translate-y-1/2 glass-pill btn-icon !hidden md:!inline-flex"
                        >
                            <Chevron flip />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(index + 1)}
                            aria-label="Next screenshot"
                            className="absolute right-3 top-1/2 hidden -translate-y-1/2 glass-pill btn-icon !hidden md:!inline-flex"
                        >
                            <Chevron />
                        </button>
                    </>
                )}
            </div>

            {/* A lone image needs no caption or counter: "1 / 1" reads as broken. */}
            {shots.length > 1 && (
                <div className="flex items-baseline justify-between gap-4 px-4 pt-1 md:px-8">
                    <p
                        className="min-h-[1.25rem] text-small text-ink-muted"
                        aria-live="polite"
                    >
                        {shot.caption}
                    </p>
                    <span className="shrink-0 font-mono text-micro tabular-nums text-ink-faint">
                        {index + 1} / {shots.length}
                    </span>
                </div>
            )}

            {shots.length > 1 && (
                <ul className="no-scrollbar flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-4 pt-3 md:px-8 md:pb-6">
                    {shots.map((thumb, i) => (
                        <li key={thumb.src} className="shrink-0">
                            <button
                                ref={(el) => {
                                    thumbRefs.current[i] = el;
                                }}
                                type="button"
                                onClick={() => go(i)}
                                aria-label={`Screenshot ${i + 1}${thumb.caption ? `: ${thumb.caption}` : ''}`}
                                aria-current={i === index}
                                className={`relative block h-14 overflow-hidden rounded-md border transition-opacity ${
                                    thumb.device === 'mobile'
                                        ? 'aspect-[390/844]'
                                        : 'aspect-[16/10]'
                                } ${
                                    i === index
                                        ? 'border-ink opacity-100'
                                        : 'border-line opacity-50 hover:opacity-90'
                                }`}
                            >
                                <Image
                                    src={thumb.src}
                                    alt=""
                                    fill
                                    sizes="96px"
                                    className="object-cover object-top"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const ProjectDialog = ({
    project,
    next,
    onClose,
    onNavigate,
}: {
    project: Project | null;
    next: Project | null;
    onClose: () => void;
    onNavigate: (slug: string) => void;
}) => {
    const ref = useRef<HTMLDialogElement>(null);
    // Keeps the content on screen while the dialog animates out.
    const [shown, setShown] = useState(project);
    useScrollLock(project !== null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;

        if (project) {
            setShown(project);
            if (!dialog.open) dialog.showModal();
        } else if (dialog.open) {
            dialog.close();
        }
    }, [project]);

    return (
        <dialog
            ref={ref}
            className="project-dialog"
            aria-labelledby="project-dialog-title"
            onClose={onClose}
            onClick={(event) => {
                // Only the backdrop reports the dialog itself as the target.
                if (event.target === event.currentTarget) {
                    event.currentTarget.close();
                }
            }}
        >
            {shown && (
                <div
                    key={shown.slug}
                    className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto] overflow-y-auto overscroll-contain md:grid-cols-[minmax(0,1fr)_22rem] md:grid-rows-1 md:overflow-hidden"
                >
                    <div className="h-[56svh] min-h-0 md:h-auto">
                        <Gallery shots={shown.shots} name={shown.name} />
                    </div>

                    <aside className="flex flex-col border-t border-line p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:overflow-y-auto md:overscroll-contain md:border-l md:border-t-0 md:p-8">
                        <p className="eyebrow pr-10">{shown.role}</p>
                        <h2
                            id="project-dialog-title"
                            className="heading mt-3 text-heading"
                        >
                            {shown.name}
                        </h2>

                        {shown.description.map((paragraph) => (
                            <p
                                key={paragraph}
                                className="prose-body mt-4 text-body"
                            >
                                {paragraph}
                            </p>
                        ))}

                        <p className="eyebrow mt-8">Features</p>
                        <ul className="mt-3 space-y-2">
                            {shown.features.map((item) => (
                                <li
                                    key={item}
                                    className="flex gap-3 text-body leading-snug text-ink-muted"
                                >
                                    <span
                                        aria-hidden
                                        className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-accent"
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <ul className="mt-8 flex flex-wrap gap-1.5">
                            {shown.stack.map((item) => (
                                <li key={item} className="chip">
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8">
                            {/* Both can apply: flunky.beer has a public sign-in page
                                but nothing behind it without an invite. */}
                            {shown.url && (
                                <a
                                    href={shown.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group glass-pill btn btn-primary"
                                >
                                    Visit {shown.url.replace('https://', '')}
                                    <ArrowUpRight
                                        width={14}
                                        height={14}
                                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                    />
                                </a>
                            )}
                            {shown.privateNote && (
                                <p className="mt-4 flex gap-3 rounded-[var(--radius)] border border-line p-4 text-small leading-relaxed text-ink-muted">
                                    <Lock
                                        width={15}
                                        height={15}
                                        className="mt-0.5 shrink-0 text-ink-faint"
                                    />
                                    {shown.privateNote}
                                </p>
                            )}
                        </div>

                        {next && (
                            <div className="mt-auto pt-10">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(next.slug)}
                                    className="group flex w-full items-center justify-between gap-4 border-t border-line pt-5 text-left text-small"
                                >
                                    <span>
                                        <span className="eyebrow block">
                                            Next project
                                        </span>
                                        <span className="mt-1 block font-medium">
                                            {next.name}
                                        </span>
                                    </span>
                                    <span className="text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink">
                                        <Chevron />
                                    </span>
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            <button
                type="button"
                onClick={() => ref.current?.close()}
                // Lands focus here on open, not on the first gallery control.
                autoFocus
                aria-label="Close"
                className="absolute right-3 top-3 z-10 glass-pill btn-icon md:right-4 md:top-4"
            >
                <Close width={16} height={16} />
            </button>
        </dialog>
    );
};

export default ProjectDialog;

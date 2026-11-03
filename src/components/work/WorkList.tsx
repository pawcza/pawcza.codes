'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import Reveal from '@/components/common/Reveal';
import MatrixText from '@/components/common/MatrixText';
import ProjectCover from '@/components/work/ProjectCover';
import { Project, featuredProjects, moreProjects } from '@/content/projects';

// Arrives with the first project opened, along with its screenshots.
const ProjectDialog = dynamic(() => import('@/components/work/ProjectDialog'), {
    ssr: false,
});

/** `#work/<slug>` deep-links straight into a project. */
const HASH_PREFIX = '#work/';
const ordered = [...featuredProjects, ...moreProjects];

const slugFromHash = () => {
    const { hash } = window.location;
    if (!hash.startsWith(HASH_PREFIX)) return null;
    const slug = hash.slice(HASH_PREFIX.length);
    return ordered.some((p) => p.slug === slug) ? slug : null;
};

/**
 * The heading's button stretches over the whole entry, so the entry is one
 * click target without nesting interactive content inside a button. It sits
 * above the cover, which is positioned and would otherwise swallow the click.
 */
const OpenButton = ({
    project,
    onOpen,
    classNames,
}: {
    project: Project;
    onOpen: (slug: string) => void;
    classNames: string;
}) => (
    <button
        type="button"
        onClick={() => onOpen(project.slug)}
        aria-haspopup="dialog"
        className="text-left after:absolute after:inset-0 after:z-10 after:rounded-[var(--radius)] after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
    >
        <MatrixText startOnView mono={false} classNames={classNames}>
            {project.name}
        </MatrixText>
    </button>
);

const WorkRow = ({
    project,
    onOpen,
    first,
    last,
}: {
    project: Project;
    onOpen: (slug: string) => void;
    first: boolean;
    last: boolean;
}) => (
    // Open rows with hairlines, like Experience: the glass lives on the
    // thumbnail, not around the whole entry. No rule above the first row, the
    // section rule already sits there.
    <div className="edge-line border-t border-line py-10 first:border-t-0 md:py-12">
        <article className="group relative grid items-center gap-6 md:grid-cols-12 md:gap-x-12">
            <div className="md:col-span-5">
                <h3>
                    <OpenButton
                        project={project}
                        onOpen={onOpen}
                        classNames="heading text-heading"
                    />
                </h3>
                <p data-squares="" className="mt-4 text-lead text-ink-muted">
                    {project.blurb}
                </p>
                <p
                    data-squares=""
                    data-squares-delay="0.15"
                    className="eyebrow mt-6 transition-colors group-hover:text-ink"
                >
                    View project →
                </p>
            </div>
            {/*
             * The cover's frame still fades in; the image builds itself.
             * Stretched to the whole row, so the spine through the covers'
             * centres can reach the rules above and below. It starts inside
             * the first cover and ends inside the last, and is only drawn
             * where text and cover sit side by side.
             */}
            <Reveal className="relative md:col-span-7 md:flex md:items-center md:self-stretch">
                <span
                    aria-hidden
                    className={`edge-line-v absolute left-1/2 hidden w-px bg-line md:block ${
                        first ? 'md:top-1/2' : 'md:-top-12'
                    } ${last ? 'md:bottom-1/2' : 'md:-bottom-12'}`}
                />
                <div className="w-full">
                    <ProjectCover
                        project={project}
                        sizes="(min-width: 1088px) 40rem, (min-width: 768px) 58vw, 100vw"
                    />
                </div>
            </Reveal>
        </article>
    </div>
);

const SmallProject = ({
    project,
    delay,
    onOpen,
}: {
    project: Project;
    delay: number;
    onOpen: (slug: string) => void;
}) => (
    <div className="h-full">
        <article className="group relative flex h-full flex-col">
            {/* A hairline through the thumbnails' centres links each row. */}
            <Reveal delay={delay} className="relative">
                <span
                    aria-hidden
                    className="edge-line thumb-link absolute top-1/2 hidden h-px bg-line sm:block"
                />
                <ProjectCover
                    project={project}
                    sizes="(min-width: 768px) 22rem, 100vw"
                />
            </Reveal>
            <div className="flex flex-1 flex-col pt-5">
                <div className="flex items-baseline justify-between gap-3">
                    <h3>
                        <OpenButton
                            project={project}
                            onOpen={onOpen}
                            classNames="heading text-lead"
                        />
                    </h3>
                </div>
                <p
                    data-squares=""
                    data-squares-delay={delay}
                    className="mt-2 text-body text-ink-muted"
                >
                    {project.blurb}
                </p>
            </div>
        </article>
    </div>
);

const WorkList = () => {
    const [openSlug, setOpenSlug] = useState<string | null>(null);
    // Whether the open dialog owns a history entry that closing should pop.
    const pushed = useRef(false);

    useEffect(() => {
        const sync = () => {
            const slug = slugFromHash();
            if (!slug) pushed.current = false;
            setOpenSlug(slug);
        };
        sync();
        window.addEventListener('popstate', sync);
        return () => window.removeEventListener('popstate', sync);
    }, []);

    const open = useCallback((slug: string) => {
        window.history.pushState(null, '', `${HASH_PREFIX}${slug}`);
        pushed.current = true;
        setOpenSlug(slug);
    }, []);

    const navigate = useCallback((slug: string) => {
        window.history.replaceState(null, '', `${HASH_PREFIX}${slug}`);
        setOpenSlug(slug);
    }, []);

    const close = useCallback(() => {
        if (slugFromHash() === null) return;
        if (pushed.current) {
            pushed.current = false;
            window.history.back();
        } else {
            // Arrived via a shared link: drop the hash without leaving the page.
            const { pathname, search } = window.location;
            window.history.replaceState(null, '', pathname + search);
        }
        setOpenSlug(null);
    }, []);

    const index = ordered.findIndex((p) => p.slug === openSlug);
    const project = index >= 0 ? ordered[index] : null;
    const next = index >= 0 ? ordered[(index + 1) % ordered.length] : null;

    // Once opened it stays mounted, so it can animate out.
    const [opened, setOpened] = useState(false);
    if (project && !opened) setOpened(true);

    return (
        <>
            <div className="mt-4">
                {featuredProjects.map((p, i) => (
                    <WorkRow
                        key={p.slug}
                        project={p}
                        onOpen={open}
                        first={i === 0}
                        last={i === featuredProjects.length - 1}
                    />
                ))}
            </div>

            <div className="project-grid mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {moreProjects.map((p, i) => (
                    <SmallProject
                        key={p.slug}
                        project={p}
                        delay={(i % 3) * 0.08}
                        onOpen={open}
                    />
                ))}
            </div>

            {opened && (
                <ProjectDialog
                    project={project}
                    next={next}
                    onClose={close}
                    onNavigate={navigate}
                />
            )}
        </>
    );
};

export default WorkList;

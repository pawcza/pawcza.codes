'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Reveal from '@/components/common/Reveal';
import MatrixText from '@/components/common/MatrixText';
import ProjectCover from '@/components/work/ProjectCover';
import ProjectDialog from '@/components/work/ProjectDialog';
import { Project, featuredProjects, moreProjects } from '@/content/projects';

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
}: {
    project: Project;
    onOpen: (slug: string) => void;
}) => (
    // Open rows with hairlines, like Experience: the glass lives on the
    // thumbnail, not around the whole entry. No rule above the first row, the
    // section rule already sits there.
    <Reveal className="edge-line border-t border-line py-10 first:border-t-0 md:py-12">
        <article className="group relative grid items-center gap-6 md:grid-cols-12 md:gap-x-12">
            <div className="md:col-span-5">
                <h3>
                    <OpenButton
                        project={project}
                        onOpen={onOpen}
                        classNames="heading text-heading"
                    />
                </h3>
                <p className="mt-4 text-lead text-ink-muted">{project.blurb}</p>
                <p className="eyebrow mt-6 transition-colors group-hover:text-ink">
                    View project →
                </p>
            </div>
            <div className="md:col-span-7">
                <ProjectCover
                    project={project}
                    sizes="(min-width: 1088px) 40rem, (min-width: 768px) 58vw, 100vw"
                />
            </div>
        </article>
    </Reveal>
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
    <Reveal delay={delay} className="h-full">
        <article className="group relative flex h-full flex-col">
            <ProjectCover
                project={project}
                sizes="(min-width: 768px) 22rem, 100vw"
            />
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
                <p className="mt-2 text-body text-ink-muted">{project.blurb}</p>
            </div>
        </article>
    </Reveal>
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

    return (
        <>
            <div className="mt-4">
                {featuredProjects.map((p) => (
                    <WorkRow key={p.slug} project={p} onOpen={open} />
                ))}
            </div>

            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {moreProjects.map((p, i) => (
                    <SmallProject
                        key={p.slug}
                        project={p}
                        delay={(i % 3) * 0.08}
                        onOpen={open}
                    />
                ))}
            </div>

            <ProjectDialog
                project={project}
                next={next}
                onClose={close}
                onNavigate={navigate}
            />
        </>
    );
};

export default WorkList;

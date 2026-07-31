import Section from '@/components/common/Section';
import Reveal from '@/components/common/Reveal';
import MatrixText from '@/components/common/MatrixText';
import { ArrowUpRight, Lock } from '@/components/common/Icons';
import { Project, featuredProjects, otherProjects } from '@/content/projects';

const Chips = ({ items }: { items: string[] }) => (
    <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
            <li key={item} className="chip">
                {item}
            </li>
        ))}
    </ul>
);

const WorkRow = ({ project }: { project: Project }) => (
    // No border on the first row: the section rule already sits above it.
    <Reveal className="border-t border-line py-9 first:border-t-0">
        <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="group block"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3>
                    <MatrixText
                        startOnView
                        mono={false}
                        classNames="heading text-2xl md:text-[1.75rem]"
                    >
                        {project.name}
                    </MatrixText>
                </h3>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    <span className="link-underline">
                        {project.url?.replace('https://', '')}
                    </span>
                    <ArrowUpRight
                        width={14}
                        height={14}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                </span>
            </div>

            <p className="mt-3 max-w-prose text-[1.0625rem] leading-relaxed text-ink-muted">
                {project.blurb}
            </p>

            <div className="mt-5">
                <Chips items={project.stack} />
            </div>
        </a>
    </Reveal>
);

const SmallProject = ({
    project,
    delay,
}: {
    project: Project;
    delay: number;
}) => (
    <Reveal delay={delay} className="h-full">
        <article className="card flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
                <h3>
                    <MatrixText
                        startOnView
                        mono={false}
                        classNames="heading text-lg"
                    >
                        {project.name}
                    </MatrixText>
                </h3>
                {project.url ? (
                    <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Visit ${project.name}`}
                        className="mt-1 shrink-0 text-ink-faint transition-colors hover:text-ink"
                    >
                        <ArrowUpRight width={15} height={15} />
                    </a>
                ) : (
                    <span
                        title="Private"
                        className="mt-1 shrink-0 text-ink-faint"
                    >
                        <Lock width={14} height={14} />
                        <span className="sr-only">Private</span>
                    </span>
                )}
            </div>

            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">
                {project.blurb}
            </p>

            <div className="mt-auto pt-6">
                <Chips items={project.stack} />
            </div>
        </article>
    </Reveal>
);

const Work = () => (
    <Section id="work" title="Selected works">
        <div className="mt-4">
            {featuredProjects.map((project) => (
                <WorkRow key={project.slug} project={project} />
            ))}
        </div>

        <Reveal className="mt-20">
            <p className="eyebrow">Also building</p>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
            {otherProjects.map((project, index) => (
                <SmallProject
                    key={project.slug}
                    project={project}
                    delay={index * 0.08}
                />
            ))}
        </div>
    </Section>
);

export default Work;

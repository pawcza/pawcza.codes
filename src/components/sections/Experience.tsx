import Section from '@/components/common/Section';
import Reveal from '@/components/common/Reveal';
import MatrixText from '@/components/common/MatrixText';
import { experience } from '@/content/experience';

const Experience = () => (
    <Section id="experience" title="Experience">
        <ol className="mt-4">
            {experience.map((role, index) => (
                // No border on the first row: the section rule is above it.
                <li
                    key={role.company}
                    className="edge-line border-t border-line first:border-t-0"
                >
                    <Reveal className="grid gap-4 py-8 md:grid-cols-12 md:gap-10">
                        <div className="md:col-span-3">
                            <p className="font-mono text-[0.8125rem] tracking-tight text-ink">
                                {role.from}
                                <span className="text-ink-faint"> → </span>
                                {role.to}
                            </p>
                            {index === 0 && (
                                <span className="mt-2 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-accent">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                    Current
                                </span>
                            )}
                        </div>

                        <div className="md:col-span-9">
                            <h3>
                                <MatrixText
                                    startOnView
                                    mono={false}
                                    classNames="heading text-xl md:text-2xl"
                                >
                                    {role.company}
                                </MatrixText>
                            </h3>
                            <p className="mt-1.5 text-sm text-ink-muted">
                                {role.title} · {role.location}
                            </p>

                            <ul className="mt-5 flex flex-wrap gap-1.5">
                                {role.stack.map((item) => (
                                    <li key={item} className="chip">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                </li>
            ))}
        </ol>
    </Section>
);

export default Experience;

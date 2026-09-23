import Section from '@/components/common/Section';
import MatrixText from '@/components/common/MatrixText';
import { experience } from '@/content/experience';

const Experience = () => (
    <Section id="experience" index="02" title="Experience">
        <ol className="mt-4">
            {experience.map((role, index) => (
                // No border on the first row: the section rule is above it.
                <li
                    key={role.company}
                    className="edge-line border-t border-line first:border-t-0"
                >
                    <div className="grid gap-4 py-8 md:grid-cols-12 md:gap-10">
                        <div className="md:col-span-3">
                            <p
                                data-squares=""
                                className="font-mono text-small tracking-tight text-ink"
                            >
                                {role.from}
                                <span className="text-ink-faint"> → </span>
                                {role.to}
                            </p>
                            {index === 0 && (
                                <span
                                    data-squares=""
                                    data-squares-delay="0.08"
                                    className="mt-2 inline-flex items-center gap-1.5 text-micro font-medium uppercase tracking-[0.14em] text-accent">
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
                                    classNames="heading text-heading"
                                >
                                    {role.company}
                                </MatrixText>
                            </h3>
                            <p
                                data-squares=""
                                className="mt-1.5 text-small text-ink-muted"
                            >
                                {role.title} · {role.location}
                            </p>

                            <ul
                                data-squares=""
                                data-squares-delay="0.1"
                                className="mt-5 flex flex-wrap gap-1.5"
                            >
                                {role.stack.map((item) => (
                                    <li key={item} className="chip">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </li>
            ))}
        </ol>
    </Section>
);

export default Experience;

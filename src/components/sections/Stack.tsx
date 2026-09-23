import Section from '@/components/common/Section';
import { skills } from '@/content/skills';

const Stack = () => (
    <Section id="stack" index="03" title="What I reach for">
        <dl className="mt-4">
            {skills.map((group, index) => (
                // No border on the first row: the section rule is above it.
                <div
                    key={group.label}
                    className="edge-line grid gap-3 border-t border-line py-6 first:border-t-0 md:grid-cols-12 md:gap-10"
                >
                    <dt
                        data-squares=""
                        data-squares-delay={index * 0.05}
                        className="eyebrow md:col-span-3 md:pt-1.5"
                    >
                        {group.label}
                    </dt>
                    <dd className="md:col-span-9">
                        <ul
                            data-squares=""
                            data-squares-delay={index * 0.05 + 0.08}
                            className="flex flex-wrap gap-1.5"
                        >
                            {group.items.map((item) => (
                                <li key={item} className="chip">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </div>
            ))}
        </dl>
    </Section>
);

export default Stack;

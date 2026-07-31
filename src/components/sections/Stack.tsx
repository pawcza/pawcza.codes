import Section from '@/components/common/Section';
import Reveal from '@/components/common/Reveal';
import { skills } from '@/content/skills';

const Stack = () => (
    <Section id="stack" title="What I reach for">
        <dl className="mt-4">
            {skills.map((group, index) => (
                // No border on the first row: the section rule is above it.
                <Reveal
                    key={group.label}
                    delay={index * 0.05}
                    className="grid gap-3 border-t border-line py-6 first:border-t-0 md:grid-cols-12 md:gap-10"
                >
                    <dt className="eyebrow md:col-span-3 md:pt-1.5">
                        {group.label}
                    </dt>
                    <dd className="md:col-span-9">
                        <ul className="flex flex-wrap gap-1.5">
                            {group.items.map((item) => (
                                <li key={item} className="chip">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </Reveal>
            ))}
        </dl>
    </Section>
);

export default Stack;

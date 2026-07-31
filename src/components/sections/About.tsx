import Section from '@/components/common/Section';
import Reveal from '@/components/common/Reveal';
import { profile } from '@/content/profile';

const About = () => (
    <Section id="about" title="About me">
        <div className="mt-4 grid gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
                <Reveal>
                    {profile.bio.map((paragraph, index) => (
                        // The opening line carries the section, so give it size.
                        <p
                            key={paragraph}
                            className={
                                index === 0
                                    ? 'max-w-prose text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-medium leading-snug tracking-tight text-ink'
                                    : 'prose-body mt-5 max-w-prose text-[1.0625rem]'
                            }
                        >
                            {paragraph}
                        </p>
                    ))}
                </Reveal>
            </div>

            <Reveal delay={0.1} className="md:col-span-4">
                <dl className="space-y-6">
                    <div>
                        <dt className="eyebrow">Based in</dt>
                        <dd className="mt-2 text-[0.9375rem]">
                            {profile.location}
                        </dd>
                    </div>
                    <div>
                        <dt className="eyebrow">Languages</dt>
                        <dd className="mt-2 text-[0.9375rem]">
                            Polish, native
                            <br />
                            English, fluent
                        </dd>
                    </div>
                </dl>
            </Reveal>
        </div>
    </Section>
);

export default About;

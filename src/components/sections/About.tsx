import Section from '@/components/common/Section';
import { profile } from '@/content/profile';

const About = () => (
    <Section id="about" index="04" title="About me">
        <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-x-10">
            <div className="md:col-span-9 md:col-start-4 md:row-start-1">
                <div>
                    {profile.bio.map((paragraph, index) => (
                        // The opening line carries the section, so give it size.
                        <p
                            key={paragraph}
                            data-squares=""
                            data-squares-delay={index * 0.1}
                            className={
                                index === 0
                                    ? 'max-w-prose text-heading font-medium text-ink'
                                    : 'prose-body mt-5 max-w-prose text-body'
                            }
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>

            <div className="md:col-span-3 md:col-start-1 md:row-start-1">
                <dl data-squares="" data-squares-delay="0.1" className="space-y-6">
                    <div>
                        <dt className="eyebrow">Currently in</dt>
                        <dd className="mt-2 text-body">{profile.location}</dd>
                    </div>
                </dl>
            </div>
        </div>
    </Section>
);

export default About;

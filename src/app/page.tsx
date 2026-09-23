import Hero from '@/components/hero/Hero';
import Work from '@/components/sections/Work';
import Experience from '@/components/sections/Experience';
import Stack from '@/components/sections/Stack';
import About from '@/components/sections/About';
import Quote from '@/components/sections/Quote';
import Contact from '@/components/sections/Contact';
import { profile } from '@/content/profile';
import { experience } from '@/content/experience';
import { skills } from '@/content/skills';

const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    email: `mailto:${profile.email}`,
    url: 'https://pawcza.codes',
    sameAs: [profile.github, profile.linkedin],
    address: {
        '@type': 'PostalAddress',
        addressLocality: 'Gdynia',
        addressCountry: 'PL',
    },
    worksFor: {
        '@type': 'Organization',
        name: experience[0].company,
    },
    knowsAbout: skills.flatMap((group) => group.items),
};

export default function Home() {
    return (
        <div>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(personSchema),
                }}
            />
            <Hero />
            <main>
                <Work />
                <Experience />
                <Stack />
                <About />
                <Quote />
            </main>
            <Contact />
        </div>
    );
}

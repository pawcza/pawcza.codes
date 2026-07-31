export interface Project {
    slug: string;
    name: string;
    /** What the project is and how it is built. Not a changelog. */
    blurb: string;
    /** Omitted for projects that sit behind auth or aren't mine to link. */
    url?: string;
    repo?: string;
    stack: string[];
    featured: boolean;
}

export const projects: Project[] = [
    {
        slug: 'sluchanie-receptywne',
        name: 'Słuchanie Receptywne',
        blurb: 'Bilingual site for a 24-hour listening festival. React and Vite, with a GLSL dither pass rendering the whole visual identity, shipped as a static bundle behind nginx.',
        url: 'https://sluchaniereceptywne.com',
        stack: [
            'React',
            'Vite',
            'Three.js',
            'React Three Fiber',
            'GLSL',
            'Docker',
        ],
        featured: true,
    },
    {
        slug: 'aleksandra-kolesniak',
        name: 'Aleksandra Koleśniak',
        blurb: 'Portfolio for a painter. Statically exported Next.js with a build-time content pull from Sanity and a generated responsive image pipeline, so nothing queries the CMS at runtime.',
        // Temporary home. Moving to olakolesniak.com.
        url: 'https://ak.wszystko.app',
        stack: ['Next.js', 'Static export', 'Sanity', 'TypeScript', 'Vercel'],
        featured: true,
    },
    {
        slug: 'cantara-music',
        name: 'Cantara Music',
        blurb: 'Music news portal. Self-hosted Strapi 5 page builder feeding a Next.js 16 front end, with hierarchical pages, generated full paths and automatic redirects.',
        url: 'https://cantaramusic.pl',
        stack: [
            'Strapi 5',
            'Next.js 16',
            'React 19',
            'TypeScript',
            'Turborepo',
            'Docker',
        ],
        featured: true,
    },
    {
        slug: 'flunky-beer',
        name: 'flunky.beer',
        blurb: 'Full-stack tournament platform. Account system, relational model for teams, brackets and match history, ranked leaderboards and an achievement engine.',
        url: 'https://flunky.beer',
        stack: ['React Router 7', 'TypeScript', 'Prisma', 'Three.js', 'Docker'],
        featured: false,
    },
    {
        slug: 'persona',
        name: 'Persona',
        blurb: 'AI platform architected so a persona is configuration rather than a codebase, and a new product ships without a rewrite. Self-hosted inference and voice cloning. The first product on it is an astrology and numerology guide.',
        stack: ['Next.js', 'TypeScript', 'Node.js', 'Self-hosted LLM', 'TTS'],
        featured: false,
    },
    {
        slug: 'home-infra',
        name: 'wszystko.app',
        blurb: 'Operations dashboard for a self-hosted media stack. Aggregates the Plex, Overseerr and Tautulli APIs behind SSO, on the same Docker network as the services it fronts.',
        stack: ['React', 'TypeScript', 'Docker', 'Unraid', 'Authentik'],
        featured: false,
    },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);

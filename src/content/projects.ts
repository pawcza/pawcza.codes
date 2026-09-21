export interface Shot {
    /** Path under /public. Desktop shots are 16:10, mobile shots 390:844. */
    src: string;
    alt: string;
    caption?: string;
    device: 'desktop' | 'mobile';
}

export interface Project {
    slug: string;
    name: string;
    /** One or two sentences for the list. The modal carries the rest. */
    blurb: string;
    /** What the project is and how it is built. Not a changelog. */
    description: string[];
    /** What I actually did on it, as short statements. */
    highlights: string[];
    role: string;
    url?: string;
    repo?: string;
    /** Shown in place of a link when there is nothing public to visit. */
    privateNote?: string;
    stack: string[];
    shots: Shot[];
    /** Short looping screen recording the card crossfades to on hover. */
    preview?: string;
    /** Featured projects get a full row; the rest share one grid. */
    featured: boolean;
}

const desktop = (src: string, alt: string, caption: string): Shot => ({
    src,
    alt,
    caption,
    device: 'desktop',
});

const mobile = (src: string, alt: string, caption: string): Shot => ({
    src,
    alt,
    caption,
    device: 'mobile',
});

export const projects: Project[] = [
    {
        slug: 'kornel',
        name: 'Wróżbita Kornel',
        blurb: 'An AI fortune-teller that reads your real natal chart, numerology and tarot, and remembers you.',
        description: [
            'Polish-first astrology, numerology and tarot, told by a character who knows your birth chart and remembers your last visit. It runs on Persona, my own platform where each character is configuration rather than code, so a second persona, Selena, shipped as a single file.',
        ],
        highlights: [
            'Designed the product, its design system and a hand-drawn glyph set for the natal wheel',
            'Computed charts in-house with astronomy-engine, checked against Swiss Ephemeris on 300 charts',
            'Streamed replies over SSE, with idempotent retries so a wish is never charged twice',
            'Built the Hono API, Postgres billing and memory, and self-hosted all of it',
        ],
        role: 'Solo: product, design, full stack, infrastructure',
        url: 'https://kornel.wszystko.app',
        stack: [
            'Next.js 16',
            'React 19',
            'Tailwind v4',
            'next-intl',
            'Hono',
            'Postgres + Drizzle',
            'Vercel AI SDK',
            'astronomy-engine',
            'Docker',
        ],
        shots: [
            desktop(
                '/work/kornel/01-landing.webp',
                'Wróżbita Kornel landing page with the headline "Your chart. Your numbers. Your question."',
                'Landing',
            ),
            desktop(
                '/work/kornel/02-chat.webp',
                'A conversation with Kornel about moving to Lisbon, beside a panel of current transits',
                'Chat that reads the chart, the numbers and the question together',
            ),
            desktop(
                '/work/kornel/03-chart-wheel.webp',
                'Natal chart wheel with signs, houses, planets and aspect lines',
                'The natal wheel, drawn in SVG with a hand-drawn glyph set',
            ),
            desktop(
                '/work/kornel/04-planet-reading.webp',
                'Sun and Moon readings tied to their sign, degree, house and aspects',
                'Planet readings grounded in computed chart positions',
            ),
            desktop(
                '/work/kornel/05-tarot-spread.webp',
                'Dark tarot mode with a fanned deck and three card slots',
                'Tarot switches the whole interface to lights-out',
            ),
            desktop(
                '/work/kornel/06-tarot-card.webp',
                'The Empress card revealed next to its interpretation',
                'One card at a time, each read against the chart',
            ),
            desktop(
                '/work/kornel/07-tarot-reading.webp',
                'Three illustrated cards beside a synthesis with a drop cap',
                'The reading as a single synthesis',
            ),
            desktop(
                '/work/kornel/08-profile-persona.webp',
                'Profile settings with birth data, a choice between Kornel and Selena, and a language switch',
                'Personas are chosen, not rebuilt: Kornel or Selena',
            ),
            mobile(
                '/work/kornel/09-landing-mobile.webp',
                'Landing page on a phone',
                'Landing on a phone',
            ),
            mobile(
                '/work/kornel/10-chat-mobile.webp',
                'Chat on a phone with suggested questions above the input',
                'Chat on a phone',
            ),
            mobile(
                '/work/kornel/11-chart-wheel-mobile.webp',
                'Chart wheel on a phone',
                'The chart wheel on a phone',
            ),
        ],
        preview: '/work/kornel/preview.mp4',
        featured: true,
    },
    {
        slug: 'flunky-beer',
        name: 'flunky.beer',
        blurb: 'Invite-only flunkyball scorekeeper with live scoring, cups, rankings and badges.',
        description: [
            'A private scorekeeper for a group of friends: tap in every bottle and the score updates live on every phone at the table, while stats, streaks, tournaments and badges build up in the background.',
        ],
        highlights: [
            'Designed the identity, from the SVG mark to a CSS-only carbonation effect',
            'Built live scoring on server-sent events with automatic reconnects',
            'Designed badges where shape is the category and layers are the rank',
            'Modelled 2–4 sided games, brackets and teams in Prisma',
        ],
        role: 'Solo: product, design, full stack, infrastructure',
        url: 'https://flunky.beer',
        privateNote:
            'Invite-only: accounts are handed out in person, so past the sign-in page there is nothing to see without one.',
        stack: [
            'React Router 7',
            'React 19',
            'TypeScript',
            'Tailwind v4',
            'Motion',
            'Prisma + Postgres',
            'Server-sent events',
            'Docker',
        ],
        shots: [
            desktop(
                '/work/flunky-beer/01-login.webp',
                'Sign-in page: an amber pour panel with rising bubbles and the pitch "Count bottles, not arguments", beside the sign-in and invite-code cards',
                'The front door: the pour panel carries the pitch, the right side lets you in',
            ),
            desktop(
                '/work/flunky-beer/02-dashboard.webp',
                'Dashboard with points, rank, six stat tiles, recent games, crew ranking and badge progress',
                'Dashboard: your numbers, recent games and the crew ranking',
            ),
            desktop(
                '/work/flunky-beer/03-live-scoring.webp',
                'Live scoring screen at 4 to 3, with a card per player to tap in bottles',
                'Live scoring: one tap per bottle, mirrored on every phone',
            ),
            desktop(
                '/work/flunky-beer/04-results.webp',
                'Match results with a 6 to 2 scoreline, per-player points and match stats',
                'Results: scoreline, points breakdown and match stats',
            ),
            desktop(
                '/work/flunky-beer/05-rankings.webp',
                'Rankings table with points, bottles, win-rate bars, power score and recent form',
                'Rankings with win rate, power score and form',
            ),
            desktop(
                '/work/flunky-beer/06-badges.webp',
                'Badge collection grouped into points, bottles, victories, games and beer IQ tracks',
                'Badges: shape is the category, layers are the rank',
            ),
            mobile(
                '/work/flunky-beer/07-live-scoring-mobile.webp',
                'Live scoring on a phone with a sticky scoreline',
                'Scoring on the phone it is actually played on',
            ),
            mobile(
                '/work/flunky-beer/08-dashboard-mobile.webp',
                'Dashboard on a phone with new game and new tournament actions',
                'Dashboard on a phone',
            ),
            mobile(
                '/work/flunky-beer/09-results-mobile.webp',
                'Results on a phone with a generated headline and champion of the night',
                'Results with a generated headline',
            ),
        ],
        preview: '/work/flunky-beer/preview.mp4',
        featured: true,
    },
    {
        slug: 'sluchanie-receptywne',
        name: 'Słuchanie Receptywne',
        blurb: 'Bilingual site for a 24-hour listening festival, under one moving dithered texture.',
        description: [
            'Home of a festival held on a forest clearing in Gdynia. A programme that follows the clock sits on muted, angled colour bands, all under a single site-wide WebGL dither layer.',
        ],
        highlights: [
            'Designed the palette, type and angled band layout',
            'Built the dither as a React Three Fiber postprocessing effect',
            'Made the timeline mark blocks past, live or next as the festival runs',
            'Kept it light on phones: lazy three.js, lower resolution, 30fps cap',
        ],
        role: 'Solo: design, front end, deployment',
        url: 'https://sluchaniereceptywne.com',
        stack: [
            'React 19',
            'Vite',
            'React Router 7',
            'three.js',
            'React Three Fiber',
            'GLSL',
            'nginx',
            'Docker',
        ],
        shots: [
            desktop(
                '/work/sluchanie-receptywne/01-hero.webp',
                'Receptive Listening wordmark over the dithered green noise field',
                'The hero, under the site-wide dither shader',
            ),
            desktop(
                '/work/sluchanie-receptywne/02-artists.webp',
                'A grid of black and white artist photos, each cut at a different angle',
                'Artist cards with layered angled cuts',
            ),
            desktop(
                '/work/sluchanie-receptywne/03-programme.webp',
                'The 24-hour programme with the day block on a pale green band',
                'The programme follows the day, block by block',
            ),
            desktop(
                '/work/sluchanie-receptywne/04-morning.webp',
                'Night, early morning and morning blocks on contrasting angled bands',
                'Each block takes its own tone',
            ),
            desktop(
                '/work/sluchanie-receptywne/05-accompanying.webp',
                'Morning block above the accompanying programme of workshops and talks',
                'Accompanying programme',
            ),
            desktop(
                '/work/sluchanie-receptywne/06-about.webp',
                'About section on a plum band above the programme introduction',
                'Bands cut into each other at an angle',
            ),
            mobile(
                '/work/sluchanie-receptywne/07-hero-mobile.webp',
                'Festival hero on a phone',
                'Hero on a phone',
            ),
            mobile(
                '/work/sluchanie-receptywne/08-programme-mobile.webp',
                'Programme blocks on a phone',
                'Programme on a phone',
            ),
        ],
        preview: '/work/sluchanie-receptywne/preview.mp4',
        featured: true,
    },
    {
        slug: 'aleksandra-kolesniak',
        name: 'Aleksandra Koleśniak',
        blurb: 'Scroll-driven portfolio for a painter, with a hand-drawn character as the menu.',
        description: [
            'Each series is a horizontal gallery moved by vertical scroll, and Bob, the painter’s drawn character, turns as you scroll and opens the menu. She edits everything herself in Sanity, and the site ships as a static export.',
        ],
        highlights: [
            'Designed the interaction model and visual system with the painter',
            'Wrote an SVG morphing engine so Bob can hold any in-between pose',
            'Built a zoom viewer with pinch, momentum pan and double-tap',
            'Pulled content and images at build time, so visitors never hit the CMS',
        ],
        role: 'Solo: design, front end, CMS, deployment',
        // Temporary home. Moving to olakolesniak.com.
        url: 'https://ak.wszystko.app',
        stack: [
            'Next.js 16',
            'Static export',
            'React 19',
            'TypeScript',
            'Motion',
            'Sanity 4',
            'sharp',
            'Vercel',
        ],
        shots: [
            desktop(
                '/work/aleksandra-kolesniak/01-intro.webp',
                'Hand-drawn Koleśniak wordmark and Bob, a painted face in a circle, on the intro screen',
                'Bob greets you, then follows you down the page',
            ),
            desktop(
                '/work/aleksandra-kolesniak/02-painting.webp',
                'A red and pink painting of a figure lying on a sofa',
                'Works sit on one horizontal line',
            ),
            desktop(
                '/work/aleksandra-kolesniak/03-statement.webp',
                'A painting next to a large block of statement text',
                'Statements share the line with the paintings',
            ),
            desktop(
                '/work/aleksandra-kolesniak/04-exhibition.webp',
                'Exhibition photo of a visitor in front of a blue painting',
                'Exhibition photography',
            ),
            desktop(
                '/work/aleksandra-kolesniak/05-sketchbook.webp',
                'A red, white and black painting of a face',
                'A progress line tracks each series',
            ),
            mobile(
                '/work/aleksandra-kolesniak/06-painting-mobile.webp',
                'Painting series on a phone',
                'On a phone',
            ),
            mobile(
                '/work/aleksandra-kolesniak/07-statement-mobile.webp',
                'Statement text beside a painting on a phone',
                'Statement on a phone',
            ),
        ],
        preview: '/work/aleksandra-kolesniak/preview.mp4',
        featured: false,
    },
    {
        slug: 'butler',
        name: 'Butler',
        blurb: 'Voice front end for my home AI agent, with a WebGL particle figure that reacts to every step.',
        description: [
            'Speak or type, and the agent’s tool calls and reply stream back and are read aloud, paragraph by paragraph. The assistant is a particle system that changes shape as it listens, thinks and speaks.',
        ],
        highlights: [
            'Wrote the GLSL shaders for the particles, nebula and heat haze',
            'Mapped agent states to avatar shape and motion',
            'Built voice capture with a wake word and streamed speech',
            'Scaled particles to the GPU, from 12k down to 3k',
        ],
        role: 'Solo: design and development',
        privateNote:
            'Private: it controls my home, so it sits behind authentication on my own server.',
        stack: [
            'Nuxt 3',
            'Vue',
            'TypeScript (strict)',
            'Three.js + TresJS',
            'GLSL',
            'GSAP',
            'WebSockets',
            'Zod',
            'Vitest',
        ],
        shots: [
            desktop(
                '/work/butler/01-thinking.webp',
                'A glowing amber cube of particles in a dark starfield',
                'Thinking: the particles condense into a spinning cube',
            ),
            desktop(
                '/work/butler/02-tool-calls.webp',
                'The cube above a streamed log of a spoken request and two tool calls',
                'The agent’s tool calls stream in as it works',
            ),
            desktop(
                '/work/butler/03-speaking.webp',
                'Particles forming an orange alpha glyph above the finished reply',
                'Speaking: a new glyph each time, and the reply is read aloud',
            ),
            desktop(
                '/work/butler/04-idle.webp',
                'A loose cloud of white particles at rest in the starfield',
                'At rest',
            ),
            desktop(
                '/work/butler/05-log.webp',
                'The particle cloud behind the full exchange: request, tool calls, results and reply',
                'The whole exchange stays in the log',
            ),
            mobile(
                '/work/butler/06-speaking-mobile.webp',
                'An orange infinity glyph of particles over the log on a phone',
                'Speaking, on a phone',
            ),
            mobile(
                '/work/butler/07-thinking-mobile.webp',
                'The amber particle cube on a phone',
                'Thinking, on a phone',
            ),
        ],
        preview: '/work/butler/preview.mp4',
        featured: false,
    },
    {
        slug: 'cockroach-the-game',
        name: 'Karaluch',
        blurb: 'Absurd browser runner about a cockroach, with live multiplayer for up to 16 players.',
        description: [
            'Ten levels, a boss fight and multiplayer races where every player sees the same obstacles and everyone else runs as a ghost.',
        ],
        highlights: [
            'Designed the levels, pacing, boss fight and touch controls',
            'Synced obstacles across clients with a seeded generator',
            'Removed ghost drift with one server-authoritative clock',
            'Halved asset weight so it plays on a phone over 4G',
        ],
        role: 'Solo: game design and development',
        url: 'https://cockroach.wszystko.app',
        stack: [
            'TypeScript',
            'Phaser 3',
            'Vite',
            'Express 5',
            'socket.io',
            'SQLite',
            'ComfyUI',
        ],
        shots: [
            desktop(
                '/work/cockroach-the-game/01-menu.webp',
                'Pixel-art main menu with the KARALUCH title, a cockroach and four menu buttons',
                'Main menu',
            ),
            desktop(
                '/work/cockroach-the-game/02-run-start.webp',
                'The start of a run in a kitchen level with a "JAZDA!" banner',
                'Off we go: the first level',
            ),
            desktop(
                '/work/cockroach-the-game/03-run.webp',
                'A cockroach running along a kitchen shelf past obstacles',
                'Parallax kitchen, lit with normal maps',
            ),
            desktop(
                '/work/cockroach-the-game/04-multiplayer-lobby.webp',
                'The multiplayer lobby browser, waiting for a lobby to be created',
                'Multiplayer lobbies for up to 16 players',
            ),
            desktop(
                '/work/cockroach-the-game/05-game-over.webp',
                'Game over screen with run statistics and retry, replay and menu buttons',
                'Game over, with a replay of the death',
            ),
        ],
        preview: '/work/cockroach-the-game/preview.mp4',
        featured: false,
    },
    {
        slug: 'wszystko-app',
        name: 'wszystko.app',
        blurb: 'A private dashboard for my home media server, with Plex, requests, books and charts in one place.',
        description: [
            'The front door for friends who share my media server: new films, shows and books in one feed, their requests and watch stats, and subscribers tied to Plex sharing, all behind SSO.',
        ],
        highlights: [
            'Designed a bento-grid dashboard with a cursor-following glow border',
            'Built card-to-popup morphs with the View Transitions API',
            'Tuned scrolling on real phones by removing paint storms',
            'Merged four service APIs into one feed, on SQLite and Authentik',
        ],
        role: 'Solo: product, design, full stack, self-hosting',
        privateNote:
            'Private: it sits behind single sign-on on my home server and only opens for the friends who share the media library.',
        stack: [
            'React Router 7',
            'React 19',
            'TypeScript',
            'Tailwind v4',
            'MUI X Charts',
            'SQLite',
            'View Transitions API',
            'Authentik OIDC',
            'Docker',
        ],
        shots: [
            desktop(
                '/work/wszystko-app/01-dashboard.webp',
                'Dark bento dashboard with account status, watch stats, market charts, a recently added poster row and service shortcuts',
                'The whole stack on one screen',
            ),
            mobile(
                '/work/wszystko-app/02-dashboard-mobile.webp',
                'Dashboard on a phone with account status, notifications and watch stats',
                'Account, notifications and stats on a phone',
            ),
            mobile(
                '/work/wszystko-app/03-charts-mobile.webp',
                'Market charts and service shortcuts on a phone',
                'Market charts and service shortcuts',
            ),
        ],
        featured: false,
    },
    {
        slug: 'cantara-music',
        name: 'Cantara Music',
        blurb: 'Polish music news portal, moved from Storyblok to self-hosted Strapi 5 and Next.js 16.',
        description: [
            'I built the site in 2022 and have run it since. The 2026 rebuild moved about 14,000 articles to a CMS on the client’s own server, keeping the look readers knew.',
        ],
        highlights: [
            'Wrote an idempotent migration: 13,917 articles, 19,463 images, 4,984 redirects',
            'Modelled articles in Strapi 5 with an SEO hook that fills in missing meta',
            'Built on-demand revalidation, search and consent-aware ads',
            'Moved deploys to GitHub Actions and GHCR',
        ],
        role: 'Solo: design, development, migration, hosting',
        url: 'https://cantaramusic.pl',
        stack: [
            'Next.js 16',
            'React 19',
            'Strapi 5',
            'Postgres',
            'Tailwind v4',
            'shadcn/ui',
            'Turborepo',
            'GitHub Actions',
            'Docker',
        ],
        shots: [
            desktop(
                '/work/cantara-music/01-news.webp',
                'Grid of news cards with artist photos',
                'News grid',
            ),
            desktop(
                '/work/cantara-music/02-reviews-galleries.webp',
                'Reviews carousel above a row of concert galleries',
                'Reviews and concert galleries',
            ),
            mobile(
                '/work/cantara-music/03-news-mobile.webp',
                'News feed on a phone',
                'News on a phone',
            ),
        ],
        preview: '/work/cantara-music/preview.mp4',
        featured: false,
    },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const moreProjects = projects.filter((p) => !p.featured);

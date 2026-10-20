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
    /** Short product highlights, shown under "Features". */
    features: string[];
    role: string;
    url?: string;
    repo?: string;
    /** Shown in place of a link when there is nothing public to visit. */
    privateNote?: string;
    stack: string[];
    shots: Shot[];
    /** The card's cover: the project's logo on its own brand background. */
    logo: string;
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
        slug: 'soulfate',
        name: 'Soulfate',
        blurb: 'An astrology companion app: AI guides who know your real birth chart, tarot, a live night sky and a daily path.',
        description: [
            'A companion for people who read the stars. You pick a guide, each with their own voice, and they read your real birth chart, your numbers and the tarot with you, remember what you told them, and give you one small step a day.',
        ],
        features: [
            'Six guides with their own voices, matched to you by a trait quiz',
            'Guest-first onboarding: no account needed to start',
            'Birth charts computed from real astronomy, drawn as an SVG wheel',
            'A tarot ritual that turns the lights down, card by card',
            'A live night sky with search and time travel',
            'One currency for everything, English and Polish throughout',
        ],
        role: 'Solo: product, design, full stack, infrastructure',
        url: 'https://soulfate.app',
        stack: [
            'Next.js 16',
            'React 19',
            'Tailwind v4',
            'next-intl',
            'Hono',
            'Postgres + Drizzle',
            'Vercel AI SDK',
            'astronomy-engine',
            'Stripe',
            'Docker',
        ],
        logo: '/work/soulfate/logo.webp',
        shots: [
            desktop(
                '/work/soulfate/01-landing.webp',
                'Soulfate welcome screen with a gold crystal-ball mark, the line "Written in the stars. Shaped by you." and a "Find your guide" button',
                'The front door: one question, no sign-up wall',
            ),
            desktop(
                '/work/soulfate/02-chat.webp',
                'A conversation with the guide Selena about work, beside a moon-phase and transits panel',
                'Conversations with a guide who knows your chart, beside today\'s sky',
            ),
            desktop(
                '/work/soulfate/03-path.webp',
                'The "Your path" home with finished steps and the guide\'s next step, "Your numbers"',
                'The path: one step a day, chosen by your guide',
            ),
            desktop(
                '/work/soulfate/04-birth-chart.webp',
                'Birth chart wheel with planets, houses and aspect lines',
                'The whole birth chart in one wheel',
            ),
            desktop(
                '/work/soulfate/05-night-sky.webp',
                'Live star map with Orion highlighted, its card and time controls',
                'The night sky, live: search, time travel, your birth sky',
            ),
            desktop(
                '/work/soulfate/06-tarot-reading.webp',
                'Three-card reading of The Tower, Strength and The Star under the reader\'s question',
                'A three-card spread read against your question',
            ),
            desktop(
                '/work/soulfate/07-onboarding-guide.webp',
                'Onboarding step "Which guide is right for you?" with a personality-trait radar',
                'Shape the radar and a guide is matched to you',
            ),
            desktop(
                '/work/soulfate/08-wishes.webp',
                'Wishes page with a balance, a daily free allowance gauge and Free, Premium and Platinum plans',
                'Wishes: one currency for chats, spreads and pages',
            ),
            mobile(
                '/work/soulfate/09-path-mobile.webp',
                'The path on a phone with the guide\'s step card',
                'The path on a phone',
            ),
            mobile(
                '/work/soulfate/10-night-sky-mobile.webp',
                'Star map on a phone with Orion focused and its card at the bottom',
                'The sky in your pocket',
            ),
            mobile(
                '/work/soulfate/11-tarot-mobile.webp',
                'The dark tarot ritual on a phone, three cards with The World revealed in the middle',
                'The tarot reveal, card by card',
            ),
        ],
        preview: '/work/soulfate/preview.mp4',
        featured: true,
    },
    {
        slug: 'flunky-beer',
        name: 'flunky.beer',
        blurb: 'Invite-only flunkyball scorekeeper with live scoring, cups, rankings and badges.',
        description: [
            'A scorekeeper for flunkyball, the lawn game with two teams and one bottle. Every throw is tapped in live, and the stats, rankings and badges build themselves.',
        ],
        features: [
            'Live score on every phone at the table',
            'Cup and round-robin tournaments with brackets',
            'Rankings, streaks and head-to-head records',
            'A badge ladder that reads without colour',
            'A carbonated amber identity with no JavaScript animation',
            'English, Polish and German',
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
        logo: '/work/flunky-beer/logo.webp',
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
            'The home of a 24-hour listening festival on a forest clearing in Gdynia, with the whole site sitting under one slowly moving dithered texture.',
        ],
        features: [
            'A real-time GLSL dither behind every page',
            'A programme that marks blocks past, live or next as the festival runs',
            'Artist cards cut at shifting angles, fading from grey to colour',
            'Polish and English with an instant switch',
            'Light on phones: lower resolution and a capped frame rate',
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
        logo: '/work/sluchanie-receptywne/logo.webp',
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
        slug: 'persona',
        name: 'Persona',
        blurb: 'A platform where an AI character is a config file, not a codebase: chat, voice, images and video from one engine.',
        description: [
            'A platform where an AI character is a config file, not a codebase. Personality, voice, memory and pricing are set in a console, and a new character goes live without a deploy.',
        ],
        features: [
            'New characters without writing code',
            'Chat, cloned voices, images and video',
            'Remembers each person across conversations',
            'One engine for web apps and Discord',
            'Plans, pricing and usage limits built in',
        ],
        role: 'Solo: architecture, back end, operator console',
        privateNote:
            'Private: the platform and its console are internal, so there is nothing to show beyond the name.',
        stack: [
            'TypeScript',
            'Turborepo',
            'Hono',
            'Zod',
            'Postgres + Drizzle',
            'Next.js',
            'Docker',
        ],
        logo: '/work/persona/logo.webp',
        // Nothing public to screenshot: the gallery is the wordmark itself.
        shots: [
            desktop(
                '/work/persona/logo.webp',
                'The Persona wordmark, its first letter mirrored, on a dark background',
                'Persona',
            ),
        ],
        featured: false,
    },
    {
        slug: 'aleksandra-kolesniak',
        name: 'Aleksandra Koleśniak',
        blurb: 'Scroll-driven portfolio for a painter, with a hand-drawn character as the menu.',
        description: [
            "A portfolio that is part of the art. Paintings sit on horizontal galleries moved by scrolling, and the painter's hand-drawn character, Bob, turns as you go and opens the menu.",
        ],
        features: [
            'Bob morphs smoothly between drawings, to any pose in between',
            'Horizontal galleries driven by vertical scroll',
            'A zoom viewer with pinch, momentum and double-tap',
            "The painter edits everything herself, even Bob's timing",
            'A static site that never waits on the CMS',
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
        logo: '/work/aleksandra-kolesniak/logo.webp',
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
            'A voice for my home AI agent. Speak or type, watch it call tools in real time and hear the answer read back, while a particle figure changes shape with every step.',
        ],
        features: [
            'A hand-written GLSL particle figure that reacts to every step',
            'A wake word and hands-free listening',
            'Starts speaking before the answer is finished',
            'Tool calls stream in live as the agent works',
            'Scales itself to the GPU it runs on',
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
        logo: '/work/butler/logo.webp',
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
            'An absurd browser runner about a cockroach. Ten levels, a boss fight, and live races where up to 16 players dodge the same obstacles at once.',
        ],
        features: [
            'Live multiplayer for up to 16 players',
            'Every player sees exactly the same obstacles',
            'Ten levels, each with its own art and soundtrack',
            'A boss fight, weather and death replays',
            'Plays on a phone with touch controls',
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
        logo: '/work/cockroach-the-game/logo.webp',
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
            'The front door to my home media server. Friends see what is new in films, shows and books, request more and check their stats, all behind one sign-in.',
        ],
        features: [
            'New films, shows and books in one feed',
            'Cards that morph into their details',
            'Market charts you can customise',
            'Subscriptions tied to Plex sharing',
            'Tuned to scroll smoothly on phones',
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
        logo: '/work/wszystko-app/logo.webp',
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
            "A Polish music news portal with news, reviews, interviews and concert galleries. I built it in 2022 and rebuilt it in 2026 on a CMS that runs on the client's own server.",
        ],
        features: [
            'About 14,000 articles moved over with nothing lost',
            '4,984 old links redirected automatically',
            'Editors build pages from blocks',
            'Pages update the moment an editor publishes',
            'SEO filled in automatically, never overwriting an editor',
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
        logo: '/work/cantara-music/logo.webp',
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

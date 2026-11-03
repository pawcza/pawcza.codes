const authors = [
    'marcus-aurelius',
    'epictetus',
    'seneca-the-younger',
    'epicurus',
    'henry-david-thoreau',
    'franz-kafka',
    'cicero',
    'alan-watts',
    'aldous-huxley',
    'alexander-the-great',
    'archimedes',
    'carl-jung',
    'simone-de-beauvoir',
    'immanuel-kant',
    'laozi',
    'friedrich-nietzsche',
    'aristotle',
    'plato',
    'confucius',
];

/** The page has a fallback quote, so a slow API is not worth waiting for. */
const TIMEOUT_MS = 3000;

export async function GET() {
    try {
        const index = Math.floor(Math.random() * authors.length);
        const author = authors[index];
        const res = await fetch(
            `https://api.quotable.kurokeita.dev/api/quotes/random?author=${author}`,
            {
                headers: {
                    Accept: 'application/json',
                },
                signal: AbortSignal.timeout(TIMEOUT_MS),
            },
        );
        if (!res.ok) throw new Error(`upstream ${res.status}`);

        const { quote } = await res.json();

        // Someone else's data ends up in an href on the page.
        if (!quote?.content || !quote.author?.link?.startsWith('https://')) {
            throw new Error('unusable quote');
        }

        return Response.json({ quote });
    } catch (error) {
        console.error('Error fetching quote:', error);
        return Response.json(
            { error: 'Failed to fetch quote' },
            { status: 502 },
        );
    }
}

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
];

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
            },
        );

        const { quote } = await res.json();

        return new Response(JSON.stringify({ quote }));
    } catch (error) {
        console.error('Error fetching quote:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch quote', status: 500 }),
        );
    }
}

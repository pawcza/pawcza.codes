export async function GET() {
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
    const res = await fetch(
        'https://api.quotable.io/quotes/random?author=' + authors.join('|'),
        {
            headers: {
                Accept: 'application/json',
            },
        },
    );

    if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Fetching new data', data);

    return new Response(JSON.stringify({ data }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

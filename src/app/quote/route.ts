import { NextResponse } from 'next/server';

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

const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3,
    delay = 500,
) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                throw new Error(`Error: ${res.status} ${res.statusText}`);
            }
            return res;
        } catch (error) {
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};

export async function GET() {
    try {
        const res = await fetchWithRetry(
            'https://api.quotable.io/quotes/random?author=' + authors.join('|'),
            {
                headers: {
                    Accept: 'application/json',
                },
            },
        );

        const data = await res.json();

        return new Response(JSON.stringify({ data }));
    } catch (error) {
        console.error('Error fetching quote:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch quote', status: 500 }),
        );
    }
}

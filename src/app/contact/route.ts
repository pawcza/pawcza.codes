/**
 * The contact form's endpoint. Forwards a message to ntfy as a push
 * notification (tap it to reply by email). The topic lives in the
 * CONTACT_NTFY_TOPIC env var so it never lands in the repo.
 *
 * Spam guards, no dependencies: a hidden honeypot field, a minimum time
 * between the form appearing and being sent, and a per-IP rate limit.
 * Bots that trip them get a normal "sent" so they learn nothing.
 */

const NTFY_SERVER = process.env.NTFY_SERVER ?? 'https://ntfy.sh';
const TOPIC = process.env.CONTACT_NTFY_TOPIC;

const MIN_FILL_MS = 3000;
const WINDOW_MS = 60 * 60 * 1000;
const PER_WINDOW = 5;
/** More addresses than this and the old ones are swept out. */
const MAX_TRACKED = 1000;
const recent = new Map<string, number[]>();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limited = (ip: string) => {
    const now = Date.now();
    const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    hits.push(now);
    recent.set(ip, hits);
    if (recent.size > MAX_TRACKED) {
        for (const [key, times] of recent) {
            if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
        }
    }
    return hits.length > PER_WINDOW;
};

const clean = (value: unknown, max: number) =>
    typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function POST(request: Request) {
    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'bad-request' }, { status: 400 });
    }

    const name = clean(body.name, 100);
    const email = clean(body.email, 200);
    const message = clean(body.message, 4000);

    if (!name || !EMAIL.test(email) || message.length < 10) {
        return Response.json({ error: 'invalid' }, { status: 422 });
    }

    const trap =
        clean(body.website, 200) !== '' ||
        typeof body.elapsed !== 'number' ||
        body.elapsed < MIN_FILL_MS;
    if (trap) return Response.json({ ok: true });

    // Set by Cloudflare. x-forwarded-for starts with whatever the client sent,
    // so limiting on that is limiting nobody.
    const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-real-ip') ??
        'unknown';
    if (limited(ip)) {
        return Response.json({ error: 'rate-limited' }, { status: 429 });
    }

    if (!TOPIC) {
        console.error('[contact] CONTACT_NTFY_TOPIC is not set');
        return Response.json({ error: 'unavailable' }, { status: 503 });
    }

    // JSON publishing, not headers: headers cannot carry "Paweł".
    const res = await fetch(NTFY_SERVER, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            topic: TOPIC,
            title: `pawcza.codes: ${name}`,
            message: `${message}\n\n— ${name} <${email}>`,
            tags: ['envelope'],
            click: `mailto:${email}`,
        }),
    }).catch(() => null);

    if (!res?.ok) {
        console.error('[contact] ntfy publish failed', res?.status);
        return Response.json({ error: 'unavailable' }, { status: 502 });
    }
    return Response.json({ ok: true });
}

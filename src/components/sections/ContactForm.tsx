'use client';

import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const errors: Record<string, string> = {
    invalid: 'Add your name, a valid email and a few words.',
    'rate-limited': 'That is a lot of messages. Try again in a while.',
    default: 'Something went wrong. Try again, or find me on LinkedIn.',
};

const field =
    'glass-pill w-full rounded-[var(--radius)] px-4 py-3 text-body text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** "Drop me a line": posts to /contact, which forwards it to ntfy. */
const ContactForm = () => {
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState('');
    const shownAt = useRef(0);

    useEffect(() => {
        shownAt.current = Date.now();
    }, []);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setStatus('sending');
        setError('');
        try {
            const res = await fetch('/contact', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    elapsed: Date.now() - shownAt.current,
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error ?? 'default');
            form.reset();
            setStatus('sent');
        } catch (err) {
            const key = err instanceof Error ? err.message : 'default';
            setError(errors[key] ?? errors.default);
            setStatus('error');
        }
    };

    if (status === 'sent') {
        return (
            <div className="glass-pill max-w-prose rounded-[var(--radius)] p-6">
                <p className="text-heading font-medium text-ink">
                    Got it, thanks.
                </p>
                <p className="mt-2 text-body text-ink-muted">
                    I will get back to you as soon as the universe allows.
                </p>
                <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="glass-pill btn mt-5"
                >
                    Send another
                </button>
            </div>
        );
    }

    return (
        <form
            onSubmit={onSubmit}
            className="grid max-w-prose gap-3"
            noValidate={false}
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                    <span className="eyebrow">Name</span>
                    <input
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                        className={field}
                    />
                </label>
                <label className="grid gap-1.5">
                    <span className="eyebrow">Email</span>
                    <input
                        name="email"
                        type="email"
                        required
                        maxLength={200}
                        autoComplete="email"
                        className={field}
                    />
                </label>
            </div>
            <label className="grid gap-1.5">
                <span className="eyebrow">Message</span>
                <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={5}
                    className={`${field} resize-y`}
                />
            </label>
            {/* Honeypot: hidden from people and screen readers, bait for bots. */}
            <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px opacity-0"
            />
            <div className="mt-2 flex flex-wrap items-center gap-4">
                <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="glass-pill btn btn-primary disabled:opacity-60"
                >
                    {status === 'sending' ? 'Sending…' : 'Send'}
                </button>
                <p role="status" className="text-small text-ink-muted">
                    {status === 'error' ? error : ''}
                </p>
            </div>
        </form>
    );
};

export default ContactForm;

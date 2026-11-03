'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import MatrixText from '@/components/common/MatrixText';
import Reveal from '@/components/common/Reveal';
import { ArrowUpRight, Refresh } from '@/components/common/Icons';

interface Quote {
    id: string;
    content: string;
    author: {
        name: string;
        description: string;
        link: string;
    };
}

/** Shown before the first fetch lands, and if the API is unreachable. */
const fallback: Quote = {
    id: 'fallback',
    content: 'There is nothing impossible to him who will try.',
    author: {
        name: 'Alexander the Great',
        description: 'King of Macedon',
        link: 'https://en.wikipedia.org/wiki/Alexander_the_Great',
    },
};

const QuoteSection = () => {
    const [quote, setQuote] = useState<Quote>(fallback);
    const [loading, setLoading] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    const getQuote = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/quote');
            if (!response.ok) throw new Error(response.statusText);
            const { quote } = await response.json();
            if (quote?.content) setQuote(quote);
        } catch (error) {
            console.error('Error fetching quote:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetched on the way to it: a visitor who never gets here costs nothing.
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                getQuote();
            },
            { rootMargin: '600px' },
        );
        observer.observe(section);
        return () => observer.disconnect();
    }, [getQuote]);

    return (
        <section
            ref={sectionRef}
            id="quote"
            className="mx-auto w-full max-w-content px-6 py-16 md:py-20"
        >
            <Reveal>
                <figure className="card p-8 md:p-10">
                    <blockquote>
                        <MatrixText
                            key={quote.id}
                            startOnView
                            classNames="text-lead font-medium leading-relaxed text-ink"
                        >
                            {quote.content}
                        </MatrixText>
                    </blockquote>

                    <figcaption className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <a
                                href={quote.author.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-small font-medium text-ink transition-colors hover:text-accent"
                            >
                                <span className="link-underline">
                                    {quote.author.name}
                                </span>
                                <ArrowUpRight width={13} height={13} />
                            </a>
                            {quote.author.description && (
                                <p className="mt-1 text-small text-ink-faint">
                                    {quote.author.description}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={getQuote}
                            disabled={loading}
                            title="Another one"
                            className="glass-pill btn-icon shrink-0 disabled:pointer-events-none disabled:opacity-40"
                        >
                            <Refresh
                                width={15}
                                height={15}
                                className={loading ? 'animate-spin' : undefined}
                            />
                            <span className="sr-only">Another one</span>
                        </button>
                    </figcaption>
                </figure>
            </Reveal>
        </section>
    );
};

export default QuoteSection;

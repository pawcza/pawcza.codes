'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Refresh from '@mui/icons-material/Refresh';

import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';

interface Quote {
    id: string;
    content: string;
    tags: {
        id: string;
        name: string;
    }[];
    author: {
        id: string;
        name: string;
        slug: string;
        description: string;
        bio: string;
        link: string;
    };
}

const fetchQuoteData = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quote`);
    if (!res.ok) {
        throw new Error(`Failed to fetch quote: ${res.statusText}`);
    }
    const { quote } = await res.json();
    return quote;
};

const QuoteOfTheDay = () => {
    const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false); // Prevent double fetch

    const getQuote = async () => {
        setLoading(true);
        try {
            const quote = await fetchQuoteData();
            setQuote(quote);
        } catch (error) {
            console.error('Error fetching quote:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            getQuote();
        }
    }, []);

    return (
        <motion.section
            className="flex flex-col relative p-8 mx-auto w-full break-words component min-h-52"
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            onAnimationComplete={() => setHasAnimationCompleted(true)}
            layout
            transition={{ delay: 0.2 }}
        >
            {quote?.content ? (
                <MatrixText
                    key={quote.content}
                    classNames={`text-lg md:text-xl italic font-bold mb-2`}
                    hasStarted={hasAnimationCompleted}
                >
                    {quote.content}
                </MatrixText>
            ) : (
                <MatrixText
                    hasStarted={false}
                    classNames="text-lg md:text-xl italic font-bold mb-2"
                >
                    There is nothing impossible to him who will try.
                </MatrixText>
            )}
            {quote?.author ? (
                <MatrixText
                    key={quote.author.name}
                    classNames="text-md mb-4"
                    hasStarted={hasAnimationCompleted}
                >
                    {quote.author.name}
                </MatrixText>
            ) : (
                <MatrixText hasStarted={false}>Alexander the Great</MatrixText>
            )}
            <IconLink
                outerClass="mt-auto w-fit"
                className={`transition-all ${loading ? 'animate-spin' : ''}`}
                onClick={getQuote}
                disabled={loading}
                MuiIcon={Refresh}
                inverted
            />
        </motion.section>
    );
};

export default QuoteOfTheDay;

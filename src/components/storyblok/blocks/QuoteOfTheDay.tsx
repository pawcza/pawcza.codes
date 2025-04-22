'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Refresh from '@mui/icons-material/Refresh';

import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';

const fetchQuoteData = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quote`);
    const { data } = await res.json();
    return data;
};

const QuoteOfTheDay = () => {
    const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);
    const [quote, setQuote] = useState<{
        content: string;
        author: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const getQuote = async () => {
        setLoading(true);
        const data = await fetchQuoteData();
        setQuote(data[0]);
        setLoading(false);
    };

    useEffect(() => {
        getQuote();
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
            {quote?.content && (
                <MatrixText
                    key={quote.content} // Add key prop
                    classNames={`text-lg md:text-xl italic font-bold mb-2`}
                    hasStarted={hasAnimationCompleted}
                >
                    {quote.content}
                </MatrixText>
            )}
            {quote?.author && (
                <MatrixText
                    key={quote.author}
                    classNames="text-md mb-4"
                    hasStarted={hasAnimationCompleted}
                >
                    {quote.author}
                </MatrixText>
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

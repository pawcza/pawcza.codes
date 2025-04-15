'use client';

import { useState, useEffect } from 'react';
import Refresh from '@mui/icons-material/Refresh';

import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';

const fetchQuoteData = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/quote`);
    const { data } = await res.json();
    return data;
};

const QuoteOfTheDay = () => {
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
        <section className="flex flex-col relative bg-background p-8 mx-auto w-full break-words component min-h-52">
            {quote?.content && (
                <MatrixText
                    key={quote.content} // Add key prop
                    classNames={`text-lg md:text-xl italic font-bold mb-2`}
                >
                    {quote.content}
                </MatrixText>
            )}
            {quote?.author && (
                <MatrixText key={quote.author} classNames="text-md mb-4">
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
        </section>
    );
};

export default QuoteOfTheDay;

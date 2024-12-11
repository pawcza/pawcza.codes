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
        <section className="flex flex-col relative bg-background p-4 mx-auto md:w-[768px] w-full min-h-52 break-words rounded-md">
            {quote?.content && (
                <MatrixText
                    key={quote.content} // Add key prop
                    ordered
                    minTimeToMatch={10}
                    maxTimeToMatch={30}
                    minIntervalTime={10}
                    maxIntervalTime={30}
                    classNames="text-3xl italic font-bold"
                >
                    {quote.content}
                </MatrixText>
            )}
            {quote?.author && (
                <MatrixText key={quote.author} classNames="text-md mb-2">
                    {quote.author}
                </MatrixText>
            )}
            <IconLink
                outerClasses="mt-auto w-fit"
                classNames={loading ? 'animate-spin' : ''}
                onClick={getQuote}
                MuiIcon={Refresh}
                inverted
            />
        </section>
    );
};

export default QuoteOfTheDay;

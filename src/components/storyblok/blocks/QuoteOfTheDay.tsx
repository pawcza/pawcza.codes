'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Refresh from '@mui/icons-material/Refresh';
import Info from '@mui/icons-material/Info';
import Link from '@mui/icons-material/Link';

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
    const [authorInfoOpen, setAuthorInfoOpen] = useState(false);
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
                <div className="flex mb-4 items-center">
                    <MatrixText
                        key={quote.author.name}
                        classNames="text-md mr-2"
                        hasStarted={hasAnimationCompleted}
                    >
                        {quote.author.name}
                    </MatrixText>
                    <IconLink
                        className="text-sm"
                        onClick={() => setAuthorInfoOpen(true)}
                        MuiIcon={Info}
                    />
                </div>
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
            <AnimatePresence initial={false}>
                {authorInfoOpen && (
                    <motion.section
                        key={quote?.author.id}
                        onClick={() => setAuthorInfoOpen(false)}
                        exit={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        initial={{ opacity: 0 }}
                        className={`fixed bottom-0 left-0 right-0 z-50 flex h-screen w-screen justify-center items-center p-4 bg-[rgba(0,0,0,.25)] backdrop-blur-sm`}
                    >
                        <motion.div
                            className="flex flex-col gap-4 max-w-screen-sm bg-background p-8 shadow-xl"
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                        >
                            {quote?.author.name && (
                                <div className="flex items-center -mb-4">
                                    <MatrixText
                                        hasStarted={hasAnimationCompleted}
                                        classNames="text-lg font-bold mr-2"
                                    >
                                        {quote.author.name}
                                    </MatrixText>
                                    <IconLink
                                        className="text-sm"
                                        MuiIcon={Link}
                                        href={quote.author.link}
                                    />
                                </div>
                            )}
                            <p className="text-sm">
                                {quote?.author.description}
                            </p>
                            <div className="flex gap-2">
                                {quote?.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="text-sm bg-gray-200 text-gray-800 px-2 py-1 rounded-full"
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <span className="text-sm font-semibold">
                                    {quote?.author.bio}
                                </span>
                            </div>
                        </motion.div>
                    </motion.section>
                )}
            </AnimatePresence>
        </motion.section>
    );
};

export default QuoteOfTheDay;

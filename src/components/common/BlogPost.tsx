'use client';

import { PostStoryblok } from '@/types/component-types-sb';
import MatrixText from '@/components/common/MatrixText';
import Tag from '@/components/common/Tag';
import Markdown from 'react-markdown';
import { Link } from 'next-view-transitions';
import IconLink from '@/components/common/IconLink';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import React, { useEffect, useRef, useState } from 'react';

export const BlogPost = ({
    title,
    tags,
    date,
    content,
    _uid,
    type = 'listing',
}: { type?: 'listing' | 'post' } & PostStoryblok) => {
    const contentContainerRef =
        useRef() as React.MutableRefObject<HTMLDivElement | null>;

    const markerRef = useRef() as React.MutableRefObject<HTMLDivElement | null>;

    const [arrowUpwardVisible, setArrowUpwardVisible] = useState(false);

    useEffect(() => {
        if (!markerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => setArrowUpwardVisible(!entry.isIntersecting),
            {
                threshold: 1.0,
            },
        );

        observer.observe(markerRef.current!);

        return () => observer.disconnect();
    }, []);
    const handleUpwardClick = () => {
        if (contentContainerRef.current) {
            const top = contentContainerRef.current.offsetTop;
            console.log(top);
            window.scrollTo({
                top: top - 8,
                behavior: 'smooth',
            });
        }
    };

    return (
        <>
            <div
                className={`w-full mb-2 bg-background p-8 flex items-center flex-wrap gap-4 rounded-lg border border-foreground shadow-2xl ${type === 'listing' ? 'hover:bg-foreground hover:text-background transition-colors' : ''}`}
                style={{
                    viewTransitionName: `view-transition-post-${_uid}`,
                }}
            >
                {title && (
                    <MatrixText classNames="font-bold text-lg">
                        {title}
                    </MatrixText>
                )}
                {date && (
                    <div className="mr-auto">
                        / {new Date(date).toLocaleDateString(`pl-PL`)}
                    </div>
                )}
                {tags && (
                    <div className="flex gap-2 items-center font-normal">
                        {tags.map((tag) => (
                            <Tag key={tag} tag={tag} />
                        ))}
                    </div>
                )}
            </div>
            {content && (
                <div
                    className="p-8 bg-background border border-foreground shadow-2xl rounded-lg relative"
                    ref={contentContainerRef}
                >
                    <div ref={markerRef} className="h-1" />
                    <div className="sticky top-10 h-0">
                        <div className="absolute -left-20 -top-8 z-50">
                            <IconLink
                                internal
                                inverted
                                MuiIcon={ArrowBackIcon}
                                href="/blog"
                            />
                        </div>
                        <div
                            className={`absolute -left-20 top-4 z-50 transition-all ${arrowUpwardVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <IconLink
                                internal
                                inverted
                                MuiIcon={ArrowUpwardIcon}
                                onClick={handleUpwardClick}
                            />
                        </div>
                    </div>
                    <Markdown className="markdown">{content}</Markdown>
                </div>
            )}
        </>
    );
};

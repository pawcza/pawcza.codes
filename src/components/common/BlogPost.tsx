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

    const [scrolledPast, setScrolledPast] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const top = contentContainerRef.current?.offsetTop;
            const height = contentContainerRef.current?.offsetHeight;
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            if (!top || !height) return;

            if (scrollY < top) {
                return;
            }

            console.log(
                `top: ${top}, height: ${height}, scrollY: ${scrollY}, windowHeight: ${windowHeight}`,
            );

            const progress = (
                (scrollY - top) /
                (height! - windowHeight)
            ).toFixed(2);

            if (progress > 1) return;

            setProgress(Number(progress));
        };

        window.addEventListener('scroll', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    useEffect(() => {
        if (!markerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => setScrolledPast(!entry.isIntersecting),
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
                className={`w-full mb-2 bg-background p-8 flex items-center flex-wrap gap-4 component shadow-2xl ${type === 'listing' ? 'hover:bg-foreground hover:text-background transition-colors' : ''}`}
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
                    className="p-8 component shadow-2xl relative"
                    ref={contentContainerRef}
                >
                    <div ref={markerRef} className="h-1" />
                    <div className="sticky top-10 h-0">
                        <div className="absolute -left-20 -top-9 z-50">
                            <IconLink
                                internal
                                inverted
                                MuiIcon={ArrowBackIcon}
                                href="/blog"
                            />
                        </div>
                        <div
                            className={`group absolute -left-20 top-3 z-50 transition-all ${scrolledPast ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <IconLink
                                internal
                                inverted
                                MuiIcon={ArrowUpwardIcon}
                                onClick={handleUpwardClick}
                            />
                            <svg
                                width="42"
                                height="42"
                                className="absolute top-0 pointer-events-none"
                            >
                                <circle
                                    cx="21"
                                    cy="21"
                                    r={16}
                                    strokeWidth={2}
                                    fill="none"
                                    className="group-hover:stroke-foreground stroke-background"
                                    strokeDasharray={`${2 * Math.PI * 16}`}
                                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress)}`}
                                    transform="rotate(-90 21 21)" // rotate so progress starts at top
                                />
                                <circle
                                    cx="21"
                                    cy="21"
                                    r={16}
                                    strokeWidth={1}
                                    fill="none"
                                    className="group-hover:stroke-foreground stroke-background opacity-25"
                                />
                            </svg>
                        </div>
                    </div>
                    <Markdown className="markdown">{content}</Markdown>
                </div>
            )}
        </>
    );
};

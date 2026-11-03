'use client';

import React, { useEffect, useRef, useState } from 'react';

/** Fades content up as it enters the viewport, once. */
const Reveal = ({
    children,
    delay = 0,
    className = '',
    ...rest
}: {
    children?: React.ReactNode;
    delay?: number;
    className?: string;
    'aria-hidden'?: boolean;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setShown(true);
                observer.disconnect();
            },
            { rootMargin: '-80px' },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            {...rest}
            ref={ref}
            data-shown={shown ? '' : undefined}
            className={`reveal ${className}`}
            style={{ transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
};

export default Reveal;

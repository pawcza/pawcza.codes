import React from 'react';

import Reveal from '@/components/common/Reveal';
import MatrixText from '@/components/common/MatrixText';

const Section = ({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) => (
    <section
        id={id}
        className="mx-auto w-full max-w-content px-6 py-20 md:py-28"
    >
        <Reveal>
            <h2>
                <MatrixText
                    startOnView
                    mono={false}
                    classNames="heading text-[clamp(1.75rem,1.2rem+2.2vw,2.75rem)]"
                >
                    {title}
                </MatrixText>
            </h2>
            <div className="hairline mt-8" />
        </Reveal>
        {children}
    </section>
);

export default Section;

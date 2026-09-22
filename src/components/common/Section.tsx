import React from 'react';

import Reveal from '@/components/common/Reveal';
import MatrixText from '@/components/common/MatrixText';

/**
 * A section: its editorial index sits directly above the title. Sections
 * with labelled rows (dates, categories) put the labels in the first three
 * columns of a 12-column grid and the content from column four.
 */
const Section = ({
    id,
    index,
    title,
    children,
}: {
    id: string;
    /** Editorial index, e.g. "01". */
    index: string;
    title: string;
    children: React.ReactNode;
}) => (
    <section
        id={id}
        className="mx-auto w-full max-w-content px-6 py-20 md:py-28"
    >
        <Reveal>
            <p className="eyebrow">{index}</p>
            <h2 className="mt-3">
                <MatrixText
                    startOnView
                    mono={false}
                    classNames="heading text-title"
                >
                    {title}
                </MatrixText>
            </h2>
        </Reveal>
        <div className="hairline edge-line mt-8" />
        {children}
    </section>
);

export default Section;

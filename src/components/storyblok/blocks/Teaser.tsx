'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { storyblokEditable } from '@storyblok/react/rsc';
import { TeaserStoryblok } from '@/types/component-types-sb';
import MatrixText from '@/components/common/MatrixText';

const Teaser = ({ blok }: { blok: TeaserStoryblok }) => {
    const [hasTitleAnimationCompleted, setHasTitleAnimationCompleted] =
        useState(false);
    const [
        hasDescriptionAnimationCompleted,
        setHasDescriptionAnimationCompleted,
    ] = useState(false);

    const getGap = (gap: string) => {
        const gapNumber = parseInt(gap, 10);

        switch (gapNumber) {
            case 1:
                return 'gap-1';
            case 2:
                return 'gap-2';
            case 3:
                return 'gap-3';
            case 4:
                return 'gap-4';
            case 5:
                return 'gap-5';
            case 6:
                return 'gap-6';
            case 7:
                return 'gap-7';
            case 8:
                return 'gap-8';
            case 9:
                return 'gap-9';
            case 10:
                return 'gap-10';
            default:
                return 'gap-4';
        }
    };

    return (
        <div
            className={`max-w-screen-md flex flex-wrap ${blok.verticalAlign} ${blok.horizontalAlign} ${blok.layout} ${getGap(blok.gap)}`}
            style={{
                viewTransitionName: 'view-transition-teaser',
            }}
            {...storyblokEditable(blok)}
        >
            {blok.headline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    onAnimationComplete={() =>
                        setHasTitleAnimationCompleted(true)
                    }
                >
                    <MatrixText
                        hasStarted={hasTitleAnimationCompleted}
                        classNames="
            md:text-4xl
            text-2xl
            component
            font-bold
            p-8
            "
                    >
                        {blok.headline}
                    </MatrixText>
                </motion.div>
            )}
            {blok.description && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onAnimationComplete={() =>
                        setHasDescriptionAnimationCompleted(true)
                    }
                >
                    <p className="text-lg component p-8">{blok.description}</p>
                </motion.div>
            )}
        </div>
    );
};

export default Teaser;

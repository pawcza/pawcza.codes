'use client';

import React from 'react';
import { motion } from 'motion/react';

/** Fades content up as it enters the viewport, once. */
const Reveal = ({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) => (
    <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
        {children}
    </motion.div>
);

export default Reveal;

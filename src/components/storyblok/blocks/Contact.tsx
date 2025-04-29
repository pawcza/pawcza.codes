'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { storyblokEditable } from '@storyblok/react/rsc';
import Github from '@mui/icons-material/GitHub';
import LinkedIn from '@mui/icons-material/LinkedIn';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';

import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';

import { ContactStoryblok } from '@/types/component-types-sb';

const Contact = ({ blok }: { blok: ContactStoryblok }) => {
    const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);

    return (
        <section
            className="max-w-screen-md mx-auto flex flex-col items-center justify-center text-sm md:text-md"
            {...storyblokEditable(blok)}
        >
            <motion.ul
                initial={{ opacity: 0, y: -50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onAnimationComplete={() => setHasAnimationCompleted(true)}
                className="overflow-hidden flex items-center justify-center component px-4"
            >
                {blok.contactText && (
                    <MatrixText
                        classNames="mr-2"
                        hasStarted={hasAnimationCompleted}
                    >
                        {blok.contactText}
                    </MatrixText>
                )}
                {blok.github && (
                    <motion.li
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="leading-none"
                    >
                        <IconLink href={blok.github} MuiIcon={Github} />
                    </motion.li>
                )}
                {blok.linkedin && (
                    <motion.li
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="leading-none"
                    >
                        <IconLink href={blok.linkedin} MuiIcon={LinkedIn} />
                    </motion.li>
                )}
                {blok.email && (
                    <motion.li
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="leading-none"
                    >
                        <IconLink
                            href={`mailto:${blok.email}`}
                            MuiIcon={EmailOutlined}
                        />
                    </motion.li>
                )}
                {blok.phone && (
                    <motion.li
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="leading-none"
                    >
                        <IconLink
                            href={`tel:${blok.phone}`}
                            MuiIcon={PhoneOutlined}
                        />
                    </motion.li>
                )}
            </motion.ul>
        </section>
    );
};

export default Contact;

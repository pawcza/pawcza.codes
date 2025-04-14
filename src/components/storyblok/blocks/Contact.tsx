'use client';

import React from 'react';
import { storyblokEditable } from '@storyblok/react/rsc';
import Github from '@mui/icons-material/GitHub';
import LinkedIn from '@mui/icons-material/LinkedIn';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';

import MatrixText from '@/components/common/MatrixText';
import IconLink from '@/components/common/IconLink';

import { ContactStoryblok } from '@/types/component-types-sb';

const Contact = ({ blok }: { blok: ContactStoryblok }) => {
    return (
        <section
            className="max-w-screen-md mx-auto py-2 flex flex-col items-center justify-center text-sm md:text-md"
            {...storyblokEditable(blok)}
        >
            <div className="px-4 bg-background overflow-hidden border border-foreground rounded-lg shadow-2xl flex items-center justify-center">
                {blok.intro && (
                    <MatrixText classNames="inline-block mr-2">
                        {blok.intro}
                    </MatrixText>
                )}
                {blok.employerLink && (
                    <IconLink
                        href={blok.employerLink}
                        html={blok.employerIcon}
                        className="w-24 inline-block"
                    />
                )}
            </div>
            <ul className="overflow-hidden flex items-center justify-center mt-2 px-4 text-foreground bg-background border border-foreground rounded-lg shadow-2xl">
                {blok.contactText && (
                    <MatrixText classNames="mr-2">
                        {blok.contactText}
                    </MatrixText>
                )}
                {blok.github && (
                    <li>
                        <IconLink href={blok.github} MuiIcon={Github} />
                    </li>
                )}
                {blok.linkedin && (
                    <li>
                        <IconLink href={blok.linkedin} MuiIcon={LinkedIn} />
                    </li>
                )}
                {blok.email && (
                    <li>
                        <IconLink
                            href={`mailto:${blok.email}`}
                            MuiIcon={EmailOutlined}
                        />
                    </li>
                )}
                {blok.phone && (
                    <li>
                        <IconLink
                            href={`tel:${blok.phone}`}
                            MuiIcon={PhoneOutlined}
                        />
                    </li>
                )}
            </ul>
        </section>
    );
};

export default Contact;

import { Link } from 'next-view-transitions';
import React from 'react';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { motion } from 'motion/react';

const IconLink = ({
    MuiIcon,
    href,
    html,
    className,
    outerClass,
    onClick,
    internal,
    inverted,
    disabled,
}: {
    MuiIcon?: OverridableComponent<SvgIconTypeMap> & { muiName: string };
    href?: string;
    html?: string;
    className?: string;
    onClick?: () => Promise<void> | void;
    outerClass?: string;
    internal?: boolean;
    inverted?: boolean;
    disabled?: boolean;
}) => {
    const hoverClasses = `
        ${
            inverted
                ? '[&_svg]:fill-background [&_svg]:hover:fill-foreground after:bg-foreground hover:after:scale-0 hover:border-foreground hover:bg-background border border-transparent '
                : '[&_svg]:fill-foreground [&_svg]:hover:fill-background after:left-[var(--icon-link-hover-left)] after:bg-foreground'
        }
        [&_svg]:relative
        [&_svg]:z-10
        user-select-none
        p-2
        inline-block
        relative
        after:content-[""]
        after:block
        after:w-full
        after:h-full
        after:absolute 
        after:top-0
        after:-left-full
        after:z-0
        overflow-hidden
        `;

    const externalProps = !internal && {
        target: '_blank',
        rel: 'noopener noreferrer',
    };

    const variants = {
        hover: {
            '--icon-link-hover-left': '0',
            backgroundColor: inverted
                ? 'var(--foreground)'
                : 'var(--background)',
            transition: {
                duration: 0.3,
                ease: 'easeInOut',
            },
        },
        initial: {
            '--icon-link-hover-left': '-100%',
        },
        exit: {
            '--icon-link-hover-left': '100%',
        },
    };

    if (onClick) {
        return (
            <motion.div
                variants={variants}
                initial="initial"
                animate="exit"
                exit="exit"
                whileHover="hover"
                className={`cursor-pointer ${hoverClasses} ${outerClass ? outerClass : ''} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
                onClick={!disabled ? onClick : undefined}
            >
                {html && (
                    <div
                        className={className}
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                )}
                {MuiIcon && <MuiIcon className={className} />}
            </motion.div>
        );
    }

    if (!href) return;

    return (
        <Link
            className={`inline-block ${disabled ? 'pointer-events-none opacity-50' : ''} ${outerClass}`}
            href={href}
            {...externalProps}
        >
            <motion.div
                className={`${hoverClasses}`}
                variants={variants}
                whileHover="hover"
            >
                {html && (
                    <div
                        className={className}
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                )}
                {MuiIcon && <MuiIcon className={className} />}
            </motion.div>
        </Link>
    );
};

export default IconLink;

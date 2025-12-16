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
    inverted = false,
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
    const baseBg = inverted ? 'var(--icon-bg)' : 'var(--icon-bg)';
    const baseFg = inverted ? 'var(--icon-fg)' : 'var(--icon-fg)';
    const hoverBg = inverted ? 'var(--icon-fg)' : 'var(--icon-bg-hover)';
    const hoverFg = inverted ? 'var(--icon-bg)' : 'var(--icon-fg-hover)';

    const baseClasses = `
        inline-flex
        items-center
        justify-center
        relative
        overflow-hidden
        after:content-[""]
        after:block
        after:w-full
        after:h-full
        after:absolute 
        after:top-0
        after:-left-full
        after:z-0
        [&_svg]:relative
        [&_svg]:z-10
        user-select-none
        transition-colors
    `;

    const externalProps = !internal && {
        target: '_blank',
        rel: 'noopener noreferrer',
    };

    const hoverStyle = {
        backgroundColor: hoverBg,
        color: hoverFg,
        borderColor: 'var(--icon-border-hover)',
    };

    const hoverTransition = {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as const,
    };

    if (onClick) {
        return (
            <motion.div
                whileHover={hoverStyle}
                transition={hoverTransition}
                className={`cursor-pointer ${baseClasses} ${outerClass ? outerClass : ''} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
                style={{
                    backgroundColor: baseBg,
                    color: baseFg,
                    borderColor: 'var(--icon-border)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: 'var(--icon-radius)',
                    padding: 'var(--icon-padding)',
                }}
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
            className={`inline-block ${disabled ? 'pointer-events-none opacity-50' : ''} ${outerClass} rounded-full`}
            href={href}
            {...externalProps}
        >
            <motion.div
                className={`${baseClasses}`}
                whileHover={hoverStyle}
                transition={hoverTransition}
                style={{
                    backgroundColor: baseBg,
                    color: baseFg,
                    borderColor: 'var(--icon-border)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: 'var(--icon-radius)',
                    padding: 'var(--icon-padding)',
                }}
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

import Link from 'next/link';
import React from 'react';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

const IconLink = ({
    MuiIcon,
    href,
    html,
    classNames,
    outerClasses,
    onClick,
    internal,
    inverted,
    disabled,
}: {
    MuiIcon?: OverridableComponent<SvgIconTypeMap> & { muiName: string };
    href?: string;
    html?: string;
    classNames?: string;
    onClick?: () => Promise<void> | void;
    outerClasses?: string;
    internal?: boolean;
    inverted?: boolean;
    disabled?: boolean;
}) => {
    const hoverClasses = `
        ${
            inverted
                ? '[&_svg]:fill-background [&_svg]:hover:fill-foreground after:bg-foreground after:scale-10 hover:after:scale-0 hover:border-foreground border border-transparent '
                : '[&_svg]:fill-foreground [&_svg]:hover:fill-background  hover:after:scale-100 after:bg-foreground after:scale-0'
        }
        [&_svg]:relative
        [&_svg]:z-10
        user-select-none
        p-2
        inline-block
        relative
        after:transition-all
        after:content-[""]
        after:block
        after:w-full
        after:h-full
        after:absolute 
        after:top-0
        after:rounded-lg
        after:left-0
        rounded-lg
        after:z-0
        `;

    const externalProps = !internal && {
        target: '_blank',
        rel: 'noopener noreferrer',
    };

    if (onClick) {
        return (
            <div
                className={`cursor-pointer ${hoverClasses} ${outerClasses ? outerClasses : ''} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
                onClick={!disabled ? onClick : undefined}
            >
                {html && (
                    <div
                        className={classNames}
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                )}
                {MuiIcon && <MuiIcon className={classNames} />}
            </div>
        );
    }

    if (!href) return;

    return (
        <Link
            className={`inline-block ${disabled ? 'pointer-events-none opacity-50' : ''}`}
            href={href}
            {...externalProps}
        >
            <div className={`${hoverClasses} ${outerClasses}`}>
                {html && (
                    <div
                        className={classNames}
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                )}
                {MuiIcon && <MuiIcon className={classNames} />}
            </div>
        </Link>
    );
};

export default IconLink;

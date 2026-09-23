import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
};

export const ArrowUpRight = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M7 17 17 7M8 7h9v9" />
    </svg>
);

export const Download = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
    </svg>
);

export const Mail = (props: IconProps) => (
    <svg {...base} {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
);

export const Phone = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2L21 14.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
    </svg>
);

export const Shuffle = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M3 7h3.5a4 4 0 0 1 3.3 1.8l4.4 6.4A4 4 0 0 0 17.5 17H21M3 17h3.5a4 4 0 0 0 3.3-1.8l.7-1M14 9l.9-1.2A4 4 0 0 1 18.2 6H21" />
        <path d="m18.5 3.5 2.5 2.5-2.5 2.5M18.5 14.5 21 17l-2.5 2.5" />
    </svg>
);

export const Refresh = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M20 11a8 8 0 1 0-.6 4" />
        <path d="M20.5 4v5h-5" />
    </svg>
);

export const Sliders = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
    </svg>
);

export const Restore = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M4 9a8 8 0 1 1-.5 5" />
        <path d="M3.5 4v5h5" />
    </svg>
);

export const Close = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M6 6l12 12M18 6 6 18" />
    </svg>
);

export const Lock = (props: IconProps) => (
    <svg {...base} {...props}>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
);

export const Github = (props: IconProps) => (
    <svg {...base} {...props} strokeWidth={0} fill="currentColor">
        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.22-3.37-1.22-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5.01 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
);

export const LinkedIn = (props: IconProps) => (
    <svg {...base} {...props} strokeWidth={0} fill="currentColor">
        <path d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM21 14.13c0-3.5-1.87-5.13-4.36-5.13-2.01 0-2.91 1.11-3.41 1.88V8.5H9.85c.04.95 0 12.5 0 12.5h3.38v-6.98c0-.3.02-.6.11-.82.24-.6.79-1.23 1.72-1.23 1.21 0 1.7.93 1.7 2.28V21H21v-6.87Z" />
    </svg>
);

export const Sun = (props: IconProps) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
);

export const Moon = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
);

export const Monitor = (props: IconProps) => (
    <svg {...base} {...props}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
    </svg>
);

export const ArrowUp = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </svg>
);

export const ChevronLeft = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="m15 18-6-6 6-6" />
    </svg>
);

export const ChevronRight = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export const Home = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10v9h11v-9" />
    </svg>
);

export const Grid = (props: IconProps) => (
    <svg {...base} {...props}>
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
);

export const Briefcase = (props: IconProps) => (
    <svg {...base} {...props}>
        <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" />
    </svg>
);

export const Layers = (props: IconProps) => (
    <svg {...base} {...props}>
        <path d="m12 4 8.5 4.5L12 13 3.5 8.5z" />
        <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </svg>
);

export const User = (props: IconProps) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="8.5" r="4" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
);

export const Lens = (props: IconProps) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12a4 4 0 0 1 4-4" />
    </svg>
);

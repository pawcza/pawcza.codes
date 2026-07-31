export interface Role {
    company: string;
    title: string;
    location: string;
    from: string;
    to: string;
    stack: string[];
}

export const experience: Role[] = [
    {
        company: 'A5 Labs',
        title: 'Senior Front-end Developer',
        location: 'United States, remote',
        from: 'Aug 2025',
        to: 'Present',
        stack: [
            'Vue.js',
            'TypeScript',
            'Web Components',
            'Lit',
            'Vite',
            'Pinia',
            'Tailwind CSS',
            'Radix Vue',
            'Node.js',
        ],
    },
    {
        company: 'Cloud Nine AB',
        title: 'Senior Front-end Developer',
        location: 'Stockholm, remote',
        from: 'Sep 2021',
        to: 'Jul 2025',
        stack: [
            'Next.js',
            'Remix',
            'React',
            'TypeScript',
            'styled-components',
            'Tailwind CSS',
        ],
    },
    {
        company: 'Genesis Global Ltd',
        title: 'Front-end Developer',
        location: 'Malta / Gdańsk, hybrid',
        from: 'Mar 2019',
        to: 'Aug 2021',
        stack: ['React', 'Redux', 'Next.js', 'SASS', 'HTML5'],
    },
    {
        company: 'Spectrum Brands UK Ltd',
        title: 'Front-end Developer + Designer',
        location: 'Manchester, UK',
        from: 'Oct 2017',
        to: 'Feb 2019',
        stack: [
            'Vue.js',
            'SASS',
            'ES6',
            'Bootstrap',
            'jQuery',
            'Laravel',
            'Velocity.js',
        ],
    },
    {
        company: 'Cocogreen UK Ltd',
        title: 'Web Developer + Designer',
        location: 'Manchester, UK',
        from: 'Jun 2016',
        to: 'Sep 2017',
        stack: ['HTML5', 'SASS', 'Bootstrap', 'jQuery', 'Velocity.js', 'jsPDF'],
    },
];

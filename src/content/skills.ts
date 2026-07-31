export interface SkillGroup {
    label: string;
    items: string[];
}

/** Kept in step with the CV, in the same order. */
export const skills: SkillGroup[] = [
    {
        label: 'Front-end',
        items: [
            'TypeScript',
            'React',
            'Next.js',
            'Remix',
            'Vue.js',
            'React Router',
            'JavaScript ES6+',
            'Web Components',
            'Lit',
            'Pinia',
            'Vite',
            'Radix Vue',
            'Three.js',
            'Tailwind CSS',
            'styled-components',
            'Sass',
            'CSS3',
            'HTML5',
            'Framer Motion',
            'jsPDF',
        ],
    },
    {
        label: 'Back-end',
        items: [
            'Node.js',
            'WebSockets',
            'PHP',
            'Razor (CSHTML)',
            'REST APIs',
            'CLI environments',
        ],
    },
    {
        label: 'Tools & DevOps',
        items: [
            'Git',
            'GitHub',
            'Bitbucket',
            'Jira',
            'ClickUp',
            'Vercel',
            'Netlify',
            'Heroku',
            'Docker',
            'Self-hosted environments',
        ],
    },
    {
        label: 'CMS',
        items: ['Storyblok', 'Contentful', 'WordPress', 'Sanity', 'Strapi'],
    },
    {
        label: 'Design & UX',
        items: ['Photoshop', 'Illustrator', 'Figma', 'Sketch'],
    },
];

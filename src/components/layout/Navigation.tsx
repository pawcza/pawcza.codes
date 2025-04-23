'use client';

import { Link } from 'next-view-transitions';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import MatrixText from '@/components/common/MatrixText';
import { useState } from 'react';

interface MenuItem {
    name: string;
    full_slug: string;
    slug: string;
    uuid: string;
}

const Navigation = ({ items }: { items: MenuItem[] }) => {
    const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 z-40 left-1/2 -translate-x-1/2 flex justify-center fade-in">
            <motion.ul
                className="flex justify-center w-auto overflow-hidden mt-2  shadow-2xl text-lg"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                onAnimationComplete={() => setHasAnimationCompleted(true)}
                transition={{ delay: 0.1 }}
            >
                {items.map((item: MenuItem) => {
                    const isActive =
                        pathname.split('/')[pathname.split('/').length - 1] ===
                            item.slug ||
                        (pathname === '/' && item.slug === 'home');

                    if (isActive) {
                        return (
                            <li
                                className="px-4 py-2 bg-background font-bold border-l-foreground border-l first-of-type:border-l-0"
                                key={item.uuid}
                            >
                                <MatrixText hasStarted={hasAnimationCompleted}>
                                    {item.name}
                                </MatrixText>
                            </li>
                        );
                    }

                    return (
                        <li
                            className="bg-background hover:font-bold transition-colors hover:bg-foreground hover:text-background border-l-foreground border-l first-of-type:border-l-0"
                            key={item.uuid}
                        >
                            <Link
                                className="inline-block relative w-full h-full px-4 py-2"
                                href={
                                    item.slug === 'home'
                                        ? '/'
                                        : `../${item.slug}`
                                }
                            >
                                <MatrixText hasStarted={hasAnimationCompleted}>
                                    {item.name}
                                </MatrixText>
                            </Link>
                        </li>
                    );
                })}
            </motion.ul>
        </nav>
    );
};

export default Navigation;

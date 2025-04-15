'use client';

import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import MatrixText from '@/components/common/MatrixText';

interface MenuItem {
    name: string;
    full_slug: string;
    slug: string;
    uuid: string;
}

const Navigation = ({ items }: { items: MenuItem[] }) => {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 z-40 left-1/2 -translate-x-1/2 flex justify-center fade-in">
            <ul className="flex justify-center w-auto overflow-hidden rounded-lg mt-2 border border-foreground shadow-2xl text-lg">
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
                                <MatrixText>{item.name}</MatrixText>
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
                                <MatrixText>{item.name}</MatrixText>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Navigation;

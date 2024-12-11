'use client';

import Link from 'next/link';
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
        <nav className="fixed top-0 z-50 w-full">
            <ul className="flex justify-center">
                {items.map((item: MenuItem) => {
                    const isActive =
                        pathname.split('/')[pathname.split('/').length - 1] ===
                            item.slug ||
                        (pathname === '/' && item.slug === 'home');

                    if (isActive) {
                        return (
                            <li
                                className="mx-1 mt-2 p-2 bg-background font-bold rounded-md"
                                key={item.uuid}
                            >
                                <MatrixText>{item.name}</MatrixText>
                            </li>
                        );
                    }

                    return (
                        <li
                            className="mx-1 mt-2 bg-background hover:font-bold rounded-md transition-colors hover:bg-foreground hover:text-background"
                            key={item.uuid}
                        >
                            <Link
                                className="inline-block relative w-full h-full p-2"
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

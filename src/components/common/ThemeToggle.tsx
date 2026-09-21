'use client';

import { useEffect, useState } from 'react';

import { Monitor, Moon, Sun } from '@/components/common/Icons';
import {
    THEME_STORAGE_KEY,
    ThemePreference,
    readPreference,
    resolveTheme,
} from '@/components/common/theme';

const order: ThemePreference[] = ['system', 'light', 'dark'];

const labels: Record<ThemePreference, string> = {
    system: 'Theme: match system',
    light: 'Theme: light',
    dark: 'Theme: dark',
};

const icons = { system: Monitor, light: Sun, dark: Moon };

/** Keeps every toggle on the page (hero and nav) showing the same state. */
const EVENT = 'themechange';

const apply = (preference: ThemePreference) => {
    const theme = resolveTheme(preference);
    document.documentElement.dataset.theme = theme;
    // The browser chrome colour follows the page, not the OS, once overridden.
    const paper = getComputedStyle(document.documentElement)
        .getPropertyValue('--paper')
        .trim();
    document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute('content', paper));
};

/**
 * Cycles system → light → dark. The choice is remembered; "system" forgets it
 * and follows the OS again, live, if the OS setting changes.
 */
const ThemeToggle = ({ className = '' }: { className?: string }) => {
    const [preference, setPreference] = useState<ThemePreference>('system');

    useEffect(() => {
        setPreference(readPreference());

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onSystemChange = () => {
            if (readPreference() === 'system') apply('system');
        };
        const onToggle = () => setPreference(readPreference());

        media.addEventListener('change', onSystemChange);
        window.addEventListener(EVENT, onToggle);
        return () => {
            media.removeEventListener('change', onSystemChange);
            window.removeEventListener(EVENT, onToggle);
        };
    }, []);

    const cycle = () => {
        const next = order[(order.indexOf(preference) + 1) % order.length];
        try {
            if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
            else localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // Private mode: the switch still works for this visit.
        }
        apply(next);
        setPreference(next);
        window.dispatchEvent(new Event(EVENT));
    };

    const Icon = icons[preference];

    return (
        <button
            type="button"
            onClick={cycle}
            title={labels[preference]}
            aria-label={`${labels[preference]}. Click to change.`}
            className={className}
        >
            <Icon width={15} height={15} />
        </button>
    );
};

export default ThemeToggle;

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/**
 * Runs inline in <head>, before first paint, so a saved dark choice never
 * flashes light (or the reverse). Kept as a string because it must not wait
 * for the bundle. Mirrors `resolveTheme` below.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`;

export const readPreference = (): ThemePreference => {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
        return 'system';
    }
};

export const resolveTheme = (preference: ThemePreference): 'light' | 'dark' =>
    preference === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        : preference;

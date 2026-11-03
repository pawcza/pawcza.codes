'use client';

import { useEffect } from 'react';

/**
 * Says the page is live: until `data-hydrated` appears, CSS brings hidden
 * content in by itself, so a page whose JS is slow or broken never sits blank.
 */
const RenderMode = () => {
    useEffect(() => {
        document.documentElement.dataset.hydrated = '';
    }, []);

    return null;
};

export default RenderMode;

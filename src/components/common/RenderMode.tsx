'use client';

import { useEffect } from 'react';

import { isSoftwareRendered } from '@/components/common/gpu';

/**
 * Marks the page when the browser has no GPU to draw with, so CSS can drop
 * what only a GPU makes cheap: the drifting ambient field, and the backdrop
 * blur on every glass surface, which would otherwise be recomputed on the CPU
 * each frame the colours behind it move or the page scrolls.
 */
const RenderMode = () => {
    useEffect(() => {
        if (isSoftwareRendered()) {
            document.documentElement.dataset.render = 'software';
        }
    }, []);

    return null;
};

export default RenderMode;

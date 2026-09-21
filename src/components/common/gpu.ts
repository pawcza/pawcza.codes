let softwareRendered: boolean | undefined;

/**
 * Whether the browser is drawing without the GPU (hardware acceleration off,
 * a blocklisted driver, a VM). A full-screen canvas redrawn every frame on the
 * CPU crawls and drags the whole page with it, so the field holds a still
 * frame instead, as it does for reduced motion. Detected by asking for a
 * WebGL context that must not come with a "major performance caveat" (how
 * browsers flag a software fallback) and by the renderer's name. Probed once
 * per page.
 */
export const isSoftwareRendered = () => {
    if (softwareRendered === undefined) {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl', {
            failIfMajorPerformanceCaveat: true,
        });
        // Some setups hand out a software context without the caveat flag,
        // so the renderer's own name is checked too.
        const info = gl?.getExtension('WEBGL_debug_renderer_info');
        const renderer = info
            ? String(gl?.getParameter(info.UNMASKED_RENDERER_WEBGL))
            : '';
        softwareRendered =
            !gl ||
            /swiftshader|llvmpipe|softpipe|software|basic render/i.test(
                renderer,
            );
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return softwareRendered;
};

/**
 * For when the probe could not tell but the frames can: Firefox with
 * hardware acceleration off hands out a software WebGL context with no
 * caveat flag and a masked renderer name. Called by the hero canvas once it
 * has measured itself running slowly.
 */
export const markSoftwareRendered = () => {
    softwareRendered = true;
    document.documentElement.dataset.render = 'software';
    window.dispatchEvent(new Event(SOFTWARE_EVENT));
};

/** Fired once the page falls back, so every canvas can stop, not just the one that measured. */
export const SOFTWARE_EVENT = 'software-render';

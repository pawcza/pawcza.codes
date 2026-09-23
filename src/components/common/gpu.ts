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

let refresh: number | undefined;
let measuring: Promise<void> | undefined;

/**
 * The display's own frame interval, measured over a few frames while nothing
 * heavy is animating (the hero holds still under the loader until this
 * resolves). A fixed "too slow" line cannot work across screens: 37fps is
 * fine on a 60Hz laptop and a disaster on a 165Hz monitor, which is how
 * Firefox with hardware acceleration off slipped past it. That setup still
 * hands out hardware WebGL, so the probe above sees a GPU, but it composites
 * the page in software and every animated frame costs the CPU a full redraw.
 */
export const whenRefreshMeasured = () =>
    (measuring ??= new Promise<void>((resolve) => {
        const gaps: number[] = [];
        let last = 0;
        const tick = (now: number) => {
            if (last) gaps.push(now - last);
            last = now;
            if (gaps.length < 20) {
                requestAnimationFrame(tick);
                return;
            }
            // A low percentile, not the median: hydration is running at the
            // same time and only ever makes gaps longer.
            refresh = gaps.sort((a, b) => a - b)[2];
            resolve();
        };
        requestAnimationFrame(tick);
    }));

export const refreshMeasured = () => refresh !== undefined;

/**
 * A median frame slower than this means the page is struggling: half as fast
 * again as the screen refreshes, and never stricter than 50fps, so a capable
 * machine dipping briefly is left alone. Safari's Low Power Mode caps rAF at
 * 30fps on fine hardware; that shows up in the measured interval itself.
 */
export const slowFrameMs = () => Math.max(20, (refresh ?? 1000 / 60) * 1.5);

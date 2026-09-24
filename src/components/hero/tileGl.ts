import { RAMP_LENGTH, WaveSettings } from '@/components/hero/tiles';

/**
 * The tile field drawn by the GPU: one full-screen triangle, and a fragment
 * shader that works out which tile every pixel belongs to and what colour
 * that tile is this frame.
 *
 * Canvas2D spent the GPU process's whole frame budget here, not the page's:
 * every fillRect and lens quad reached the GPU as its own draw operation, a
 * few thousand a frame on a large screen, and it sank to ~25fps on a 3060 Ti.
 * A shader pass costs the same whatever the tile size.
 *
 * TileCanvas keeps all the motion (easing, drift, palette fades); this only
 * turns one frame's numbers into pixels, matching the Canvas2D fallback.
 */

export interface TileFrame {
    /** CSS pixels. */
    width: number;
    height: number;
    columns: number;
    rows: number;
    tileWidth: number;
    tileHeight: number;
    settings: WaveSettings;
    phase: number;
    /** RAMP_LENGTH RGB triplets. */
    ramp: Uint8ClampedArray;
    /** True while `ramp` is a cross-fade being rewritten in place. */
    rampBlending: boolean;
    mode: 'plain' | 'lens' | 'grid';
    pointerX: number;
    pointerY: number;
    radiusX: number;
    radiusY: number;
    magnify: number;
    /** The build-in, like the covers'; null once it has played. */
    reveal: {
        /** Milliseconds since it began; negative for not yet (all paper). */
        time: number;
        /** Delay between one diagonal of tiles and the next. */
        step: number;
        /** 1 to sweep from the right / the bottom instead. */
        fromX: number;
        fromY: number;
        seed: number;
        /** What shows where no tile has landed yet: the page. */
        paper: [number, number, number];
    } | null;
    /** Grid mode. */
    ink: [number, number, number];
    gridAlpha: number;
    gridReach: number;
    gridLine: number;
    gridNudge: number;
    /** Seconds on the clock the grid's glints ride the wave by. */
    travel: number;
    /** How deep the wave is lit (the relief setting); 0 draws it flat. */
    shade: number;
}

export interface TileGl {
    resize: (width: number, height: number, dpr: number) => void;
    draw: (frame: TileFrame) => void;
    dispose: () => void;
}

const VERTEX = `
attribute vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/** Also drawn into a texture for the cube's faces (components/cube). */
export const FRAGMENT = `
precision highp float;

uniform float uDeviceHeight;
uniform float uDpr;
uniform vec2 uCells;
uniform vec2 uTile;
uniform vec4 uWave;
uniform vec2 uShape;
uniform sampler2D uRamp;
uniform float uSteps;
uniform int uMode;
uniform vec2 uPointer;
uniform vec2 uRadius;
uniform float uMagnify;
uniform vec3 uInk;
uniform float uGridAlpha;
uniform float uGridReach;
uniform float uGridLine;
uniform float uGridNudge;
uniform float uTravel;
uniform float uShade;
uniform int uRevealOn;
uniform float uRevealTime;
uniform float uRevealStep;
uniform vec2 uRevealFrom;
uniform float uRevealSeed;
uniform vec3 uPaper;

// The wave at a tile, 0–1: where along the palette it sits, and also how
// high the tile stands when it is lit as a block (see shade).
float waveAt(vec2 cell) {
    float value = sin(
        uWave.x * cell.y +
        uWave.y * cell.x +
        uWave.z * sin(uWave.w * cell.x) -
        uShape.y
    );
    return clamp(0.5 + ((value + 1.0) * 0.5 - 0.5) * uShape.x, 0.0, 1.0);
}

// Same wave as colorIndexAt in tiles.ts.
vec3 colorAt(vec2 cell) {
    float index = floor(waveAt(cell) * (uSteps - 1.0) + 0.5);
    return texture2D(uRamp, vec2((index + 0.5) / uSteps, 0.5)).rgb;
}

vec2 clampCell(vec2 cell) {
    return clamp(cell, vec2(0.0), uCells - 1.0);
}

// The Canvas2D grid snaps each tile's top-left to a whole CSS pixel and lets
// later tiles overlap earlier ones, so a pixel belongs to the last tile whose
// snapped edge is at or before it.
vec2 plainCell(vec2 css) {
    vec2 whole = floor(css);
    return clampCell(ceil((whole + 1.0) / uTile) - 1.0);
}

// The lens pushes grid points out from the cursor along the cubic in
// TileCanvas's lensCurve. Drawing needs the reverse: for a point on screen,
// where on the flat grid it came from. The curve is monotonic, so a few
// Newton steps converge.
vec2 lensSource(vec2 css) {
    vec2 n = (css - uPointer) / uRadius;
    float spread = length(n);
    if (spread >= 1.0) return css;
    if (spread < 1e-6) return uPointer;
    float a = uMagnify - 1.0;
    float u = spread;
    for (int i = 0; i < 8; i++) {
        float g = ((a * u - 2.0 * a) * u + uMagnify) * u - spread;
        float slope = (3.0 * a * u - 4.0 * a) * u + uMagnify;
        u = clamp(u - g / slope, 0.0, 1.0);
    }
    return uPointer + n * (u / spread) * uRadius;
}

// Defined further down, with the relief.
vec3 blockAt(vec2 p);

vec3 lensColor(vec2 css) {
    vec2 source = lensSource(css);
    return uShade > 0.0 ? blockAt(source) : colorAt(clampCell(floor(source / uTile)));
}

// The covers' build-in, per tile: a diagonal sweep plus jitter decides when
// each one starts, then it pops from a fifth of its size with a slight
// overshoot (TileReveal's backOut) while fading up over its first 40%.
float revealHash(vec2 cell) {
    return fract(sin(dot(cell, vec2(12.9898, 78.233)) + uRevealSeed) * 43758.5453);
}

float popIn(float t) {
    float u = t - 1.0;
    return 1.0 + 2.56 * u * u * u + 1.56 * u * u;
}

// How much of tile cell covers this point: nothing before it has started.
float revealCover(vec2 cell, vec2 css) {
    if (any(lessThan(cell, vec2(0.0))) || any(greaterThanEqual(cell, uCells))) {
        return 0.0;
    }
    vec2 k = mix(cell, uCells - 1.0 - cell, uRevealFrom);
    float t =
        (uRevealTime - (k.x + k.y) * uRevealStep - revealHash(cell) * 160.0) /
        420.0;
    if (t <= 0.0) return 0.0;
    float p = min(t, 1.0);
    float side = 0.2 + 0.8 * popIn(p);
    vec2 d = abs(css - (cell + 0.5) * uTile) / (uTile * 0.5);
    return max(d.x, d.y) <= side ? min(1.0, p / 0.4) : 0.0;
}

/*
 * Relief, as on the toy cube: every tile a block lifted off the page by the
 * wave (uShade is the relief setting), seen from a little below and to the
 * right, so a block's top shifts up and left by its height and its bottom
 * and right sides show beneath. For a pixel, each nearby block covers it
 * over some stretch of its height; the block that reaches highest there is
 * the one in front, and whether that highest point is on its top or one of
 * its sides decides the shade. Tops shift at most a tile or so, so only the
 * few tiles below and to the right of the pixel can reach it.
 */
const vec2 LIFT = vec2(-0.45, -0.6);

// What blockAt found, for the grid effect to trace the blocks: the point on
// the front block's own tile square, which face of it shows, and how far
// below its top edge the pixel is, in CSS pixels.
vec2 gOnTile;
float gFace;
float gBelowTop;

vec3 blockAt(vec2 p) {
    gOnTile = p;
    gFace = 0.0;
    gBelowTop = 0.0;
    if (uShade <= 0.0) return colorAt(plainCell(p));
    vec2 d = LIFT * uTile;
    float scale = uShade * 0.6;
    // Tiles a top can travel, rounded up: 2 × 2 at modest relief, 3 × 3 beyond.
    float reach = ceil(scale * max(abs(LIFT.x), abs(LIFT.y)));
    vec2 home = floor(p / uTile);
    vec2 front = clampCell(home);
    float best = -1.0;
    float bestHeight = 0.0;
    float face = 0.0; // 0 top, 1 bottom side, 2 right side
    for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 3; i++) {
            if (float(i) > reach || float(j) > reach) continue;
            vec2 cell = home + vec2(float(i), float(j));
            if (cell.x >= uCells.x || cell.y >= uCells.y) continue;
            float h = (0.08 + 0.92 * waveAt(cell)) * scale;
            vec2 lo = cell * uTile;
            vec2 hi = lo + uTile;
            // Heights t at which p - t·d lies inside the tile, per axis.
            vec2 a = (p - lo) / d;
            vec2 b = (p - hi) / d;
            vec2 enter = min(a, b);
            vec2 leave = max(a, b);
            float from = max(0.0, max(enter.x, enter.y));
            float to = min(h, min(leave.x, leave.y));
            if (to < from || to <= best) continue;
            best = to;
            bestHeight = h;
            front = cell;
            // Reaching its full height means its top; otherwise the side
            // it leaves by: the right one along x, the bottom one along y.
            face = to >= h - 1e-4 ? 0.0 : leave.x < leave.y ? 2.0 : 1.0;
        }
    }
    gOnTile = p - best * d;
    gFace = face;
    gBelowTop = (bestHeight - best) * length(d);
    // A side darkens with depth below its top edge, so a hairline step
    // between two near-equal blocks shows as nothing (it shimmered as the
    // wave moved), while a real step still reads as a side in shade.
    float side = face == 2.0 ? 0.8 : 0.66;
    float light = face == 0.0 ? 1.0 : mix(1.0, side, smoothstep(0.0, 4.0, gBelowTop));
    return colorAt(front) * light;
}

// A soft pool of light where the lens (or the cursor) is.
vec3 pool(vec3 color, vec2 css) {
    vec2 p = (css - uPointer) / (max(uRadius.x, uRadius.y) * 1.6);
    return clamp(color * (1.0 + exp(-dot(p, p)) * 0.06), 0.0, 1.0);
}

// Grid mode's glints: bands of grid sweeping across the field, left to
// right and top to bottom, showing only where the wave runs dark, so they
// thread through the troughs and drift with them. 0–1.
float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}
float rideAt(vec2 css) {
    vec2 cell = css / uTile;
    // Dark for this palette, whichever end of it is the dark one.
    float a = luma(texture2D(uRamp, vec2(0.5 / uSteps, 0.5)).rgb);
    float b = luma(texture2D(uRamp, vec2(1.0 - 0.5 / uSteps, 0.5)).rgb);
    float here = (luma(colorAt(floor(cell))) - min(a, b)) / max(abs(a - b), 0.001);
    float dark = 1.0 - smoothstep(0.3, 0.55, here);
    if (dark <= 0.0) return 0.0;
    // Two families of bands, one travelling across, one down.
    float across = mod(cell.x - uTravel * 5.0, 22.0) - 11.0;
    float down = mod(cell.y - uTravel * 3.5 + 7.0, 16.0) - 8.0;
    float sweep = max(exp(-across * across / 4.0), exp(-down * down / 3.0));
    return dark * sweep;
}

// Fraction of this pixel covered by the nearest grid line along one axis.
float lineCover(float at, float spacing, float pixel) {
    float k = floor(at / spacing + 0.5);
    float cover = 0.0;
    for (int j = -1; j <= 1; j++) {
        float centre = floor((k + float(j)) * spacing + 0.5) + uGridNudge;
        float lo = max(at - pixel * 0.5, centre - uGridLine * 0.5);
        float hi = min(at + pixel * 0.5, centre + uGridLine * 0.5);
        cover = max(cover, clamp((hi - lo) / pixel, 0.0, 1.0));
    }
    return cover;
}

void main() {
    vec2 css = vec2(gl_FragCoord.x, uDeviceHeight - gl_FragCoord.y) / uDpr;
    vec3 color = blockAt(css);

    if (uMode == 1) {
        vec2 n = (css - uPointer) / uRadius;
        // Only inside the lens; a pixel's margin keeps the rim antialiased.
        if (dot(n, n) < 1.05) {
            // Warped edges are curves, so average four samples to smooth them.
            float q = 0.25 / uDpr;
            color =
                (lensColor(css + vec2(-q, -q)) +
                    lensColor(css + vec2(q, -q)) +
                    lensColor(css + vec2(-q, q)) +
                    lensColor(css + vec2(q, q))) *
                0.25;
        }
    } else if (uMode == 2) {
        // Radial fade matching the Canvas2D gradient stops: full, 45% at
        // 0.55 of the reach, gone at the edge.
        float t = length(css - uPointer) / uGridReach;
        float alpha =
            t < 0.55
                ? mix(uGridAlpha, uGridAlpha * 0.45, t / 0.55)
                : mix(uGridAlpha * 0.45, 0.0, clamp((t - 0.55) / 0.45, 0.0, 1.0));
        alpha = max(alpha, uGridAlpha * 0.9 * rideAt(css));
        float pixel = 1.0 / uDpr;
        // Traced on the blocks as they stand: the edges of each top where
        // it shows, and where a side meets the top above it.
        float cover;
        if (gFace == 0.0) {
            float coverX = lineCover(gOnTile.x, uTile.x, pixel);
            float coverY = lineCover(gOnTile.y, uTile.y, pixel);
            cover = coverX + coverY - coverX * coverY;
        } else {
            cover = 1.0 - smoothstep(0.0, max(uGridLine, pixel), gBelowTop);
        }
        color = mix(color, uInk, cover * alpha);
    }

    color = pool(color, css);

    if (uRevealOn == 1) {
        vec2 cell = floor(css / uTile);
        vec2 side = sign(css - (cell + 0.5) * uTile);
        vec2 nx = cell + vec2(side.x, 0.0);
        vec2 ny = cell + vec2(0.0, side.y);
        vec2 nd = cell + side;
        // Neighbours under this tile: one overshooting as it pops spills in.
        vec3 built = uPaper;
        built = mix(built, colorAt(clampCell(nd)), revealCover(nd, css));
        built = mix(built, colorAt(clampCell(nx)), revealCover(nx, css));
        built = mix(built, colorAt(clampCell(ny)), revealCover(ny, css));
        color = mix(built, color, revealCover(cell, css));
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

export const UNIFORMS = [
    'uDeviceHeight',
    'uDpr',
    'uCells',
    'uTile',
    'uWave',
    'uShape',
    'uRamp',
    'uSteps',
    'uMode',
    'uPointer',
    'uRadius',
    'uMagnify',
    'uInk',
    'uGridAlpha',
    'uGridReach',
    'uGridLine',
    'uGridNudge',
    'uTravel',
    'uShade',
    'uRevealOn',
    'uRevealTime',
    'uRevealStep',
    'uRevealFrom',
    'uRevealSeed',
    'uPaper',
] as const;

type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

/**
 * Null when WebGL is unavailable or the shader will not build, in which case
 * the caller draws with Canvas2D instead. Once a canvas has a WebGL context it
 * can never have a 2D one, so this is decided before anything is drawn.
 */
export const createTileGl = (
    canvas: HTMLCanvasElement,
    onRestored: () => void,
): TileGl | null => {
    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
    });
    if (!gl) return null;

    let uniforms: Uniforms | null = null;
    let uploaded: Uint8ClampedArray | null = null;
    let deviceHeight = 0;
    let dpr = 1;

    /** Builds everything the context owns. Runs again after a context loss. */
    const init = () => {
        const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
        const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
        const program = gl.createProgram();
        if (!vertex || !fragment || !program) return false;
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return false;
        }
        gl.useProgram(program);

        // One triangle that covers the whole viewport.
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW,
        );
        const position = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        uniforms = Object.fromEntries(
            UNIFORMS.map((name) => [
                name,
                gl.getUniformLocation(program, name),
            ]),
        ) as Uniforms;

        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.uniform1i(uniforms.uRamp, 0);
        gl.uniform1f(uniforms.uSteps, RAMP_LENGTH);
        uploaded = null;
        return true;
    };

    if (!init()) return null;

    let lost = false;
    const onLost = (event: Event) => {
        // Asking to keep the canvas is what lets the browser restore it.
        event.preventDefault();
        lost = true;
    };
    const onRestore = () => {
        lost = false;
        if (init()) {
            gl.viewport(0, 0, canvas.width, canvas.height);
            onRestored();
        }
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestore);

    return {
        resize: (width, height, pixelRatio) => {
            dpr = pixelRatio;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            deviceHeight = canvas.height;
            gl.viewport(0, 0, canvas.width, canvas.height);
        },

        draw: (frame) => {
            if (lost || !uniforms) return;
            const u = uniforms;

            if (frame.ramp !== uploaded || frame.rampBlending) {
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB,
                    RAMP_LENGTH,
                    1,
                    0,
                    gl.RGB,
                    gl.UNSIGNED_BYTE,
                    new Uint8Array(
                        frame.ramp.buffer,
                        frame.ramp.byteOffset,
                        RAMP_LENGTH * 3,
                    ),
                );
                uploaded = frame.ramp;
            }

            const { settings } = frame;
            gl.uniform1f(u.uDeviceHeight, deviceHeight);
            gl.uniform1f(u.uDpr, dpr);
            gl.uniform2f(u.uCells, frame.columns, frame.rows);
            gl.uniform2f(u.uTile, frame.tileWidth, frame.tileHeight);
            gl.uniform4f(
                u.uWave,
                settings.frequency,
                settings.tilt,
                settings.amplitude,
                settings.secondaryFrequency,
            );
            gl.uniform2f(u.uShape, settings.contrast, frame.phase);
            gl.uniform1i(
                u.uMode,
                frame.mode === 'lens' ? 1 : frame.mode === 'grid' ? 2 : 0,
            );
            gl.uniform2f(u.uPointer, frame.pointerX, frame.pointerY);
            gl.uniform2f(u.uRadius, frame.radiusX, frame.radiusY);
            gl.uniform1f(u.uMagnify, frame.magnify);
            gl.uniform3f(
                u.uInk,
                frame.ink[0] / 255,
                frame.ink[1] / 255,
                frame.ink[2] / 255,
            );
            gl.uniform1f(u.uGridAlpha, frame.gridAlpha);
            gl.uniform1f(u.uGridReach, frame.gridReach);
            gl.uniform1f(u.uGridLine, frame.gridLine);
            gl.uniform1f(u.uGridNudge, frame.gridNudge);
            gl.uniform1f(u.uTravel, frame.travel);
            gl.uniform1f(u.uShade, frame.shade);
            const { reveal } = frame;
            gl.uniform1i(u.uRevealOn, reveal ? 1 : 0);
            if (reveal) {
                gl.uniform1f(u.uRevealTime, reveal.time);
                gl.uniform1f(u.uRevealStep, reveal.step);
                gl.uniform2f(u.uRevealFrom, reveal.fromX, reveal.fromY);
                gl.uniform1f(u.uRevealSeed, reveal.seed);
                gl.uniform3f(
                    u.uPaper,
                    reveal.paper[0] / 255,
                    reveal.paper[1] / 255,
                    reveal.paper[2] / 255,
                );
            }

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        },

        dispose: () => {
            canvas.removeEventListener('webglcontextlost', onLost);
            canvas.removeEventListener('webglcontextrestored', onRestore);
        },
    };
};

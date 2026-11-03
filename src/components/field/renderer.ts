import { RAMP_LENGTH, WaveSettings } from '@/components/hero/tiles';
import type { CubeSettings } from '@/components/hero/TileSettings';
import { Mat4, invert, multiply } from '@/components/field/math';

/**
 * Everything on the page that moves in 3D, drawn as real geometry: instanced
 * boxes in one small pipeline.
 *
 * It used to be a fragment shader working out, for each pixel of each frame,
 * which tile it belonged to and how high that tile stood, with the cube as a
 * separate three.js scene on its own transparent canvas. Boxes do the same job
 * with a cheap vertex shader and a trivial fragment one, so the cost follows
 * the number of tiles rather than the number of pixels, and the cube can share
 * the field's space: it casts a shadow on it, and the camera moves them both.
 */

const WAVE = `
uniform vec4 uWave;
uniform vec2 uShape;
float waveWith(vec2 cell, float phase) {
    float value = sin(
        uWave.x * cell.y +
        uWave.y * cell.x +
        uWave.z * sin(uWave.w * cell.x) -
        phase
    );
    return clamp(0.5 + ((value + 1.0) * 0.5 - 0.5) * uShape.x, 0.0, 1.0);
}
float waveAt(vec2 cell) {
    return waveWith(cell, uShape.y);
}
`;

/**
 * Edges smoothed in the shader rather than by multisampling, which without a
 * GPU cost a third of the frame rate. vFace runs -1 to 1 across a face, so
 * how far a pixel is from the face's edge, in pixels, says how much of it the
 * face covers. That is blended over what is already drawn, so the geometry
 * goes back to front: the field's rows far to near and each row from the
 * outside in, each box's front, then its other sides, then its top; the
 * cube's faces sorted, its core before its blocks. Only silhouette edges
 * are smoothed: one shared with another face would blend in whatever was
 * drawn behind the box, as a seam.
 */
const FACE = `
vec2 faceCoord(vec3 position, vec3 normal) {
    return abs(normal.z) > 0.5 ? position.xy
        : abs(normal.x) > 0.5 ? position.yz
        : position.xz;
}
`;
const COVERAGE = `
// edges: how far each of the face's left, right, bottom and top edges is
// smoothed, 0 to 1.
float coverage(vec2 face, vec4 edges) {
    vec2 step = max(fwidth(face), vec2(1e-5));
    vec4 inside = vec4(face.x + 1.0, 1.0 - face.x, face.y + 1.0, 1.0 - face.y)
        / step.xxyy;
    vec4 cover = mix(vec4(1.0), clamp(inside + 0.5, 0.0, 1.0), edges);
    return min(min(cover.x, cover.y), min(cover.z, cover.w));
}
`;

const FIELD_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
${WAVE}
${FACE}
uniform mat4 uViewProjection;
uniform sampler2D uRamp;
uniform vec2 uOrigin;
// Columns drawn, and how many of them are left of the camera.
uniform ivec2 uRow;
uniform float uCameraX;
uniform vec2 uResolution;
uniform float uHeight;
uniform float uTile;
uniform float uRelief;
uniform float uRise;
uniform vec2 uPointer;
uniform vec2 uRadius;
uniform float uMagnify;
uniform float uLift;
// On, time since it began, the wave's phase then, and how long the sweep runs.
uniform vec4 uReveal;
uniform float uRevealSeed;
uniform float uRevealFade;
uniform vec3 uGrid;
uniform float uTravel;

flat out vec3 vColor;
out vec3 vNormal;
out vec3 vWorld;
out vec2 vTop;
out float vDepth;
out float vGlow;
out vec2 vFace;
flat out vec4 vEdges;
out float vFade;

float hash(vec2 cell) {
    return fract(sin(dot(cell, vec2(12.9898, 78.233)) + uRevealSeed) * 43758.5453);
}

// Shared corners move together, so a warped grid never opens a gap.
vec2 warp(vec2 p) {
    vec2 n = (p - uPointer) / uRadius;
    float spread = length(n);
    if (spread >= 1.0 || spread < 1e-5) return p;
    float a = uMagnify - 1.0;
    float curve = ((a * spread - 2.0 * a) * spread + uMagnify) * spread;
    return uPointer + n * (curve / spread) * uRadius;
}

// The build-in, per tile, 0 to 1 (overshooting): the whole field fades up
// from the paper, flat, and only then do the tiles stand up, the wave's
// crests first (as they stood when it began, so no tile drops back once up)
// and on down into the troughs.
float standUp(vec2 cell) {
    if (uReveal.x < 0.5) return 1.0;
    float wait = (1.0 - waveWith(cell, uReveal.z)) * uReveal.w;
    float p = clamp((uReveal.y - uRevealFade - wait - hash(cell) * 160.0) / 600.0, 0.0, 1.0);
    float u = p - 1.0;
    return 1.0 + 2.56 * u * u * u + 1.56 * u * u;
}

vec2 centreOf(vec2 cell) {
    return vec2((cell.x + 0.5) * uTile, uHeight - (cell.y + 0.5) * uTile);
}

float nearPointer(vec2 centre) {
    vec2 n = (centre - uPointer) / uRadius;
    return exp(-dot(n, n) * 2.2);
}

float heightOf(vec2 cell) {
    float wave = waveAt(cell);
    float near = nearPointer(centreOf(cell));
    return max(0.0, ((0.08 + 0.92 * wave) * uRelief * uTile * uRise + near * uLift) * standUp(cell));
}

// How far, in device pixels, an edge at this point moves on screen between
// two heights, as a 0 to 1 share of the pixel and a half it takes to smooth.
float overlap(vec2 point, float high, float low) {
    if (high <= low) return 0.0;
    vec4 a = uViewProjection * vec4(point, high, 1.0);
    vec4 b = uViewProjection * vec4(point, low, 1.0);
    vec2 moved = (a.xy / a.w - b.xy / b.w) * uResolution * 0.5;
    return clamp((length(moved) - 0.5) / 1.5, 0.0, 1.0);
}

void main() {
    int row = gl_InstanceID / uRow.x;
    int k = gl_InstanceID - row * uRow.x;
    int column = k < uRow.y ? k : uRow.x - 1 - (k - uRow.y);
    vec2 aCell = vec2(float(column), float(row));
    vec2 cell = aCell + uOrigin;
    float wave = waveAt(cell);
    vColor = texture(uRamp, vec2(wave, 0.5)).rgb;

    vec2 centre = centreOf(cell);
    vFade = uReveal.x > 0.5 ? smoothstep(0.0, uRevealFade, uReveal.y) : 1.0;
    float height = heightOf(cell);
    vec2 flat2 = centre + aPosition.xy * uTile * 0.5;
    vec3 world = vec3(warp(flat2), aPosition.z > 0.0 ? height : 0.0);

    vNormal = aNormal;
    vWorld = world;
    vTop = aPosition.xy;
    vFace = faceCoord(aPosition, aNormal);
    // Only silhouettes are smoothed: edges with something drawn earlier
    // beyond them. That is the far edge of a top or a side (the rows behind),
    // and the outer edges of a top or front, where the side beyond is turned
    // away (the tile further out). Never an edge one face shares with
    // another: beyond it is the inside of the box. And only as far as this
    // tile stands above the one beyond: level with it, there is nothing
    // behind the edge but the background, which showed as a dark seam.
    float halfWidth = uTile * 0.5;
    // Measured as how far this tile's edge, being taller, overlaps the
    // neighbour's on screen: under a pixel or so (a small step, or near the
    // middle of the view, where perspective barely shifts it), the neighbour
    // does not reach under the edge and the background would show.
    vec3 above = vec3(
        overlap(centre + vec2(-halfWidth, 0.0), height, heightOf(cell - vec2(1.0, 0.0))),
        overlap(centre + vec2(halfWidth, 0.0), height, heightOf(cell + vec2(1.0, 0.0))),
        overlap(centre + vec2(0.0, halfWidth), height, heightOf(cell - vec2(0.0, 1.0)))
    );
    vec2 outer = vec2(
        centre.x - halfWidth < uCameraX ? above.x : 0.0,
        centre.x + halfWidth > uCameraX ? above.y : 0.0
    );
    vEdges = aNormal.z > 0.5 ? vec4(outer, 0.0, above.z)
        : abs(aNormal.x) > 0.5 ? vec4(0.0, above.z, 0.0, 0.0)
        : vec4(outer, 0.0, 0.0);
    vDepth = aNormal.z > 0.5 ? 0.0 : height - world.z;

    // Grid effect: a patch around the cursor, plus bands sweeping the troughs.
    float reach = length(centre - uPointer) / uGrid.x;
    float area = reach < 0.55 ? mix(1.0, 0.45, reach / 0.55)
        : mix(0.45, 0.0, clamp((reach - 0.55) / 0.45, 0.0, 1.0));
    float across = mod(cell.x - uTravel * 5.0, 22.0) - 11.0;
    float down = mod(cell.y - uTravel * 3.5 + 7.0, 16.0) - 8.0;
    float sweep = max(exp(-across * across / 4.0), exp(-down * down / 3.0));
    float dark = 1.0 - smoothstep(0.3, 0.55, wave);
    vGlow = uGrid.y * max(area, 0.9 * sweep * dark);

    gl_Position = uViewProjection * vec4(world, 1.0);
}
`;

const FIELD_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
${COVERAGE}
flat in vec3 vColor;
in vec3 vNormal;
in vec3 vWorld;
in vec2 vTop;
in float vDepth;
in float vGlow;
in vec2 vFace;
flat in vec4 vEdges;
in float vFade;
out vec4 outColor;
uniform sampler2D uScrim;
uniform vec2 uResolution;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uGrid;
uniform vec4 uShadow;
uniform vec2 uPointer;
uniform vec2 uRadius;

void main() {
    vec3 color = vColor;
    float top = step(0.5, vNormal.z);
    if (top < 0.5) {
        // Sides are in the shade, deeper the further below the top edge.
        float side = vNormal.x > 0.5 ? 0.8 : vNormal.x < -0.5 ? 0.94 : vNormal.y < -0.5 ? 0.66 : 0.9;
        color *= mix(1.0, side, smoothstep(0.0, 3.0, vDepth));
    } else if (uGrid.y > 0.0) {
        // How far in from the edge, in CSS pixels.
        vec2 inside = (1.0 - abs(vTop)) / (fwidth(vTop) * uGrid.z);
        vec2 lines = 1.0 - smoothstep(0.5, 1.5, inside);
        color = mix(color, uInk, max(lines.x, lines.y) * vGlow);
    }

    vec2 pool = (vWorld.xy - uPointer) / (max(uRadius.x, uRadius.y) * 1.6);
    color *= 1.0 + exp(-dot(pool, pool)) * 0.06;

    if (uShadow.z > 0.0) {
        vec2 d = (vWorld.xy - uShadow.xy) / uShadow.z;
        color *= 1.0 - uShadow.w * exp(-dot(d, d));
    }

    color = mix(uPaper, color, vFade);
    color = mix(color, uPaper, texture(uScrim, gl_FragCoord.xy / uResolution).r);
    float cover = coverage(vFace, vEdges);
    outColor = vec4(color * cover, cover);
}
`;

const CUBE_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aBlock;
${WAVE}
${FACE}
uniform mat4 uViewProjection;
uniform mat4 uModel;
uniform sampler2D uRamp;
uniform float uColumns;
uniform vec3 uShape3; // across, thick, relief
uniform float uCoreScale;
uniform int uPart;
// Per face: whether the faces beyond its left, right, bottom and top borders
// are turned away, which makes those borders the cube's outline.
uniform vec4 uOutline[6];

flat out vec3 vColor;
out vec3 vNormal;
out float vBelow;
out vec2 vFace;
flat out vec4 vEdges;
uniform float uFloor;

const vec3 RIGHT[6] = vec3[6](vec3(1, 0, 0), vec3(0, 0, -1), vec3(-1, 0, 0), vec3(0, 0, 1), vec3(1, 0, 0), vec3(1, 0, 0));
const vec3 UP[6] = vec3[6](vec3(0, 1, 0), vec3(0, 1, 0), vec3(0, 1, 0), vec3(0, 1, 0), vec3(0, 0, 1), vec3(0, 0, -1));
const vec3 OUTWARD[6] = vec3[6](vec3(0, 0, 1), vec3(1, 0, 0), vec3(0, 0, -1), vec3(-1, 0, 0), vec3(0, 1, 0), vec3(0, -1, 0));

void main() {
    vec3 local;
    vec3 normal;
    if (uPart == 1) {
        local = aPosition * uCoreScale;
        normal = aNormal;
        vColor = vec3(0.0);
        vFace = vec2(0.0);
        vEdges = vec4(0.0);
    } else {
        int face = int(aBlock.z);
        vec3 right = RIGHT[face];
        vec3 up = UP[face];
        vec3 outward = OUTWARD[face];
        // Two faces' frames are mirrored (right × up points inwards), which
        // turns a block inside out: culling then drops its outer faces. The
        // box is symmetric, so flipping it through its own depth undoes that.
        vec3 p = aPosition;
        vec3 m = aNormal;
        if (dot(cross(right, up), outward) < 0.0) {
            p.z = -p.z;
            m.z = -m.z;
        }
        vFace = faceCoord(p, m);
        // Only the cube's outline is smoothed: the outer edges of the blocks
        // around a face's border, where the face beyond is turned away.
        float last = uColumns - 1.0;
        vEdges = m.z > 0.5 ? uOutline[face] * vec4(
            aBlock.x < 0.5 ? 1.0 : 0.0,
            aBlock.x > last - 0.5 ? 1.0 : 0.0,
            aBlock.y > last - 0.5 ? 1.0 : 0.0,
            aBlock.y < 0.5 ? 1.0 : 0.0
        ) : vec4(0.0);
        float size = 1.0 / uColumns;
        float across = size * uShape3.x;
        float thick = size * uShape3.y;
        float wave = waveAt(aBlock.xy);
        vColor = texture(uRamp, vec2(wave, 0.5)).rgb;
        float lift = 0.006 + (0.08 + 0.92 * wave) * uShape3.z * 0.16;
        float along = 0.5 + lift - thick / 2.0;
        vec2 at = vec2(-0.5 + (aBlock.x + 0.5) * size, 0.5 - (aBlock.y + 0.5) * size);
        local = right * (p.x * across * 0.5 + at.x)
            + up * (p.y * across * 0.5 + at.y)
            + outward * (p.z * thick * 0.5 + along);
        normal = right * m.x + up * m.y + outward * m.z;
    }
    vec4 world = uModel * vec4(local, 1.0);
    vNormal = normalize(mat3(uModel) * normal);
    vBelow = uFloor - world.z;
    gl_Position = uViewProjection * world;
}
`;

const CUBE_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
${COVERAGE}
flat in vec3 vColor;
in vec3 vNormal;
in float vBelow;
in vec2 vFace;
flat in vec4 vEdges;
out vec4 outColor;
uniform vec3 uTintA;
uniform vec3 uTintB;
uniform vec3 uCoreColor;
uniform float uGain;
uniform float uReflection;
uniform int uPart;

void main() {
    vec3 n = normalize(vNormal);
    vec3 albedo = uPart == 1 ? uCoreColor : vColor * uGain;
    float key = max(dot(n, normalize(vec3(-0.45, 0.35, 0.82))), 0.0);
    float fill = max(dot(n, normalize(vec3(0.6, -0.5, 0.45))), 0.0);
    float sky = 0.5 + 0.5 * n.z;
    vec3 light = vec3(0.4 + 0.22 * sky) + uTintA * key * 0.62 + uTintB * fill * 0.24;
    vec3 color = albedo * light;
    // A little gloss on what faces the key light.
    color += uTintA * pow(key, 24.0) * 0.1;
    float alpha = uPart == 1 ? 1.0 : coverage(vFace, vEdges);
    if (uReflection > 0.0) alpha *= uReflection * (1.0 - smoothstep(0.0, 1.3, vBelow));
    outColor = vec4(color * alpha, alpha);
}
`;

/** Each cube face's frame, in the order its blocks are stored; as in CUBE_VERTEX. */
const OUTWARD = [
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, -1],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
];
const RIGHT = [
    [1, 0, 0],
    [0, 0, -1],
    [-1, 0, 0],
    [0, 0, 1],
    [1, 0, 0],
    [1, 0, 0],
];
const UP = [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0, 0, -1],
];

/** The front, the other sides, the top, the bottom: the order they are drawn in. */
const FACES: [number, number, number, number[][]][] = [
    [
        0,
        -1,
        0,
        [
            [-1, -1, -1],
            [1, -1, -1],
            [1, -1, 1],
            [-1, -1, 1],
        ],
    ],
    [
        1,
        0,
        0,
        [
            [1, -1, -1],
            [1, 1, -1],
            [1, 1, 1],
            [1, -1, 1],
        ],
    ],
    [
        -1,
        0,
        0,
        [
            [-1, 1, -1],
            [-1, -1, -1],
            [-1, -1, 1],
            [-1, 1, 1],
        ],
    ],
    [
        0,
        1,
        0,
        [
            [1, 1, -1],
            [-1, 1, -1],
            [-1, 1, 1],
            [1, 1, 1],
        ],
    ],
    [
        0,
        0,
        1,
        [
            [-1, -1, 1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1],
        ],
    ],
    [
        0,
        0,
        -1,
        [
            [-1, 1, -1],
            [1, 1, -1],
            [1, -1, -1],
            [-1, -1, -1],
        ],
    ],
];

/** Interleaved positions and normals, with indices, for a closed mesh. */
interface Mesh {
    vertices: Float32Array;
    indices: Uint16Array;
}

const boxMesh = (): Mesh => {
    const vertices: number[] = [];
    const indices: number[] = [];
    FACES.forEach(([x, y, z, corners], face) => {
        corners.forEach((p) => vertices.push(...p, x, y, z));
        const at = face * 4;
        indices.push(at, at + 1, at + 2, at, at + 2, at + 3);
    });
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices),
    };
};

const sphereMesh = (rings = 18, segments = 28): Mesh => {
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= rings; i++) {
        const theta = (i / rings) * Math.PI;
        for (let j = 0; j <= segments; j++) {
            const phi = (j / segments) * Math.PI * 2;
            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.sin(theta) * Math.sin(phi);
            const z = Math.cos(theta);
            vertices.push(x, y, z, x, y, z);
        }
    }
    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segments; j++) {
            const a = i * (segments + 1) + j;
            const b = a + segments + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices),
    };
};

const diamondMesh = (): Mesh => {
    const tips = [
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
    ];
    const vertices: number[] = [];
    [1, -1].forEach((z) => {
        tips.forEach((a, i) => {
            const b = tips[(i + 1) % 4];
            const face = z > 0 ? [a, b, [0, 0, 1]] : [b, a, [0, 0, -1]];
            const n = [a[0] + b[0], a[1] + b[1], z].map(
                (c) => c / Math.sqrt(3),
            );
            face.forEach((p) => vertices.push(...p, ...n));
        });
    });
    const indices = Array.from({ length: vertices.length / 6 }, (_, i) => i);
    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices),
    };
};

export interface FieldFrame {
    origin: [number, number];
    cells: [number, number];
    pageHeight: number;
    tile: number;
    wave: WaveSettings;
    phase: number;
    rise: number;
    pointer: [number, number];
    radius: [number, number];
    magnify: number;
    lift: number;
    /** Reach, strength and pixel ratio; a strength of 0 turns the grid off. */
    grid: [number, number, number];
    travel: number;
    reveal: {
        time: number;
        /** The wave's phase when it began. */
        phase: number;
        sweep: number;
        /** How long the flat fade-in runs before any tile stands up. */
        fade: number;
        seed: number;
    } | null;
    shadow: [number, number, number, number];
    /** Where the camera is across the field, and how many columns lie left of it. */
    cameraX: number;
    split: number;
}

export interface CubeFrame {
    model: Mat4;
    columns: number;
    wave: WaveSettings;
    phase: number;
    cube: CubeSettings;
    coreColor: [number, number, number];
    gain: number;
    tints: [number[], number[]];
    /** Height of the floor, for the mirrored copy; null for none. */
    floor: { z: number; model: Mat4 } | null;
}

export interface Frame {
    viewProjection: Mat4;
    paper: [number, number, number];
    ink: [number, number, number];
    field: FieldFrame | null;
    cube: CubeFrame | null;
}

const compile = (
    gl: WebGL2RenderingContext,
    vertex: string,
    fragment: string,
) => {
    const program = gl.createProgram();
    [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
    ].forEach(([type, source]) => {
        const shader = gl.createShader(type as number);
        if (!shader) return;
        gl.shaderSource(shader, source as string);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
        }
    });
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }
    const uniforms = new Map<string, WebGLUniformLocation | null>();
    return {
        program,
        at: (name: string) => {
            if (!uniforms.has(name)) {
                uniforms.set(name, gl.getUniformLocation(program, name));
            }
            return uniforms.get(name) ?? null;
        },
    };
};

/** Null without WebGL2: the page then simply has no field. */
export const createRenderer = (
    canvas: HTMLCanvasElement,
    { alpha = false, onRestored }: { alpha?: boolean; onRestored: () => void },
) => {
    const context = canvas.getContext('webgl2', {
        alpha,
        antialias: false,
        depth: true,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
    });
    if (!context) return null;
    const gl = context;

    let fieldProgram: ReturnType<typeof compile>;
    let cubeProgram: ReturnType<typeof compile>;
    let cubeInstances: WebGLBuffer | null = null;
    let fieldVao: WebGLVertexArrayObject | null = null;
    let cubeVao: WebGLVertexArrayObject | null = null;
    let cores: Record<
        string,
        { vao: WebGLVertexArrayObject | null; count: number }
    > = {};
    let rampTexture: WebGLTexture | null = null;
    let scrimTexture: WebGLTexture | null = null;
    let cubeColumns = 0;
    let lastRamp: Uint8Array | null = null;
    let lastScrim: { data: Uint8Array; size: number } | null = null;

    const meshVao = (mesh: Mesh) => {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
        return vao;
    };

    const texture = (unit: number) => {
        const created = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, created);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return created;
    };

    const setRamp = (ramp: Uint8Array) => {
        lastRamp = ramp;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rampTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            RAMP_LENGTH,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            ramp,
        );
    };

    const setScrim = (data: Uint8Array, size: number) => {
        lastScrim = { data, size };
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, scrimTexture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R8,
            size,
            size,
            0,
            gl.RED,
            gl.UNSIGNED_BYTE,
            data,
        );
    };

    const init = () => {
        fieldProgram = compile(gl, FIELD_VERTEX, FIELD_FRAGMENT);
        cubeProgram = compile(gl, CUBE_VERTEX, CUBE_FRAGMENT);
        const box = boxMesh();
        // The field's boxes have no underside to draw: five faces, thirty indices.
        fieldVao = meshVao(box);
        cubeVao = meshVao(box);
        cores = {
            cube: { vao: meshVao(box), count: 36 },
            sphere: (() => {
                const mesh = sphereMesh();
                return { vao: meshVao(mesh), count: mesh.indices.length };
            })(),
            diamond: (() => {
                const mesh = diamondMesh();
                return { vao: meshVao(mesh), count: mesh.indices.length };
            })(),
        };
        gl.bindVertexArray(null);
        cubeInstances = gl.createBuffer();
        cubeColumns = 0;
        rampTexture = texture(0);
        scrimTexture = texture(1);
        if (lastRamp) setRamp(lastRamp);
        if (lastScrim) setScrim(lastScrim.data, lastScrim.size);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    };
    init();

    const setCubeColumns = (columns: number) => {
        if (columns === cubeColumns) return;
        cubeColumns = columns;
        const blocks = new Float32Array(columns * columns * 6 * 3);
        let i = 0;
        for (let face = 0; face < 6; face++) {
            for (let y = 0; y < columns; y++) {
                for (let x = 0; x < columns; x++) {
                    blocks[i++] = x;
                    blocks[i++] = y;
                    blocks[i++] = face;
                }
            }
        }
        gl.bindVertexArray(cubeVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeInstances);
        gl.bufferData(gl.ARRAY_BUFFER, blocks, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(2, 1);
        gl.bindVertexArray(null);
    };

    const setWave = (
        at: (name: string) => WebGLUniformLocation | null,
        wave: WaveSettings,
        phase: number,
    ) => {
        gl.uniform4f(
            at('uWave'),
            wave.frequency,
            wave.tilt,
            wave.amplitude,
            wave.secondaryFrequency,
        );
        gl.uniform2f(at('uShape'), wave.contrast, phase);
    };

    const drawField = (frame: Frame, field: FieldFrame) => {
        const { at, program } = fieldProgram;
        gl.useProgram(program);
        gl.uniformMatrix4fv(at('uViewProjection'), false, frame.viewProjection);
        gl.uniform1i(at('uRamp'), 0);
        gl.uniform1i(at('uScrim'), 1);
        gl.uniform2f(at('uResolution'), canvas.width, canvas.height);
        gl.uniform3fv(at('uPaper'), frame.paper);
        gl.uniform3fv(at('uInk'), frame.ink);
        setWave(at, field.wave, field.phase);
        gl.uniform2fv(at('uOrigin'), field.origin);
        gl.uniform1f(at('uHeight'), field.pageHeight);
        gl.uniform1f(at('uTile'), field.tile);
        gl.uniform1f(at('uRelief'), field.wave.relief);
        gl.uniform1f(at('uRise'), field.rise);
        gl.uniform2fv(at('uPointer'), field.pointer);
        gl.uniform2fv(at('uRadius'), field.radius);
        gl.uniform1f(at('uMagnify'), field.magnify);
        gl.uniform1f(at('uLift'), field.lift);
        gl.uniform3fv(at('uGrid'), field.grid);
        gl.uniform1f(at('uTravel'), field.travel);
        gl.uniform4fv(at('uShadow'), field.shadow);
        const { reveal } = field;
        gl.uniform4f(
            at('uReveal'),
            reveal ? 1 : 0,
            reveal?.time ?? 0,
            reveal?.phase ?? 0,
            reveal?.sweep ?? 0,
        );
        gl.uniform1f(at('uRevealSeed'), reveal?.seed ?? 0);
        gl.uniform1f(at('uRevealFade'), reveal?.fade ?? 1);

        const [columns, rows] = field.cells;
        gl.uniform2i(at('uRow'), columns, field.split);
        gl.uniform1f(at('uCameraX'), field.cameraX);
        gl.bindVertexArray(fieldVao);
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            30,
            gl.UNSIGNED_SHORT,
            0,
            columns * rows,
        );
    };

    const drawCube = (
        frame: Frame,
        cube: CubeFrame,
        model: Mat4,
        reflection: number,
    ) => {
        const { at, program } = cubeProgram;
        gl.useProgram(program);
        gl.uniformMatrix4fv(at('uViewProjection'), false, frame.viewProjection);
        gl.uniformMatrix4fv(at('uModel'), false, model);
        gl.uniform1i(at('uRamp'), 0);
        setWave(at, cube.wave, cube.phase);
        gl.uniform1f(at('uColumns'), cube.columns);
        gl.uniform3f(
            at('uShape3'),
            cube.cube.blockWidth,
            cube.cube.blockHeight,
            cube.cube.relief,
        );
        gl.uniform3fv(at('uTintA'), cube.tints[0]);
        gl.uniform3fv(at('uTintB'), cube.tints[1]);
        gl.uniform3fv(at('uCoreColor'), cube.coreColor);
        gl.uniform1f(at('uGain'), cube.gain);
        gl.uniform1f(at('uReflection'), reflection);
        gl.uniform1f(at('uFloor'), cube.floor?.z ?? 0);

        const core = cores[cube.cube.core];
        if (core) {
            const thick = cube.cube.blockHeight / cube.columns;
            const room =
                Math.max(0.05, 1 - 2 * thick) * 0.96 * cube.cube.coreSize;
            gl.uniform1i(at('uPart'), 1);
            gl.uniform1f(at('uCoreScale'), room * 0.5);
            gl.bindVertexArray(core.vao);
            gl.drawElements(gl.TRIANGLES, core.count, gl.UNSIGNED_SHORT, 0);
        }

        // The camera in the cube's own space: what clip space maps to
        // (0, 0, 1, 0). A face is turned to it when the camera is beyond the
        // face's plane, half a unit out.
        const inverse = invert(multiply(frame.viewProjection, model));
        const eye = [inverse[8], inverse[9], inverse[10]].map(
            (c) => c / inverse[11],
        );
        const facing = (d: number[]) =>
            d[0] * eye[0] + d[1] * eye[1] + d[2] * eye[2] - 0.5;
        const away = (d: number[]) => (facing(d) < 0 ? 1 : 0);
        const neg = (d: number[]) => d.map((c) => -c);
        const outline = new Float32Array(24);
        OUTWARD.forEach((_, face) => {
            outline.set(
                [
                    away(neg(RIGHT[face])),
                    away(RIGHT[face]),
                    away(neg(UP[face])),
                    away(UP[face]),
                ],
                face * 4,
            );
        });
        gl.uniform4fv(at('uOutline'), outline);

        // One face's blocks at a time, the most turned away first.
        gl.uniform1i(at('uPart'), 0);
        setCubeColumns(cube.columns);
        gl.bindVertexArray(cubeVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeInstances);
        const perFace = cube.columns * cube.columns;
        OUTWARD.map((d, face) => ({ face, facing: facing(d) }))
            .sort((a, b) => a.facing - b.facing)
            .forEach(({ face }) => {
                gl.vertexAttribPointer(
                    2,
                    3,
                    gl.FLOAT,
                    false,
                    0,
                    face * perFace * 12,
                );
                gl.drawElementsInstanced(
                    gl.TRIANGLES,
                    36,
                    gl.UNSIGNED_SHORT,
                    0,
                    perFace,
                );
            });
    };

    let lost = false;
    const onLost = (event: Event) => {
        event.preventDefault();
        lost = true;
    };
    const onRestore = () => {
        lost = false;
        init();
        onRestored();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestore);

    return {
        resize: (width: number, height: number, dpr: number) => {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
        },
        setRamp,
        setScrim,
        draw: (frame: Frame) => {
            if (lost) return;
            const [r, g, b] = frame.paper;
            if (alpha) gl.clearColor(0, 0, 0, 0);
            else gl.clearColor(r, g, b, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            if (frame.field) drawField(frame, frame.field);
            if (frame.cube) {
                const { cube } = frame;
                if (cube.floor) {
                    gl.cullFace(gl.FRONT);
                    drawCube(frame, cube, cube.floor.model, 0.35);
                    gl.cullFace(gl.BACK);
                    gl.clear(gl.DEPTH_BUFFER_BIT);
                }
                drawCube(frame, cube, cube.model, 0);
            }
            gl.bindVertexArray(null);
        },
        dispose: () => {
            canvas.removeEventListener('webglcontextlost', onLost);
            canvas.removeEventListener('webglcontextrestored', onRestore);
        },
    };
};

export type Renderer = NonNullable<ReturnType<typeof createRenderer>>;

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { FRAGMENT } from '@/components/hero/tileGl';
import type { CoreShape, CubeSettings } from '@/components/hero/TileSettings';
import {
    GradientName,
    HoverEffect,
    RAMP_LENGTH,
    WaveSettings,
    colorIndexAt,
    customPaletteVersion,
    lensMagnify,
    lensRadius,
    paletteStops,
    rgbRamps,
} from '@/components/hero/tiles';

/**
 * The toy cube, as an engine: a small cube built from the field's own tiles,
 * each block pushed out as far as the wave runs bright, lit in the palette's
 * colours. Drag to spin it and let go to throw it; a click opens it up.
 * Mounted small beside the hero's title and in the footer (ToyCube), and
 * full-screen (CubeView).
 */

const FOV = 30;

const Y_UP = new THREE.Vector3(0, 1, 0);

/** Where it starts: a three-quarter view, two sides and the top. */
const BASE_POSE = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.5, -0.66, 0),
);

/** The field shader draws in sRGB, as the page does; lighting wants linear. */
const CUBE_FRAGMENT = FRAGMENT.replace(
    'gl_FragColor = vec4(color, 1.0);',
    'gl_FragColor = vec4(pow(color, vec3(2.2)), 1.0);',
);

/**
 * The field is laid out as if each face were this many CSS pixels across,
 * not the hundred-odd it may actually measure: at its real size the page's
 * tile size left three blocks a side, too few to show a wave.
 */
const FACE = 400;

/** The most the relief setting runs to, in its own units (see RELIEF_DEPTH). */
export const RELIEF_MAX = 3;
/** How far one unit of relief lifts a block off its face, as a share of the edge. */
const RELIEF_DEPTH = 0.16;
/**
 * Every block stands at least this far proud of its face, whatever the
 * relief: a top level with the face is level with the next face's edge
 * block too, and the two flicker (z-fighting) as the cube turns.
 */
const MIN_LIFT = 0.006;
/** How long a new palette takes to fade in, in seconds (as on the page). */
const PALETTE_FADE = 0.45;
/** How quickly the shape follows new settings (as the page's field does). */
const SETTLE = 0.13;

export interface CubeToyState {
    gradient: GradientName;
    wave: WaveSettings;
    effect: HoverEffect;
    cube: CubeSettings;
    /** False until the cube should appear (it pops in when this turns). */
    shown: boolean;
    /** False to hold rendering, for one hidden behind another. */
    active: boolean;
}

export interface CubeToyOptions {
    /** Where the canvas goes; it fills this element. */
    host: HTMLElement;
    /** What takes the pointer: drags, pinches and wheel zoom. */
    hit: HTMLElement;
    /** The cube's edge on screen at zoom 1, in CSS pixels. */
    edge: () => number;
    zoomMax: number;
    /** On a scrolling page, only ctrl+scroll (or a trackpad pinch) zooms. */
    ctrlToZoom: boolean;
    /** The pointer target grows with the zoom, so what shows can be grabbed. */
    scaleHit: boolean;
    /** A click (not a drag): whether it landed on the cube or beside it. */
    onTap?: (onCube: boolean) => void;
    /**
     * Hovers over a floor like an artifact: turning slowly by itself, rising
     * and sinking, with its shadow and a faded reflection below.
     */
    float?: boolean;
    /**
     * Floating on its own stage (the full-screen view): framed to take in
     * the floor and reflection too, with a faint pool of light on the floor,
     * as a shadow on the dark backdrop would not show. The pointer target
     * must be the whole stage, as the cube then sits above its centre.
     */
    stage?: boolean;
    read: () => CubeToyState;
}

/** Starts the cube in `host`; returns what stops and removes it. */
export const mountCubeToy = (options: CubeToyOptions) => {
    const { host, hit, edge, zoomMax, ctrlToZoom, scaleHit, read } = options;
    const float = options.float ?? false;
    const stage = float && (options.stage ?? false);
    const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;

    /* ---------- Renderer ---------- */

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // Neutral, not ACES: ACES pushed bright saturated colours towards white,
    // so a red palette came out pink.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'block h-full w-full';
    host.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    const scene = new THREE.Scene();
    const disposables: { dispose: () => void }[] = [];

    /* ---------- The field, drawn into a texture ---------- */

    const TEX = 512;
    const target = new THREE.WebGLRenderTarget(TEX, TEX, {
        type: THREE.HalfFloatType,
    });
    const rampData = new Uint8Array(RAMP_LENGTH * 4);
    const ramp = new THREE.DataTexture(rampData, RAMP_LENGTH, 1);
    ramp.magFilter = THREE.NearestFilter;
    ramp.minFilter = THREE.NearestFilter;
    disposables.push(target, ramp);

    const fieldUniforms = {
        uDeviceHeight: { value: TEX },
        uDpr: { value: TEX / FACE },
        uCells: { value: new THREE.Vector2() },
        uTile: { value: new THREE.Vector2() },
        uWave: { value: new THREE.Vector4() },
        uShape: { value: new THREE.Vector2() },
        uRamp: { value: ramp },
        uSteps: { value: RAMP_LENGTH },
        uMode: { value: 1 },
        uPointer: { value: new THREE.Vector2() },
        uRadius: { value: new THREE.Vector2() },
        uMagnify: { value: 1 },
        uInk: { value: new THREE.Vector3(0.93, 0.93, 0.94) },
        uGridAlpha: { value: 0 },
        uGridReach: { value: 1 },
        uGridLine: { value: 1 },
        uGridNudge: { value: 0 },
        uTravel: { value: 0 },
        uRevealOn: { value: 0 },
        uRevealTime: { value: 0 },
        uRevealStep: { value: 0 },
        uRevealFrom: { value: new THREE.Vector2() },
        uRevealSeed: { value: 0 },
        uPaper: { value: new THREE.Vector3() },
        // Flat: the blocks are lit for real, in 3D.
        uShade: { value: 0 },
    };
    const fieldScene = new THREE.Scene();
    const fieldCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fieldQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
            vertexShader:
                'attribute vec3 position; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
            fragmentShader: CUBE_FRAGMENT,
            uniforms: fieldUniforms,
            depthTest: false,
            depthWrite: false,
        }),
    );
    fieldScene.add(fieldQuad);
    disposables.push(fieldQuad.geometry, fieldQuad.material);

    /*
     * Pale palettes blew the cube out to white, dark ones sank it into the
     * page; either way the blocks' steps vanished. So its brightness follows
     * the palette: whatever it is, the average lands in the same middle band,
     * and the light has something to shape.
     */
    const CUBE_LUMINANCE = 0.14;
    let gain = 1;
    let rampOf = '';
    const linear = (v: number) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    // A new palette fades in over the old one, from whatever shows now (which
    // may be half way through the last fade).
    const fromChannels = new Float32Array(RAMP_LENGTH * 3);
    const toChannels = new Float32Array(RAMP_LENGTH * 3);
    let blend = 1;
    let gainFrom = 1;
    let gainTo = 1;
    const paintRamp = (t: number) => {
        for (let i = 0; i < RAMP_LENGTH; i++) {
            for (let k = 0; k < 3; k++) {
                const at = i * 3 + k;
                rampData[i * 4 + k] = Math.round(
                    fromChannels[at] + (toChannels[at] - fromChannels[at]) * t,
                );
            }
            rampData[i * 4 + 3] = 255;
        }
        ramp.needsUpdate = true;
        gain = gainFrom + (gainTo - gainFrom) * t;
    };
    const syncRamp = (name: GradientName, dt: number) => {
        const key = `${name}:${customPaletteVersion()}`;
        if (key !== rampOf) {
            const first = rampOf === '';
            rampOf = key;
            const channels = rgbRamps[name];
            let sum = 0;
            for (let i = 0; i < RAMP_LENGTH; i++) {
                for (let k = 0; k < 3; k++) {
                    fromChannels[i * 3 + k] = rampData[i * 4 + k];
                    toChannels[i * 3 + k] = channels[i * 3 + k];
                }
                sum +=
                    0.2126 * linear(channels[i * 3]) +
                    0.7152 * linear(channels[i * 3 + 1]) +
                    0.0722 * linear(channels[i * 3 + 2]);
            }
            gainFrom = gain;
            gainTo = THREE.MathUtils.clamp(
                CUBE_LUMINANCE / (sum / RAMP_LENGTH),
                0.15,
                // A dark palette is lifted a little, not turned pastel.
                1.3,
            );
            blend = first || reduced ? 1 : 0;
            paintRamp(blend);
            return;
        }
        if (blend >= 1) return;
        blend = Math.min(1, blend + dt / PALETTE_FADE);
        paintRamp(THREE.MathUtils.smoothstep(blend, 0, 1));
    };

    /* ---------- Light ---------- */

    // The palette's first, middle and last stops, from three sides, as on the
    // page's ambient glow.
    const environment = new THREE.PMREMGenerator(renderer);
    scene.environment = environment.fromScene(
        new RoomEnvironment(),
        0.04,
    ).texture;
    environment.dispose();
    disposables.push(scene.environment);
    /*
     * Even, readable light rather than drama. The cube turns but the lights
     * do not, and a strong light from behind (which you never see) left faces
     * swinging between blown out and black. So: a soft key from the viewer's
     * upper left, a gentle fill from the lower right, and a broad sky and
     * studio reflection doing most of the work, so every face reads whichever
     * way it points. The lights only take a tint of the palette.
     */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a33, 0.4));
    const lights = [
        [-2, 2.6, 4, 1.7],
        [2.6, -0.8, 3.2, 0.7],
    ].map(([x, y, z, intensity]) => {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(x, y, z);
        scene.add(light);
        return { light, base: intensity };
    });
    let lightsOf = '';
    const white = new THREE.Color(0xffffff);
    // Each light's tint, which it blends towards.
    const tints = lights.map(() => new THREE.Color(0xffffff));
    const syncLights = (name: GradientName, k: number) => {
        const stops = paletteStops(name);
        const key = `${name}:${stops.join()}`;
        if (key !== lightsOf) {
            const first = lightsOf === '';
            lightsOf = key;
            const picks = [stops[0], stops[stops.length - 1]];
            tints.forEach((tint, i) => {
                tint.copy(white).lerp(new THREE.Color(picks[i]), 0.35);
                if (first) lights[i].light.color.copy(tint);
            });
        }
        lights.forEach(({ light }, i) => light.color.lerp(tints[i], k));
    };

    /* ---------- The cube: one block per tile per face ---------- */

    const group = new THREE.Group();
    scene.add(group);

    /*
     * Lit, not glowing: a glossy clear coat that catches the lights as
     * highlights, and a soft studio reflected in every face, so
     * each block's top, sides and edges read differently. Only a trace of
     * glow is left, to keep the colours alive in shadow.
     */
    const material = new THREE.MeshPhysicalMaterial({
        map: target.texture,
        emissiveMap: target.texture,
        emissive: 0xffffff,
        emissiveIntensity: 0.1,
        roughness: 0.5,
        metalness: 0.05,
        clearcoat: 0.3,
        clearcoatRoughness: 0.35,
        envMapIntensity: 0.2,
    });
    // Every block samples the field at its own tile's centre.
    const tileUv = (shader: THREE.WebGLProgramParametersWithUniforms) => {
        shader.vertexShader =
            'attribute vec2 aTileUv;\n' +
            shader.vertexShader.replace(
                '#include <uv_vertex>',
                '#include <uv_vertex>\n\tvMapUv = aTileUv;\n\tvEmissiveMapUv = aTileUv;',
            );
    };
    material.onBeforeCompile = tileUv;
    disposables.push(material);

    /*
     * What sits inside the shell of blocks, as the settings choose: nothing
     * (hollow, the gaps show straight through), or a cube, sphere or diamond
     * of any colour and size. Each is unit-sized and scaled to the space the
     * blocks leave inside.
     */
    const coreMaterial = new THREE.MeshStandardMaterial({
        roughness: 0.4,
        metalness: 0.1,
    });
    const cores: Record<Exclude<CoreShape, 'none'>, THREE.Mesh> = {
        cube: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), coreMaterial),
        sphere: new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 48, 32),
            coreMaterial,
        ),
        diamond: new THREE.Mesh(
            new THREE.OctahedronGeometry(0.62),
            coreMaterial,
        ),
    };
    Object.values(cores).forEach((mesh) => {
        mesh.visible = false;
        group.add(mesh);
        disposables.push(mesh.geometry);
    });
    disposables.push(coreMaterial);
    let coreColorOf = '';

    /*
     * The floor it floats over (float only): nothing of the floor itself, just
     * a soft shadow that tightens and darkens as the cube sinks towards it,
     * and the cube mirrored below, fading out with depth.
     */
    const floorUniform = { value: -1 };
    const REFLECTION = 0.35;
    const fadeBelowFloor = (
        shader: THREE.WebGLProgramParametersWithUniforms,
    ) => {
        shader.uniforms.uFloor = floorUniform;
        shader.vertexShader = shader.vertexShader
            .replace(
                'void main() {',
                'varying float vBelow;\nuniform float uFloor;\nvoid main() {',
            )
            .replace(
                '#include <project_vertex>',
                `#include <project_vertex>
    vec4 floorWorld = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
        floorWorld = instanceMatrix * floorWorld;
    #endif
    vBelow = uFloor - (modelMatrix * floorWorld).y;`,
            );
        shader.fragmentShader = shader.fragmentShader
            .replace('void main() {', 'varying float vBelow;\nvoid main() {')
            .replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
    gl_FragColor.a *= ${REFLECTION.toFixed(2)} * (1.0 - smoothstep(0.0, 1.3, vBelow));`,
            );
    };
    const mirrorMaterial = material.clone();
    mirrorMaterial.transparent = true;
    mirrorMaterial.onBeforeCompile = (shader) => {
        tileUv(shader);
        fadeBelowFloor(shader);
    };
    const mirrorCoreMaterial = coreMaterial.clone();
    mirrorCoreMaterial.transparent = true;
    mirrorCoreMaterial.onBeforeCompile = fadeBelowFloor;
    disposables.push(mirrorMaterial, mirrorCoreMaterial);
    // Holds the mirrored copies; its matrix is the cube's, reflected in the floor.
    const mirror = new THREE.Group();
    mirror.matrixAutoUpdate = false;
    mirror.visible = float;
    mirror.renderOrder = 1;
    scene.add(mirror);
    const mirrorOf = (mesh: THREE.Mesh) => {
        const copy = new THREE.Mesh(mesh.geometry, mirrorCoreMaterial);
        copy.visible = false;
        copy.renderOrder = 1;
        mirror.add(copy);
        return copy;
    };
    const mirrorCores: Record<keyof typeof cores, THREE.Mesh> = {
        cube: mirrorOf(cores.cube),
        sphere: mirrorOf(cores.sphere),
        diamond: mirrorOf(cores.diamond),
    };
    let mirrorBlocks: THREE.InstancedMesh | null = null;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const shadowPaint = shadowCanvas.getContext('2d');
    if (shadowPaint) {
        const falloff = shadowPaint.createRadialGradient(64, 64, 0, 64, 64, 64);
        falloff.addColorStop(0, 'rgba(0,0,0,1)');
        falloff.addColorStop(0.45, 'rgba(0,0,0,0.5)');
        falloff.addColorStop(1, 'rgba(0,0,0,0)');
        shadowPaint.fillStyle = falloff;
        shadowPaint.fillRect(0, 0, 128, 128);
    }
    const lightCanvas = document.createElement('canvas');
    lightCanvas.width = lightCanvas.height = 128;
    const lightPaint = lightCanvas.getContext('2d');
    if (lightPaint) {
        const falloff = lightPaint.createRadialGradient(64, 64, 0, 64, 64, 64);
        falloff.addColorStop(0, 'rgba(255,255,255,1)');
        falloff.addColorStop(0.5, 'rgba(255,255,255,0.35)');
        falloff.addColorStop(1, 'rgba(255,255,255,0)');
        lightPaint.fillStyle = falloff;
        lightPaint.fillRect(0, 0, 128, 128);
    }
    // The pool of light on the stage's floor, for the shadow to fall in.
    const floorLight = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(lightCanvas),
            transparent: true,
            depthWrite: false,
            opacity: 0.1,
        }),
    );
    floorLight.rotation.x = -Math.PI / 2;
    floorLight.visible = stage;
    floorLight.renderOrder = 2;
    scene.add(floorLight);
    disposables.push(
        floorLight.geometry,
        floorLight.material,
        floorLight.material.map as THREE.Texture,
    );
    const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(shadowCanvas),
            transparent: true,
            depthWrite: false,
        }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = float;
    shadow.renderOrder = 3;
    scene.add(shadow);
    disposables.push(
        shadow.geometry,
        shadow.material,
        shadow.material.map as THREE.Texture,
    );

    // What a click is tested against: the cube as far out as its blocks go.
    const pick = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ visible: false }),
    );
    group.add(pick);
    disposables.push(pick.geometry, pick.material);

    const bases = [
        [0, 0, 0],
        [0, Math.PI / 2, 0],
        [0, Math.PI, 0],
        [0, -Math.PI / 2, 0],
        [-Math.PI / 2, 0, 0],
        [Math.PI / 2, 0, 0],
    ].map(([x, y, z]) => {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
        return {
            right: new THREE.Vector3(1, 0, 0).applyQuaternion(q),
            up: new THREE.Vector3(0, 1, 0).applyQuaternion(q),
            out: new THREE.Vector3(0, 0, 1).applyQuaternion(q),
        };
    });

    let blocks: THREE.InstancedMesh | null = null;
    let columns = 0;
    let heights = new Float32Array(0);

    const buildBlocks = (count: number) => {
        if (blocks) {
            group.remove(blocks);
            blocks.geometry.dispose();
            blocks.dispose();
        }
        columns = count;
        const perFace = count * count;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const uv = new Float32Array(perFace * 6 * 2);
        for (let f = 0; f < 6; f++) {
            for (let row = 0; row < count; row++) {
                for (let col = 0; col < count; col++) {
                    const i = (f * perFace + row * count + col) * 2;
                    uv[i] = (col + 0.5) / count;
                    uv[i + 1] = 1 - (row + 0.5) / count;
                }
            }
        }
        geometry.setAttribute(
            'aTileUv',
            new THREE.InstancedBufferAttribute(uv, 2),
        );
        blocks = new THREE.InstancedMesh(geometry, material, perFace * 6);
        blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        blocks.frustumCulled = false;
        group.add(blocks);
        if (mirrorBlocks) {
            mirror.remove(mirrorBlocks);
            mirrorBlocks.dispose();
        }
        // The same blocks, placed by the same matrices.
        mirrorBlocks = new THREE.InstancedMesh(
            geometry,
            mirrorMaterial,
            perFace * 6,
        );
        mirrorBlocks.instanceMatrix = blocks.instanceMatrix;
        mirrorBlocks.frustumCulled = false;
        mirrorBlocks.renderOrder = 1;
        mirror.add(mirrorBlocks);
        heights = new Float32Array(perFace);
    };

    /**
     * Places every block. Each tile is its own small cuboid, `blockWidth` of
     * the tile across and `blockHeight` of it deep, lifted off the face by
     * the wave times the relief: flush at no relief, and at a lot of it
     * scattered outwards, with space all round each block.
     */
    const placeBlocks = (w: WaveSettings, phase: number, c: CubeSettings) => {
        if (!blocks) return 0;
        const perFace = columns * columns;
        const size = 1 / columns;
        const across = size * c.blockWidth;
        const thick = size * c.blockHeight;
        const lift = MIN_LIFT + c.relief * RELIEF_DEPTH;
        for (let row = 0; row < columns; row++) {
            for (let col = 0; col < columns; col++) {
                const index = colorIndexAt(col, row, phase, RAMP_LENGTH, w);
                heights[row * columns + col] =
                    MIN_LIFT +
                    (0.08 + 0.92 * (index / (RAMP_LENGTH - 1))) *
                        c.relief *
                        RELIEF_DEPTH;
            }
        }
        const m = blocks.instanceMatrix.array as Float32Array;
        for (let f = 0; f < 6; f++) {
            const { right, up, out } = bases[f];
            for (let row = 0; row < columns; row++) {
                const y = 0.5 - (row + 0.5) * size;
                for (let col = 0; col < columns; col++) {
                    const x = -0.5 + (col + 0.5) * size;
                    const along =
                        0.5 + heights[row * columns + col] - thick / 2;
                    const o = (f * perFace + row * columns + col) * 16;
                    m[o] = right.x * across;
                    m[o + 1] = right.y * across;
                    m[o + 2] = right.z * across;
                    m[o + 3] = 0;
                    m[o + 4] = up.x * across;
                    m[o + 5] = up.y * across;
                    m[o + 6] = up.z * across;
                    m[o + 7] = 0;
                    m[o + 8] = out.x * thick;
                    m[o + 9] = out.y * thick;
                    m[o + 10] = out.z * thick;
                    m[o + 11] = 0;
                    m[o + 12] = out.x * along + right.x * x + up.x * y;
                    m[o + 13] = out.y * along + right.y * x + up.y * y;
                    m[o + 14] = out.z * along + right.z * x + up.z * y;
                    m[o + 15] = 1;
                }
            }
        }
        blocks.instanceMatrix.needsUpdate = true;
        // The core fits inside the blocks' inner faces, at its chosen share,
        // kept clear of them: level with them at full size, the two flicker.
        const room = Math.max(0.05, 1 - 2 * thick) * 0.96;
        for (const [shape, mesh] of Object.entries(cores)) {
            mesh.visible = c.core === shape;
            if (mesh.visible) mesh.scale.setScalar(room * c.coreSize);
            const copy = mirrorCores[shape as keyof typeof cores];
            copy.visible = mesh.visible;
            copy.scale.copy(mesh.scale);
        }
        if (c.coreColor !== coreColorOf) {
            coreColorOf = c.coreColor;
            coreMaterial.color.set(c.coreColor);
            mirrorCoreMaterial.color.set(c.coreColor);
        }
        return lift;
    };

    /* ---------- Size ---------- */

    let width = 1;
    let height = 1;
    const layout = () => {
        width = Math.max(1, host.clientWidth);
        height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        // Resizing clears the canvas, and a resize lands after the frame was
        // drawn: redraw now, or it shows blank while its box is being resized
        // (as when the settings drawer is dragged).
        if (columns > 0) {
            placeCamera();
            renderer.render(scene, camera);
        }
    };
    layout();
    const resizer = new ResizeObserver(layout);
    resizer.observe(host);

    /** Camera distance that shows the cube's edge at `edge()` pixels × zoom. */
    const distanceFor = (zoom: number) =>
        height /
        (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * edge() * zoom);

    /* ---------- Motion ---------- */

    /*
     * A slingshot. Grabbing it holds it where it is (the anchor); dragging
     * pulls it round against a band that stiffens the further it goes
     * (PULL_MAX). Let go and the band snaps it back towards the anchor,
     * harder the further it was pulled (SLING), and it shoots on through
     * with that speed: from there it flies free, slowing like a flywheel
     * (SPIN_DOWN) until it springs upright into its idle turn. It never
     * spins faster than MAX_SPIN.
     */
    const orientation = BASE_POSE.clone();
    const omega = new THREE.Vector3(); // angular velocity, world, rad/s
    let mode: 'free' | 'held' | 'launch' = 'free';
    const anchor = new THREE.Quaternion();
    // How far the finger has pulled, as a rotation vector (world, radians),
    // before the band's give.
    const pulled = new THREE.Vector3();
    const stretch = new THREE.Vector3();
    const back = new THREE.Quaternion();
    const toAnchor = new THREE.Vector3();
    const PULL_MAX = 2.4; // rad: as far as the band lets it go, ~140 degrees
    const SLING = 45; // how hard the band snaps back
    const SPIN_DOWN = 1.4; // s: how long a hard launch coasts
    const FRICTION = 4; // rad/s², what stops a gentle one
    const MAX_SPIN = 16; // rad/s, about 2.5 turns a second
    let scale = 0;
    let zoom = 1;
    let zoomAim = 1;

    const K = 0.011; // radians per pixel of drag

    /* ---------- Input ---------- */

    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinchFrom = 0;
    let zoomAtPinch = 1;
    const clampZoom = (z: number) => THREE.MathUtils.clamp(z, 1, zoomMax);

    const raycaster = new THREE.Raycaster();
    const onCube = (x: number, y: number) => {
        const bounds = renderer.domElement.getBoundingClientRect();
        raycaster.setFromCamera(
            new THREE.Vector2(
                ((x - bounds.left) / bounds.width) * 2 - 1,
                -((y - bounds.top) / bounds.height) * 2 + 1,
            ),
            camera,
        );
        return raycaster.intersectObject(pick).length > 0;
    };

    const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        hit.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 1) {
            moved = 0;
            // Caught: held still where it is, the anchor of the pull.
            mode = 'held';
            omega.set(0, 0, 0);
            anchor.copy(orientation);
            pulled.set(0, 0, 0);
        }
        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            pinchFrom = Math.hypot(a.x - b.x, a.y - b.y);
            zoomAtPinch = zoomAim;
            moved = Infinity; // a pinch is never a click
        }
    };

    const onPointerMove = (event: PointerEvent) => {
        const previous = pointers.get(event.pointerId);
        if (!previous) return;
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;
        previous.x = event.clientX;
        previous.y = event.clientY;
        moved += Math.abs(dx) + Math.abs(dy);

        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const span = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchFrom > 0)
                zoomAim = clampZoom((zoomAtPinch * span) / pinchFrom);
            return;
        }
        pulled.x += dy * K;
        pulled.y += dx * K;
    };

    const onPointerUp = (event: PointerEvent) => {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) pinchFrom = 0;
        if (pointers.size > 0) return;
        // Barely moved: that was a click, on the cube or beside it.
        if (event.type === 'pointerup' && moved < 6) {
            mode = 'free';
            options.onTap?.(onCube(event.clientX, event.clientY));
            return;
        }
        // Pulled: let fly (under reduced motion, it just stays put).
        mode = reduced || moved === Infinity ? 'free' : 'launch';
    };

    // On a scrolling page only ctrl+scroll (or a trackpad pinch, which arrives
    // as one) zooms, and a plain scroll is left to scroll the page.
    const onWheel = (event: WheelEvent) => {
        if (zoomMax <= 1 || (ctrlToZoom && !event.ctrlKey)) return;
        event.preventDefault();
        zoomAim = clampZoom(zoomAim * Math.exp(-event.deltaY * 0.004));
    };

    hit.addEventListener('pointerdown', onPointerDown);
    hit.addEventListener('pointermove', onPointerMove);
    hit.addEventListener('pointerup', onPointerUp);
    hit.addEventListener('pointercancel', onPointerUp);
    hit.addEventListener('wheel', onWheel, { passive: false });

    /* ---------- Loop ---------- */

    let frame = 0;
    let last = performance.now();
    let phase = 0;
    let drift = 0;
    let visible = true;
    // What shows: eased towards the settings, so a change (a preset, a
    // randomise) flows into place rather than jumping.
    let shownWave: WaveSettings | null = null;
    let shownCube: CubeSettings | null = null;
    const approach = <T extends object>(shown: T, to: T, k: number) => {
        const from = shown as Record<string, unknown>;
        for (const [key, value] of Object.entries(to)) {
            const was = from[key];
            from[key] =
                typeof value === 'number' && typeof was === 'number'
                    ? was + (value - was) * k
                    : value;
        }
    };

    // Floating: a slow turn, and a rise and fall above the floor.
    const IDLE_SPIN = 0.3; // rad/s, about the upright
    const idle = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const spin = new THREE.Quaternion();
    /*
     * Its upright: the axis of the cube that points straight up in its
     * resting pose. Once a throw has slowed, a spring swings that axis back
     * up (overshooting a little, as a weighted thing would) while it keeps
     * turning freely about it.
     */
    const UPRIGHT = Y_UP.clone().applyQuaternion(BASE_POSE.clone().invert());
    const SPRING = 7; // how hard it rights itself
    const SPRING_DAMP = 0.45; // s: how quickly the wobble dies away
    const upNow = new THREE.Vector3();
    const toUp = new THREE.Vector3();
    const tilt = new THREE.Vector3();
    const BOB = 0.06; // of the edge, either way
    const TILT = THREE.MathUtils.degToRad(12); // looking down on the floor
    const reflect = new THREE.Matrix4();
    const turned = new THREE.Matrix4();
    let floorAt = -1;
    // How far the blocks stood out last frame, for framing the stage.
    let lastLift = 0;

    const placeCamera = () => {
        let distance = distanceFor(zoom);
        let aim = 0;
        if (stage) {
            // Zoom 1 fills the stage: as big as the cube can be drawn with
            // it, its floor and reflection all on screen whichever way it
            // turns. More relief, and it steps back to keep it all in.
            const r = (Math.sqrt(3) / 2) * (1 + 2 * lastLift);
            const top = r + BOB;
            const bottom = -(r + BOB + 0.14) - 0.8;
            aim = (top + bottom) / 2;
            const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
            const tanH = tanV * camera.aspect;
            const fit =
                Math.max((top - bottom) / 2 / tanV, r / tanH) * 1.06 + r * 0.5;
            distance = fit / zoom;
        }
        // Just deep enough for the cube (and its floor): a tight depth range
        // keeps the blocks' close faces from flickering against each other.
        camera.near = Math.max(0.1, distance - 4);
        camera.far = distance + 4;
        if (float) {
            camera.position.set(
                0,
                distance * Math.sin(TILT),
                distance * Math.cos(TILT),
            );
        } else {
            camera.position.set(0, 0, distance);
        }
        // Centred on the cube, where the pointer target sits; its floor has
        // the room below. On a stage, centred on the cube and its reflection
        // together.
        camera.lookAt(0, aim, 0);
        camera.updateProjectionMatrix();
    };

    const ease = (dt: number, tau: number) =>
        reduced ? 1 : 1 - Math.exp(-dt / tau);

    const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const {
            gradient: name,
            wave: wantWave,
            effect: fx,
            cube: wantCube,
            shown,
            active,
        } = read();
        if (!active) return;

        // Appears once it is to be shown.
        if (!shown) {
            renderer.clear();
            return;
        }

        const settle = ease(dt, SETTLE);
        if (!shownWave || !shownCube) {
            shownWave = { ...wantWave };
            shownCube = { ...wantCube };
        } else {
            approach(shownWave, wantWave, settle);
            approach(shownCube, wantCube, settle);
        }
        const w = shownWave;
        const c = shownCube;

        if (mode === 'held') {
            // Turned as far as the finger has pulled, less the band's give:
            // near the anchor it follows the finger, far out it barely moves.
            const reach = pulled.length();
            const give = PULL_MAX * (1 - Math.exp(-reach / PULL_MAX));
            if (reach > 1e-6) {
                orientation
                    .setFromAxisAngle(
                        stretch.copy(pulled).divideScalar(reach),
                        give,
                    )
                    .multiply(anchor);
            }
        } else if (mode === 'launch') {
            // The band pulls it back towards the anchor, harder the further
            // off it is; once it is through (moving away again), it flies.
            back.copy(anchor).multiply(spin.copy(orientation).invert());
            if (back.w < 0) back.set(-back.x, -back.y, -back.z, -back.w);
            const angle = 2 * Math.acos(Math.min(1, back.w));
            const sine = Math.sqrt(Math.max(0, 1 - back.w * back.w));
            if (sine > 1e-6) {
                toAnchor.set(back.x, back.y, back.z).divideScalar(sine);
                omega.addScaledVector(toAnchor, SLING * angle * dt);
            }
            if (angle < 0.02 || (sine > 1e-6 && omega.dot(toAnchor) < 0)) {
                mode = 'free';
            }
        } else {
            // Free (or pinching): winding down to its idle turn (or to rest).
            const rest = float && !reduced ? IDLE_SPIN : 0;
            if (reduced) omega.set(0, 0, 0);
            else {
                // Two kinds of drag, as on anything real: a steady friction,
                // which stops a gentle launch within a fraction of a turn,
                // and air, which lets a hard one coast a while longer.
                idle.set(0, rest, 0);
                const extra = toAnchor.copy(omega).sub(idle);
                const over = extra.length();
                if (over > 1e-6) {
                    const next =
                        Math.max(0, over - FRICTION * dt) *
                        Math.exp(-dt / SPIN_DOWN);
                    omega.copy(idle).addScaledVector(extra, next / over);
                }
            }
            // Slowed enough (under ~3 rad/s, fully under 1): spring upright.
            const settled =
                1 - THREE.MathUtils.smoothstep(omega.length(), 1, 3);
            if (float && !reduced && settled > 0) {
                upNow.copy(UPRIGHT).applyQuaternion(orientation);
                toUp.crossVectors(upNow, Y_UP);
                const off = Math.atan2(toUp.length(), upNow.dot(Y_UP));
                if (toUp.lengthSq() > 1e-10) {
                    omega.addScaledVector(
                        toUp.normalize(),
                        SPRING * off * settled * dt,
                    );
                }
                // Damp only the tipping, never the turn about the upright.
                tilt.set(omega.x, 0, omega.z);
                omega.addScaledVector(tilt, -ease(dt, SPRING_DAMP) * settled);
            }
        }
        if (omega.length() > MAX_SPIN) omega.setLength(MAX_SPIN);
        const speed = omega.length();
        if (mode !== 'held' && speed > 1e-5) {
            orientation.premultiply(
                spin.setFromAxisAngle(
                    axis.copy(omega).divideScalar(speed),
                    speed * dt,
                ),
            );
        }
        scale += (1 - scale) * ease(dt, 0.25);
        zoom += (zoomAim - zoom) * ease(dt, 0.15);

        group.quaternion.copy(orientation);
        group.scale.setScalar(Math.max(0.001, scale));
        placeCamera();
        if (scaleHit) hit.style.transform = `scale(${zoom.toFixed(3)})`;

        // The field.
        syncRamp(name, dt);
        syncLights(name, ease(dt, PALETTE_FADE / 3));
        material.color.setScalar(gain);
        material.emissiveIntensity = 0.1 * gain;
        mirrorMaterial.color.copy(material.color);
        mirrorMaterial.emissiveIntensity = material.emissiveIntensity;
        phase += w.speed * dt * 60;
        drift += dt;
        const count = THREE.MathUtils.clamp(
            Math.ceil(FACE / w.tileSize),
            5,
            24,
        );
        if (count !== columns) buildBlocks(count);
        const lift = placeBlocks(w, phase, c);
        lastLift = lift;
        pick.scale.setScalar(1 + 2 * lift);

        if (float) {
            // The floor sits just clear of the cube as it is turned now: at
            // once lower when a corner swings down, slowly back up after.
            const half = (0.5 + lift) * scale;
            const e = turned.makeRotationFromQuaternion(orientation).elements;
            const low =
                half * (Math.abs(e[1]) + Math.abs(e[5]) + Math.abs(e[9]));
            const reach = (Math.sqrt(3) / 2) * (1 + 2 * lift) * scale;
            const clear = -low - BOB - 0.14;
            floorAt =
                clear < floorAt
                    ? clear
                    : floorAt + (clear - floorAt) * ease(dt, 1.2);
            const floor = floorAt;
            const rise = reduced ? 0 : Math.sin(drift * 0.9);
            group.position.y = rise * BOB;
            floorUniform.value = floor;
            shadow.position.y = floor;
            floorLight.position.y = floor;
            floorLight.scale.setScalar(reach * 5);
            // Nearer the floor: a smaller, darker shadow.
            const near = 0.5 - 0.5 * rise;
            shadow.scale.setScalar(reach * (2.1 - 0.35 * near));
            shadow.material.opacity = (0.35 + 0.2 * near) * scale;
            group.updateMatrixWorld();
            reflect.set(
                1,
                0,
                0,
                0,
                0,
                -1,
                0,
                2 * floor,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
            );
            mirror.matrix.multiplyMatrices(reflect, group.matrixWorld);
            mirror.matrixWorldNeedsUpdate = true;
        }
        const u = fieldUniforms;
        u.uCells.value.set(count, count);
        u.uTile.value.set(FACE / count, FACE / count);
        u.uWave.value.set(
            w.frequency,
            w.tilt,
            w.amplitude,
            w.secondaryFrequency,
        );
        u.uShape.value.set(w.contrast, phase);
        u.uPointer.value.set(
            FACE * (0.5 + 0.34 * Math.sin(drift * 0.19)),
            FACE * (0.5 + 0.3 * Math.sin(drift * 0.13 + 1.7)),
        );
        const radius = lensRadius(w.lens) * (FACE / 900);
        u.uRadius.value.set(radius * w.reachX, radius * w.reachY);
        u.uMagnify.value = lensMagnify(w.lens, 1);
        u.uMode.value = fx === 'grid' ? 2 : 1;
        u.uGridAlpha.value = w.gridOpacity;
        u.uGridReach.value = w.gridReach * (FACE / 900);
        u.uGridLine.value = w.gridLine;
        u.uTravel.value = drift;

        renderer.setRenderTarget(target);
        renderer.render(fieldScene, fieldCamera);
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
    };

    const play = () => {
        if (frame || !visible || document.hidden) return;
        last = performance.now();
        frame = requestAnimationFrame(tick);
    };
    const stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
    };

    // Only while it is on screen.
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else stop();
    });
    observer.observe(host);
    const onVisibility = () => (document.hidden ? stop() : play());
    document.addEventListener('visibilitychange', onVisibility);
    play();

    return () => {
        stop();
        observer.disconnect();
        resizer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        hit.removeEventListener('pointerdown', onPointerDown);
        hit.removeEventListener('pointermove', onPointerMove);
        hit.removeEventListener('pointerup', onPointerUp);
        hit.removeEventListener('pointercancel', onPointerUp);
        hit.removeEventListener('wheel', onWheel);
        disposables.forEach((item) => item.dispose());
        if (blocks) {
            blocks.geometry.dispose();
            blocks.dispose();
        }
        mirrorBlocks?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
    };
};

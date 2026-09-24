import * as THREE from 'three';

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
    read: () => CubeToyState;
}

/** Starts the cube in `host`; returns what stops and removes it. */
export const mountCubeToy = (options: CubeToyOptions) => {
    const { host, hit, edge, zoomMax, ctrlToZoom, scaleHit, read } = options;
    const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;

    /* ---------- Renderer ---------- */

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
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
        uRevealOn: { value: 0 },
        uRevealTime: { value: 0 },
        uRevealStep: { value: 0 },
        uRevealFrom: { value: new THREE.Vector2() },
        uRevealSeed: { value: 0 },
        uPaper: { value: new THREE.Vector3() },
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
    const syncRamp = (name: GradientName) => {
        const key = `${name}:${customPaletteVersion()}`;
        if (key === rampOf) return;
        rampOf = key;
        const channels = rgbRamps[name];
        let sum = 0;
        for (let i = 0; i < RAMP_LENGTH; i++) {
            const r = channels[i * 3];
            const g = channels[i * 3 + 1];
            const b = channels[i * 3 + 2];
            rampData.set([r, g, b, 255], i * 4);
            sum += 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
        }
        ramp.needsUpdate = true;
        gain = THREE.MathUtils.clamp(
            CUBE_LUMINANCE / (sum / RAMP_LENGTH),
            0.15,
            2,
        );
    };

    /* ---------- Light ---------- */

    // The palette's first, middle and last stops, from three sides, as on the
    // page's ambient glow.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x202028, 0.35));
    const lights = [
        [-2.5, 3, 3.5, 3.6],
        [3, 1.5, -2.5, 3.2],
        [1.5, -2.5, 3, 1.3],
    ].map(([x, y, z, intensity]) => {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(x, y, z);
        scene.add(light);
        return { light, base: intensity };
    });
    let lightsOf = '';
    const syncLights = (name: GradientName) => {
        const stops = paletteStops(name);
        const key = `${name}:${stops.join()}`;
        if (key === lightsOf) return;
        lightsOf = key;
        const picks = [
            stops[0],
            stops[Math.floor(stops.length / 2)],
            stops[stops.length - 1],
        ];
        lights.forEach(({ light, base }, i) => {
            light.color.set(picks[i]);
            // A near-white stop would bleach its side, a near-black one would
            // barely show: each is balanced by its own brightness.
            const { r, g, b } = light.color;
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            light.intensity =
                base * THREE.MathUtils.clamp(0.25 / luminance, 0.45, 1.6);
        });
    };

    /* ---------- The cube: one block per tile per face ---------- */

    const group = new THREE.Group();
    scene.add(group);

    const material = new THREE.MeshStandardMaterial({
        map: target.texture,
        emissiveMap: target.texture,
        emissive: 0xffffff,
        // A glow of its own, kept low enough for the lights to shape it.
        emissiveIntensity: 0.3,
        roughness: 0.45,
        metalness: 0.08,
    });
    // Every block samples the field at its own tile's centre.
    material.onBeforeCompile = (shader) => {
        shader.vertexShader =
            'attribute vec2 aTileUv;\n' +
            shader.vertexShader.replace(
                '#include <uv_vertex>',
                '#include <uv_vertex>\n\tvMapUv = aTileUv;\n\tvEmissiveMapUv = aTileUv;',
            );
    };
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
        // Always a little off the face, never level with it: a top exactly on
        // the face's plane is coplanar with the next face's edge block, and
        // the two flicker (z-fighting) when the cube is turned.
        const lift = 0.004 + c.relief * RELIEF_DEPTH;
        for (let row = 0; row < columns; row++) {
            for (let col = 0; col < columns; col++) {
                const index = colorIndexAt(col, row, phase, RAMP_LENGTH, w);
                heights[row * columns + col] =
                    (0.08 + 0.92 * (index / (RAMP_LENGTH - 1))) * lift;
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
        // The core fits inside the blocks' inner faces, at its chosen share.
        const room = Math.max(0.05, 1 - 2 * thick) * 0.999;
        for (const [shape, mesh] of Object.entries(cores)) {
            mesh.visible = c.core === shape;
            if (mesh.visible) mesh.scale.setScalar(room * c.coreSize);
        }
        if (c.coreColor !== coreColorOf) {
            coreColorOf = c.coreColor;
            coreMaterial.color.set(c.coreColor);
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
    };
    layout();
    const resizer = new ResizeObserver(layout);
    resizer.observe(host);

    /** Camera distance that shows the cube's edge at `edge()` pixels × zoom. */
    const distanceFor = (zoom: number) =>
        height /
        (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * edge() * zoom);

    /* ---------- Motion ---------- */

    // Free: a throw spins on its own momentum and slows by friction alone.
    const orientation = BASE_POSE.clone();
    const omega = new THREE.Vector3(); // angular velocity, world, rad/s
    let scale = 0;
    let zoom = 1;
    let zoomAim = 1;

    const K = 0.011; // radians per pixel of drag
    const X = new THREE.Vector3(1, 0, 0);
    const Y = new THREE.Vector3(0, 1, 0);
    const turnBy = (dx: number, dy: number) => {
        orientation.premultiply(
            new THREE.Quaternion()
                .setFromAxisAngle(Y, dx * K)
                .multiply(new THREE.Quaternion().setFromAxisAngle(X, dy * K)),
        );
    };

    /* ---------- Input ---------- */

    const pointers = new Map<number, { x: number; y: number }>();
    let lastMove = 0;
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
        if (pointers.size === 1) moved = 0;
        omega.set(0, 0, 0);
        lastMove = performance.now();
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
        const now = performance.now();
        const dt = Math.max(0.001, (now - lastMove) / 1000);
        lastMove = now;
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
        turnBy(dx, dy);
        // Measured spin, smoothed, for the throw on release.
        omega.lerp(new THREE.Vector3(dy * K, dx * K, 0).divideScalar(dt), 0.5);
    };

    const onPointerUp = (event: PointerEvent) => {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) pinchFrom = 0;
        if (pointers.size > 0) return;
        const now = performance.now();
        // Let go after holding still: no throw.
        if (now - lastMove > 80) omega.set(0, 0, 0);
        // Barely moved: that was a click, on the cube or beside it.
        if (event.type === 'pointerup' && moved < 6) {
            omega.set(0, 0, 0);
            options.onTap?.(onCube(event.clientX, event.clientY));
        }
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

    const ease = (dt: number, tau: number) =>
        reduced ? 1 : 1 - Math.exp(-dt / tau);

    const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const {
            gradient: name,
            wave: w,
            effect: fx,
            cube: c,
            shown,
            active,
        } = read();
        if (!active) return;

        // Appears once it is to be shown.
        if (!shown) {
            renderer.clear();
            return;
        }

        if (pointers.size === 0) {
            omega.multiplyScalar(reduced ? 0 : Math.exp(-1.1 * dt));
            const speed = omega.length();
            if (speed > 1e-5) {
                orientation.premultiply(
                    new THREE.Quaternion().setFromAxisAngle(
                        omega.clone().divideScalar(speed),
                        speed * dt,
                    ),
                );
            }
        }
        scale += (1 - scale) * ease(dt, 0.25);
        zoom += (zoomAim - zoom) * ease(dt, 0.15);

        group.quaternion.copy(orientation);
        group.scale.setScalar(Math.max(0.001, scale));
        camera.position.set(0, 0, distanceFor(zoom));
        camera.lookAt(0, 0, 0);
        if (scaleHit) hit.style.transform = `scale(${zoom.toFixed(3)})`;

        // The field.
        syncRamp(name);
        syncLights(name);
        material.color.setScalar(gain);
        material.emissiveIntensity = 0.3 * gain;
        phase += w.speed * dt * 60;
        drift += dt;
        const count = THREE.MathUtils.clamp(
            Math.ceil(FACE / w.tileSize),
            5,
            24,
        );
        if (count !== columns) buildBlocks(count);
        const lift = placeBlocks(w, phase, c);
        pick.scale.setScalar(1 + 2 * lift);
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
        renderer.dispose();
        renderer.domElement.remove();
    };
};

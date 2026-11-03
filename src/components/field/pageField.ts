import { attachCubeInput } from '@/components/cube/cubeInput';
import {
    createCubeRig,
    createPaletteFade,
    hexToUnit,
} from '@/components/cube/cubeRig';
import {
    Mat4,
    invert,
    multiply,
    onPlane,
    perspective,
    rotationX,
    translation,
} from '@/components/field/math';
import { Renderer, createRenderer } from '@/components/field/renderer';
import { SCRIM_SIZE, ScrimName, scrimTexture } from '@/components/hero/scrim';
import type { CubeSettings } from '@/components/hero/TileSettings';
import {
    GradientName,
    HoverEffect,
    PHASE_RATE,
    WaveSettings,
    lensMagnify,
    lensRadius,
    waveKeys,
} from '@/components/hero/tiles';
import { afterPaint, prefersReducedMotion } from '@/components/common/motion';
import { fieldBuilt, markFieldBuilt } from '@/components/common/introSequence';

/**
 * The live background: one canvas and one loop for the whole page. The hero
 * and the footer are never on screen together, so the canvas simply moves to
 * whichever is showing, and the cube is drawn in the same pass as the field,
 * in the same space. Everything here runs only while one of them is in view.
 */

export interface FieldSettings {
    gradient: GradientName;
    wave: WaveSettings;
    effect: HoverEffect;
    cube: CubeSettings;
    /**
     * The full-screen cube is open. The field keeps running behind it, so
     * changes made there show, but the floating cube steps aside for it.
     */
    cubeOpen: boolean;
}

interface Host {
    name: ScrimName;
    element: HTMLElement;
    visible: boolean;
    pageTop: number;
    width: number;
    height: number;
    cube: CubeSlot | null;
}

interface CubeSlot {
    slot: HTMLElement;
    x: number;
    y: number;
    edge: number;
}

const FOV = 0.5;
/** How far the camera leans over the field, at rest. */
const TILT = 0.42;
/** What scrolling does: further over and closer as the hero leaves... */
const SCROLL_TILT = 0.34;
const SCROLL_ZOOM = 0.26;
/** ...and the footer starts from this far over, rising to rest. */
const FOOTER_TILT = 0.5;
/** Camera moves ease towards the scroll, so a mouse wheel's steps are not seen. */
const CAMERA_EASE = 0.14;

const AHEAD = '200px';
const MAX_PIXEL_RATIO = 1.5;
const SETTLE = 0.13;
const CHASE = 0.09;
const GRAB = 0.22;
const RELEASE = 0.9;
const BLOOM = 0.5;
const REVEAL_SWEEP = 900;
const REVEAL_FADE = 700;
const REVEAL_TOTAL = REVEAL_FADE + REVEAL_SWEEP + 160 + 600;
/** The cube's edge on screen, as a share of its slot. */
const EDGE = 0.5;
/** How high it floats, in tiles, and how much it bobs, in edges. */
const FLOAT_TILES = 7;
const BOB = 0.05;
/** How long after the field is built the cube starts growing in, in ms. */
const CUBE_DELAY = 450;

let settings: FieldSettings | null = null;
const hosts = new Map<ScrimName, Host>();
let active: Host | null = null;
let renderer: Renderer | null = null;
let canvas: HTMLCanvasElement | null = null;
let setup = false;
let frame = 0;
let lastTime = 0;
let width = 0;
let height = 0;
let dpr = 0;

const reducedMotion = () => prefersReducedMotion();
const holdStill = reducedMotion;

let shown: WaveSettings | null = null;
let phase = 0;
let travel = 0;
let drift = 0;
let follow = 0;
let followTarget = 0;
let influence = 0;
const pointer = { x: 0, y: 0, toX: 0, toY: 0, placed: false };

let tiltNow = TILT;
let zoomNow = 1;
let riseNow = 1;

let revealStart = 0;
let revealed = false;
let cubeAt = 0;
const revealSeed = Math.random() * 100;
let revealPhase = 0;

let paper: [number, number, number] = [0.96, 0.96, 0.945];
let ink: [number, number, number] = [0.09, 0.09, 0.1];
const palette = createPaletteFadeLazy();
const rig = createCubeRigLazy();

function createPaletteFadeLazy() {
    let made: ReturnType<typeof createPaletteFade> | null = null;
    return () => (made ??= createPaletteFade(reducedMotion()));
}
function createCubeRigLazy() {
    let made: ReturnType<typeof createCubeRig> | null = null;
    return () => (made ??= createCubeRig(true, reducedMotion()));
}

const readColours = () => {
    paper = hexToUnit(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--paper')
            .trim(),
    );
    ink =
        document.documentElement.dataset.theme === 'dark'
            ? [0.93, 0.93, 0.94]
            : [0.09, 0.09, 0.1];
};

const measureCube = (host: Host) => {
    const { cube } = host;
    if (!cube) return;
    const box = host.element.getBoundingClientRect();
    const slot = cube.slot.getBoundingClientRect();
    cube.x = slot.left + slot.width / 2 - box.left;
    cube.y = slot.top + slot.height / 2 - box.top;
    cube.edge = slot.width * EDGE;
};

const measure = () => {
    if (!active || !renderer) return;
    const box = active.element.getBoundingClientRect();
    active.pageTop = box.top + window.scrollY;
    active.width = box.width;
    active.height = box.height;
    measureCube(active);

    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    if (box.width === width && box.height === height && nextDpr === dpr) return;
    dpr = nextDpr;
    width = box.width;
    height = box.height;
    renderer.resize(width, height, dpr);
    renderer.setScrim(scrimTexture(active.name, width, height), SCRIM_SIZE);
};

/** Where the scroll has the camera: 0 at rest. */
const scrollState = (host: Host) => {
    if (reducedMotion()) return { tilt: TILT, zoom: 1, rise: 1 };
    const y = window.scrollY;
    if (host.name === 'hero') {
        const t = Math.min(1, Math.max(0, y / host.height));
        const eased = t * t * (3 - 2 * t);
        return {
            tilt: TILT + SCROLL_TILT * eased,
            zoom: 1 - SCROLL_ZOOM * eased,
            rise: 1,
        };
    }
    // How much of the footer has come up over the bottom of the screen.
    const entered =
        (y + window.innerHeight - host.pageTop) /
        Math.min(host.height, window.innerHeight);
    const t = Math.min(1, Math.max(0, entered));
    const eased = t * t * (3 - 2 * t);
    return {
        tilt: TILT + FOOTER_TILT * (1 - eased),
        zoom: 1 - SCROLL_ZOOM * (1 - eased),
        rise: 0.15 + 0.85 * eased,
    };
};

const camera = (
    w: number,
    h: number,
    tilt: number,
    zoom: number,
): { viewProjection: Mat4; inverse: Mat4 } => {
    const distance = (h / 2 / Math.tan(FOV / 2)) * zoom;
    const view = multiply(
        translation(0, 0, -distance * 0.94),
        multiply(rotationX(tilt), translation(-w / 2, -h / 2, 0)),
    );
    const viewProjection = multiply(
        perspective(FOV, w / h, 1, distance * 4),
        view,
    );
    return { viewProjection, inverse: invert(viewProjection) };
};

const draw = (now: number) => {
    const host = active;
    if (!host || !renderer || !settings || !width) return;
    const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 0;
    lastTime = now;
    const still = holdStill();

    const settle = dt > 0 ? 1 - Math.exp(-dt / SETTLE) : 0;
    const target = settings.wave;
    shown ??= { ...target };
    if (still) Object.assign(shown, target);
    else
        for (const key of waveKeys)
            shown[key] += (target[key] - shown[key]) * settle;
    const wave = shown;
    phase += wave.speed * dt * PHASE_RATE;
    travel += dt;
    drift += dt;

    const ramp = palette().update(settings.gradient, dt);
    if (ramp) renderer.setRamp(ramp);

    const goal = scrollState(host);
    const ease = dt > 0 ? 1 - Math.exp(-dt / CAMERA_EASE) : 1;
    tiltNow += (goal.tilt - tiltNow) * ease;
    zoomNow += (goal.zoom - zoomNow) * ease;
    riseNow += (goal.rise - riseNow) * ease;
    const { viewProjection, inverse } = camera(width, height, tiltNow, zoomNow);

    // The lens wanders by itself, and hands over to a cursor while one hovers.
    const driftX = width * (0.5 + 0.34 * Math.sin(drift * 0.19));
    const driftY = height * (0.5 + 0.3 * Math.sin(drift * 0.13 + 1.7));
    const handover = followTarget > follow ? GRAB : RELEASE;
    follow +=
        (followTarget - follow) * (dt > 0 ? 1 - Math.exp(-dt / handover) : 0);
    const toX = driftX + (pointer.toX - driftX) * follow;
    const toY = driftY + (pointer.toY - driftY) * follow;
    if (!pointer.placed) {
        pointer.placed = true;
        pointer.x = toX;
        pointer.y = toY;
    }
    const chase = dt > 0 ? 1 - Math.exp(-dt / CHASE) : 0;
    pointer.x += (toX - pointer.x) * chase;
    pointer.y += (toY - pointer.y) * chase;
    if (!still && dt > 0)
        influence += (1 - influence) * (1 - Math.exp(-dt / BLOOM));
    const world = onPlane(
        inverse,
        (pointer.x / width) * 2 - 1,
        1 - (pointer.y / height) * 2,
        0,
    );

    // The cells the camera can see, with room for the columns' height.
    const margin = 5;
    const corners = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
    ].map(([x, y]) => onPlane(inverse, x, y, 0));
    const tile = wave.tileSize;
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => height - c[1]);
    const originX = Math.floor(Math.min(...xs) / tile) - margin;
    const originY = Math.floor(Math.min(...ys) / tile) - margin;
    const columns = Math.min(
        220,
        Math.ceil(Math.max(...xs) / tile) + margin - originX,
    );
    const rows = Math.min(
        200,
        Math.ceil(Math.max(...ys) / tile) + margin - originY,
    );

    if (!revealed && !revealStart) {
        if (host.name === 'hero' && !still) {
            revealStart = now;
            revealPhase = phase;
        } else {
            revealed = true;
            markFieldBuilt();
        }
    }
    let reveal = null;
    if (!revealed) {
        const time = now - revealStart;
        if (time >= REVEAL_TOTAL) {
            revealed = true;
            markFieldBuilt();
        } else {
            reveal = {
                time,
                phase: revealPhase,
                sweep: REVEAL_SWEEP,
                fade: REVEAL_FADE,
                seed: revealSeed,
            };
        }
    }

    const { effect } = settings;
    const lens = lensRadius(wave.lens);
    const push = (wave.lens - 50) / 50;

    let cube = null;
    let shadow: [number, number, number, number] = [0, 0, 0, 0];
    // The cube comes in after the field and the title.
    if (!cubeAt && fieldBuilt()) cubeAt = now + (still ? 0 : CUBE_DELAY);
    const slot = host.cube;
    if (
        slot &&
        slot.edge > 0 &&
        !settings.cubeOpen &&
        cubeAt &&
        now >= cubeAt
    ) {
        const body = rig().step(dt, target, settings.cube);
        const z = tile * FLOAT_TILES;
        const clipX = (slot.x / width) * 2 - 1;
        const clipY = 1 - (slot.y / height) * 2;
        const centre = onPlane(inverse, clipX, clipY, z);
        const beside = onPlane(
            inverse,
            clipX + (slot.edge / width) * 2,
            clipY,
            z,
        );
        const size = Math.max(
            1,
            Math.hypot(beside[0] - centre[0], beside[1] - centre[1]),
        );
        const bob = reducedMotion() ? 0 : Math.sin(drift * 0.9) * BOB * size;
        const scale = Math.max(0.001, body.scale);
        cube = {
            model: rig().matrix(
                size * scale,
                centre[0],
                centre[1],
                centre[2] + bob,
            ),
            columns: body.columns,
            wave: body.wave,
            phase: body.phase,
            cube: body.cube,
            coreColor: hexToUnit(body.cube.coreColor),
            gain: palette().gain(),
            tints: palette().tints(),
            floor: null,
        };
        // Cast away from the key light, onto the field below it.
        shadow = [
            centre[0] + z * 0.28,
            centre[1] - z * 0.22,
            size * (0.95 + (bob / size) * 0.5) * scale,
            0.42,
        ];
    }

    renderer.draw({
        viewProjection,
        paper,
        ink,
        field: {
            origin: [originX, originY],
            cells: [columns, rows],
            pageHeight: height,
            tile,
            wave,
            phase,
            rise: riseNow,
            pointer: [world[0], world[1]],
            radius:
                effect === 'rise'
                    ? [wave.riseReach, wave.riseReach]
                    : [lens * wave.reachX, lens * wave.reachY],
            magnify: effect === 'lens' ? lensMagnify(wave.lens, influence) : 1,
            lift:
                effect === 'lens'
                    ? push * tile * 2.4 * influence
                    : effect === 'rise'
                      ? wave.riseHeight * tile * influence
                      : 0,
            // The lines are a CSS pixel wide on every tile size: two, where
            // two tiles meet.
            grid:
                effect === 'grid'
                    ? [wave.gridReach, wave.gridOpacity * influence, dpr]
                    : [1, 0, 1],
            travel,
            reveal,
            shadow,
            cameraX: width / 2,
            split: Math.min(
                columns,
                Math.max(0, Math.ceil(width / 2 / tile - 0.5) - originX),
            ),
        },
        cube,
    });
};

const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    draw(now);
};

const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
};

const play = () => {
    if (frame || !active || !renderer || document.hidden) return;
    if (holdStill()) {
        requestAnimationFrame((now) => draw(now));
        return;
    }
    frame = requestAnimationFrame(loop);
};

const restart = () => {
    stop();
    measure();
    play();
};

/** Moves the canvas to whichever host is on screen. */
const choose = () => {
    const next = hosts.get('hero')?.visible
        ? hosts.get('hero')
        : hosts.get('footer')?.visible
          ? hosts.get('footer')
          : null;
    // The canvas arrives a moment after the hosts do, so being the chosen host
    // is not enough: it has to actually hold the canvas.
    if (next === active && (!next || canvas?.parentElement === next.element)) {
        return;
    }
    stop();
    active = next ?? null;
    if (!active || !canvas) return;
    active.element.append(canvas);
    width = 0;
    pointer.placed = false;
    followTarget = 0;
    influence = active.name === 'hero' ? influence : 0.8;
    // Measured first: the camera is worked out from the host's size.
    measure();
    const goal = scrollState(active);
    tiltNow = goal.tilt;
    zoomNow = goal.zoom;
    riseNow = goal.rise;
    play();
};

const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !active) return;
    const x = event.clientX;
    const y = event.clientY + window.scrollY - active.pageTop;
    if (x < 0 || y < 0 || x > active.width || y > active.height) {
        followTarget = 0;
        return;
    }
    pointer.toX = x;
    pointer.toY = y;
    followTarget = 1;
};

const onPointerLeave = () => {
    followTarget = 0;
};

const makeCanvas = () => {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    // No multisampling: without a GPU it cost a third of the frame rate. The
    // renderer smooths its own edges instead.
    renderer = createRenderer(canvas, {
        onRestored: () => {
            width = 0;
            restart();
        },
    });
};

const setUp = () => {
    if (setup) return;
    setup = true;
    afterPaint(() => {
        makeCanvas();
        if (!renderer) {
            markFieldBuilt();
            return;
        }
        hosts.forEach((host) => {
            if (host.element.parentElement)
                host.element.parentElement.dataset.field = '';
        });
        readColours();
        new MutationObserver(() => {
            readColours();
            if (holdStill()) play();
        }).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        window.addEventListener('resize', restart);
        document.addEventListener('visibilitychange', () =>
            document.hidden ? stop() : play(),
        );
        if (window.matchMedia('(pointer: fine)').matches) {
            window.addEventListener('pointermove', onPointerMove, {
                passive: true,
            });
            document.documentElement.addEventListener(
                'pointerleave',
                onPointerLeave,
            );
        }
        choose();
    });
};

export const setFieldSettings = (next: FieldSettings) => {
    settings = next;
    if (holdStill()) play();
};

export const attachField = (name: ScrimName, element: HTMLElement) => {
    const host: Host = {
        name,
        element,
        visible: false,
        pageTop: 0,
        width: 0,
        height: 0,
        cube: hosts.get(name)?.cube ?? null,
    };
    hosts.set(name, host);
    if (renderer && element.parentElement)
        element.parentElement.dataset.field = '';
    const observer = new IntersectionObserver(
        ([entry]) => {
            host.visible = entry.isIntersecting;
            setUp();
            choose();
        },
        { rootMargin: AHEAD },
    );
    observer.observe(element);
    const resizes = new ResizeObserver(() => {
        if (active === host) measure();
    });
    resizes.observe(element);
    return () => {
        observer.disconnect();
        resizes.disconnect();
        host.visible = false;
        hosts.delete(name);
        choose();
    };
};

export const attachCube = (
    name: ScrimName,
    slot: HTMLElement,
    hit: HTMLElement,
    onTap: () => void,
) => {
    const cube: CubeSlot = { slot, x: 0, y: 0, edge: 0 };
    const host = hosts.get(name);
    if (host) {
        host.cube = cube;
        if (active === host) measureCube(host);
    }
    const resizes = new ResizeObserver(() => {
        const current = hosts.get(name);
        if (current && active === current) measureCube(current);
    });
    resizes.observe(slot);
    const detachInput = attachCubeInput(hit, rig().spin, {
        reduced: reducedMotion(),
        // Only a click on the cube itself opens it, not on the empty slot around it.
        onTap: (x, y) => {
            const box = slot.getBoundingClientRect();
            const off = Math.hypot(
                x - (box.left + box.width / 2),
                y - (box.top + box.height / 2),
            );
            if (off < box.width * EDGE * 0.9) onTap();
        },
        onChange: () => {
            if (holdStill()) play();
        },
    });
    return () => {
        resizes.disconnect();
        detachInput();
        const current = hosts.get(name);
        if (current) current.cube = null;
    };
};

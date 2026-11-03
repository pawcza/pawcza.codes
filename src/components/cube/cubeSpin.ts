import {
    Quat,
    Vec3,
    cross,
    dot,
    length,
    quatFromAxisAngle,
    quatFromEuler,
    quatInverse,
    quatMultiply,
    quatNormalize,
    rotate,
} from '@/components/field/math';

/** World up: the field lies flat, so its depth axis is what a floating cube rights itself to. */
const UP: Vec3 = [0, 0, 1];

/** Where it starts: a three-quarter view, two sides and the top. */
const BASE_POSE = quatFromEuler(1.05, -0.66);

const PULL_MAX = 2.4; // rad: as far as the band lets it go, ~140 degrees
const SLING = 45; // how hard the band snaps back
const SPIN_DOWN = 1.4; // s: how long a hard launch coasts
const FRICTION = 4; // rad/s², what stops a gentle one
const MAX_SPIN = 16; // rad/s, about 2.5 turns a second
const K = 0.011; // radians per pixel of drag
const IDLE_SPIN = 0.3; // rad/s, about the upright
const SPRING = 7; // how hard it rights itself
const SPRING_DAMP = 0.45; // s: how quickly the wobble dies away

const scaled = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
const added = (a: Vec3, b: Vec3, k = 1): Vec3 => [
    a[0] + b[0] * k,
    a[1] + b[1] * k,
    a[2] + b[2] * k,
];

/**
 * A slingshot. Grabbing it holds it where it is (the anchor); dragging pulls
 * it round against a band that stiffens the further it goes (PULL_MAX). Let go
 * and the band snaps it back towards the anchor, harder the further it was
 * pulled (SLING), and it shoots on through with that speed: from there it
 * flies free, slowing like a flywheel (SPIN_DOWN) until it springs upright
 * into its idle turn. It never spins faster than MAX_SPIN.
 */
export const createCubeSpin = (float: boolean, reduced: boolean) => {
    let orientation: Quat = [...BASE_POSE];
    let omega: Vec3 = [0, 0, 0]; // angular velocity, world, rad/s
    let mode: 'free' | 'held' | 'launch' = 'free';
    let anchor: Quat = [...BASE_POSE];
    // How far the finger has pulled, as a rotation vector, before the band's give.
    let pulled: Vec3 = [0, 0, 0];
    // The axis of the cube that points straight up in its resting pose.
    const upright = rotate(quatInverse(BASE_POSE), UP);

    const ease = (dt: number, tau: number) =>
        reduced ? 1 : 1 - Math.exp(-dt / tau);

    return {
        orientation: () => orientation,

        /** Caught: held still where it is, the anchor of the pull. */
        catch: () => {
            mode = 'held';
            omega = [0, 0, 0];
            anchor = orientation;
            pulled = [0, 0, 0];
        },

        pull: (dx: number, dy: number) => {
            // Screen right turns it about screen up, screen down about screen right.
            pulled = [pulled[0] + dy * K, pulled[1], pulled[2] + dx * K];
        },

        launch: () => {
            mode = 'launch';
        },

        drop: () => {
            mode = 'free';
        },

        step: (dt: number) => {
            if (mode === 'held') {
                const reach = length(pulled);
                const give = PULL_MAX * (1 - Math.exp(-reach / PULL_MAX));
                if (reach > 1e-6) {
                    orientation = quatMultiply(
                        quatFromAxisAngle(scaled(pulled, 1 / reach), give),
                        anchor,
                    );
                }
            } else if (mode === 'launch') {
                // The band pulls it back towards the anchor; once it is
                // through (moving away again), it flies.
                let back = quatMultiply(anchor, quatInverse(orientation));
                if (back[3] < 0)
                    back = [-back[0], -back[1], -back[2], -back[3]];
                const angle = 2 * Math.acos(Math.min(1, back[3]));
                const sine = Math.sqrt(Math.max(0, 1 - back[3] * back[3]));
                let toAnchor: Vec3 = [0, 0, 0];
                if (sine > 1e-6) {
                    toAnchor = scaled([back[0], back[1], back[2]], 1 / sine);
                    omega = added(omega, toAnchor, SLING * angle * dt);
                }
                if (angle < 0.02 || (sine > 1e-6 && dot(omega, toAnchor) < 0)) {
                    mode = 'free';
                }
            } else {
                const rest = float && !reduced ? IDLE_SPIN : 0;
                if (reduced) omega = [0, 0, 0];
                else {
                    // Steady friction stops a gentle launch within a fraction
                    // of a turn; air lets a hard one coast a while longer.
                    const idle: Vec3 = scaled(UP, rest);
                    const extra = added(omega, idle, -1);
                    const over = length(extra);
                    if (over > 1e-6) {
                        const next =
                            Math.max(0, over - FRICTION * dt) *
                            Math.exp(-dt / SPIN_DOWN);
                        omega = added(idle, extra, next / over);
                    }
                }
                // Slowed enough (under ~3 rad/s, fully under 1): spring upright.
                const speedNow = length(omega);
                const t = Math.min(1, Math.max(0, (speedNow - 1) / 2));
                const settled = 1 - t * t * (3 - 2 * t);
                if (float && !reduced && settled > 0) {
                    const up = rotate(orientation, upright);
                    const toUp = cross(up, UP);
                    const off = Math.atan2(length(toUp), dot(up, UP));
                    if (dot(toUp, toUp) > 1e-10) {
                        omega = added(
                            omega,
                            scaled(toUp, 1 / length(toUp)),
                            SPRING * off * settled * dt,
                        );
                    }
                    // Damp only the tipping, never the turn about the upright.
                    const tipping: Vec3 = [omega[0], omega[1], 0];
                    omega = added(
                        omega,
                        tipping,
                        -ease(dt, SPRING_DAMP) * settled,
                    );
                }
            }
            const speed = length(omega);
            if (speed > MAX_SPIN) omega = scaled(omega, MAX_SPIN / speed);
            const now = Math.min(speed, MAX_SPIN);
            if (mode !== 'held' && now > 1e-5) {
                orientation = quatNormalize(
                    quatMultiply(
                        quatFromAxisAngle(
                            scaled(omega, 1 / length(omega)),
                            now * dt,
                        ),
                        orientation,
                    ),
                );
            }
        },
    };
};

export type CubeSpin = ReturnType<typeof createCubeSpin>;

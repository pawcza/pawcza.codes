/** The little 3D maths the field needs: column-major 4×4s and [x,y,z,w] quaternions. */
export type Mat4 = Float32Array;
export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export const multiply = (a: Mat4, b: Mat4): Mat4 => {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
            out[col * 4 + row] = sum;
        }
    }
    return out;
};

export const perspective = (
    fov: number,
    aspect: number,
    near: number,
    far: number,
): Mat4 => {
    const t = 1 / Math.tan(fov / 2);
    return Float32Array.of(
        t / aspect,
        0,
        0,
        0,
        0,
        t,
        0,
        0,
        0,
        0,
        (far + near) / (near - far),
        -1,
        0,
        0,
        (2 * far * near) / (near - far),
        0,
    );
};

export const translation = (x: number, y: number, z: number): Mat4 =>
    Float32Array.of(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1);

export const rotationX = (angle: number): Mat4 => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return Float32Array.of(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
};

export const rotationY = (angle: number): Mat4 => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return Float32Array.of(c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1);
};

export const invert = (m: Mat4): Mat4 => {
    const [
        a00,
        a01,
        a02,
        a03,
        a10,
        a11,
        a12,
        a13,
        a20,
        a21,
        a22,
        a23,
        a30,
        a31,
        a32,
        a33,
    ] = m;
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const d =
        1 /
        (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
    return Float32Array.of(
        (a11 * b11 - a12 * b10 + a13 * b09) * d,
        (a02 * b10 - a01 * b11 - a03 * b09) * d,
        (a31 * b05 - a32 * b04 + a33 * b03) * d,
        (a22 * b04 - a21 * b05 - a23 * b03) * d,
        (a12 * b08 - a10 * b11 - a13 * b07) * d,
        (a00 * b11 - a02 * b08 + a03 * b07) * d,
        (a32 * b02 - a30 * b05 - a33 * b01) * d,
        (a20 * b05 - a22 * b02 + a23 * b01) * d,
        (a10 * b10 - a11 * b08 + a13 * b06) * d,
        (a01 * b08 - a00 * b10 - a03 * b06) * d,
        (a30 * b04 - a31 * b02 + a33 * b00) * d,
        (a21 * b02 - a20 * b04 - a23 * b00) * d,
        (a11 * b07 - a10 * b09 - a12 * b06) * d,
        (a00 * b09 - a01 * b07 + a02 * b06) * d,
        (a31 * b01 - a30 * b03 - a32 * b00) * d,
        (a20 * b03 - a21 * b01 + a22 * b00) * d,
    );
};

/** Transforms a point, with the perspective divide. */
export const project = (m: Mat4, x: number, y: number, z: number): Vec3 => {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [
        (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
        (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
        (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
    ];
};

/** Where the ray through a point on screen (in clip space) meets the plane at `z`. */
export const onPlane = (
    inverse: Mat4,
    clipX: number,
    clipY: number,
    z: number,
): Vec3 => {
    const near = project(inverse, clipX, clipY, -1);
    const far = project(inverse, clipX, clipY, 1);
    const t = (z - near[2]) / (far[2] - near[2]);
    return [
        near[0] + (far[0] - near[0]) * t,
        near[1] + (far[1] - near[1]) * t,
        z,
    ];
};

export const length = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);

export const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
];

export const dot = (a: Vec3, b: Vec3) =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const quatMultiply = (a: Quat, b: Quat): Quat => [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export const quatInverse = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];

export const quatFromAxisAngle = (axis: Vec3, angle: number): Quat => {
    const s = Math.sin(angle / 2);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
};

export const quatFromEuler = (x: number, y: number): Quat =>
    quatMultiply(
        quatFromAxisAngle([1, 0, 0], x),
        quatFromAxisAngle([0, 1, 0], y),
    );

export const quatNormalize = (q: Quat): Quat => {
    const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
};

export const rotate = (q: Quat, v: Vec3): Vec3 => {
    const u: Vec3 = [q[0], q[1], q[2]];
    const t = cross(u, v).map((c) => c * 2) as Vec3;
    const c = cross(u, t);
    return [
        v[0] + q[3] * t[0] + c[0],
        v[1] + q[3] * t[1] + c[1],
        v[2] + q[3] * t[2] + c[2],
    ];
};

/** Rotation, uniform scale and position, as a matrix. */
export const compose = (
    q: Quat,
    scale: number,
    x: number,
    y: number,
    z: number,
): Mat4 => {
    const [a, b, c] = [
        rotate(q, [1, 0, 0]),
        rotate(q, [0, 1, 0]),
        rotate(q, [0, 0, 1]),
    ];
    return Float32Array.of(
        a[0] * scale,
        a[1] * scale,
        a[2] * scale,
        0,
        b[0] * scale,
        b[1] * scale,
        b[2] * scale,
        0,
        c[0] * scale,
        c[1] * scale,
        c[2] * scale,
        0,
        x,
        y,
        z,
        1,
    );
};

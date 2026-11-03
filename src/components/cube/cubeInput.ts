import type { CubeSpin } from '@/components/cube/cubeSpin';

/** Drag to spin, let go to throw, a click to tap: the pointer, for any cube. */
export const attachCubeInput = (
    hit: HTMLElement,
    spin: CubeSpin,
    {
        reduced,
        onTap,
        onPinch,
        onChange,
    }: {
        reduced: boolean;
        onTap: (x: number, y: number) => void;
        /** Fired with the distance between two fingers, 0 when they part. */
        onPinch?: (span: number) => void;
        /** Something moved, for anything not drawing continuously. */
        onChange?: () => void;
    },
) => {
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;

    const onDown = (event: PointerEvent) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        hit.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 1) {
            moved = 0;
            spin.catch();
        }
        if (pointers.size === 2) moved = Infinity; // a pinch is never a click
    };

    const onMove = (event: PointerEvent) => {
        const previous = pointers.get(event.pointerId);
        if (!previous) return;
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;
        previous.x = event.clientX;
        previous.y = event.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            onPinch?.(Math.hypot(a.x - b.x, a.y - b.y));
            return;
        }
        spin.pull(dx, dy);
        onChange?.();
    };

    const onUp = (event: PointerEvent) => {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) onPinch?.(0);
        if (pointers.size > 0) return;
        // Barely moved: that was a click, on the cube or beside it.
        if (event.type === 'pointerup' && moved < 6) {
            spin.drop();
            onTap(event.clientX, event.clientY);
            return;
        }
        // Pulled: let fly (under reduced motion, it just stays put).
        if (reduced || moved === Infinity) spin.drop();
        else spin.launch();
        onChange?.();
    };

    hit.addEventListener('pointerdown', onDown);
    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerup', onUp);
    hit.addEventListener('pointercancel', onUp);
    return () => {
        hit.removeEventListener('pointerdown', onDown);
        hit.removeEventListener('pointermove', onMove);
        hit.removeEventListener('pointerup', onUp);
        hit.removeEventListener('pointercancel', onUp);
    };
};

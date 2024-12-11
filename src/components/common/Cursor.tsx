'use client';

import React, { useEffect, useState } from 'react';

const Cursor: React.FC = () => {
    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    const [pos, setPos] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });

    const onMouseMove = (event: MouseEvent) => {
        setPos({ top: event.clientY, left: event.clientX });
    };

    return (
        <div
            style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
            }}
            className="w-24 h-24 fixed rotate-45 pointer-events-none mix-blend-difference -translate-x-1/2 bg-white -translate-y-1/2 z-50"
        />
    );
};

export default Cursor;

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import Sidebar from './Sidebar';
import { config, gradients, Gradients, TilesConfig } from './config';

interface TilesProps {
    children: React.ReactNode[] | React.ReactNode;
}

export interface Tiles {
    gradientName: keyof Gradients;
    columns: number;
    rows: number;
    size: number;
    pattern: TilesConfig['pattern'];
}

const Tiles: React.FC<TilesProps> = ({ children }) => {
    const pathname = usePathname();

    const [tiles, setTiles] = useState<Tiles>({
        columns: 0,
        rows: 0,
        size: config.size,
        pattern: config.pattern,
        gradientName: Object.keys(gradients)[
            Math.floor(Math.random() * Object.keys(gradients).length)
        ] as keyof Gradients,
    });

    const [prevClosestTile, setPrevClosestTile] = useState({ row: 0, col: 0 });
    const [flipped, setFlipped] = useState([] as string[]);
    const [time, setTime] = useState(0);

    const prevPathnameRef = useRef(pathname);
    const tilesRef = useRef(tiles);

    // Update the ref whenever values change so that event listeners get updated data
    useEffect(() => {
        tilesRef.current = tiles;
    }, [tiles]);

    // Calculate time for 60 FPS
    useEffect(() => {
        const interval = setInterval(() => {
            setTime((prevTime) => prevTime + 1);
        }, 1000 / 60); // 60 FPS

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Change a gradient whenever route changes
    useEffect(() => {
        if (prevPathnameRef.current !== pathname) {
            setTiles((prev) => ({
                ...prev,
                gradientName: getRandomGradientName(),
            }));
            prevPathnameRef.current = pathname;
        }
    }, [pathname]);

    // Update tiles when values are updated externally (sidebar)
    useEffect(() => {
        updateTiles();
    }, [tiles.size]);

    useEffect(() => {
        updateTiles();

        window.addEventListener('resize', updateTiles);
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            window.removeEventListener('resize', updateTiles);
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, []);

    const updateTiles = () => {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const baseSize = 60 / tilesRef.current.size;

        let columns, rows;

        if (aspectRatio > 1) {
            // Landscape
            columns = Math.floor(window.innerWidth / baseSize);
            rows = Math.floor(columns / aspectRatio);
        } else {
            // Portrait
            rows = Math.floor(window.innerHeight / baseSize);
            columns = Math.floor(rows * aspectRatio);
        }

        setTiles((prev) => ({
            ...prev,
            columns,
            rows,
        }));
    };

    const getRandomGradientName = () => {
        const gradientNames = Object.keys(gradients).filter(
            (key) => key !== tiles?.gradientName,
        );
        const randomKey: keyof typeof gradients = gradientNames[
            Math.floor(Math.random() * gradientNames.length)
        ] as keyof typeof gradients;
        return randomKey;
    };

    const onMouseMove = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        const { columns, rows } = tilesRef.current;
        const tileWidth = window.innerWidth / columns;
        const tileHeight = window.innerHeight / rows;

        let closestTile = { row: 0, col: 0 };
        let minDistance = Infinity;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const tileCenterX = col * tileWidth + tileWidth / 2;
                const tileCenterY = row * tileHeight + tileHeight / 2;
                const distance = Math.sqrt(
                    Math.pow(clientX - tileCenterX, 2) +
                        Math.pow(clientY - tileCenterY, 2),
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closestTile = { row, col };
                }
            }
        }

        if (
            closestTile.row !== prevClosestTile.row ||
            closestTile.col !== prevClosestTile.col
        ) {
            flip(closestTile.col, closestTile.row);
            setPrevClosestTile(closestTile);
        }
    };

    const calculateColorIndex = (
        i: number,
        j: number,
        time: number,
    ): number => {
        const { waveFrequency, waveAmplitude, secondaryFrequency, waveSpeed } =
            tiles.pattern;

        const waveValue = Math.sin(
            waveFrequency * j +
                waveAmplitude * Math.sin(secondaryFrequency * i) +
                -time * waveSpeed,
        );

        const normalizedWaveValue = (waveValue + 1) / 2;

        const colorIndex = Math.round(
            normalizedWaveValue * (gradients[tiles.gradientName].length - 1),
        );

        return colorIndex;
    };

    const flip = (row: number, col: number) => {
        setFlipped([]);

        const copy = new Set();

        const addTile = (r: number, c: number) => {
            const tile = `${r}-${c}`;
            if (!copy.has(tile)) copy.add(tile);
        };

        addTile(row, col);

        addTile(row - 1, col);
        addTile(row + 1, col);
        addTile(row, col - 1);
        addTile(row, col + 1);
        addTile(row - 1, col - 1);
        addTile(row + 1, col + 1);
        addTile(row - 1, col + 1);
        addTile(row + 1, col - 1);
        addTile(row - 2, col);
        addTile(row + 2, col);
        addTile(row, col - 2);
        addTile(row, col + 2);

        setFlipped(Array.from(copy) as string[]);
    };

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-screen flex flex-col z-0 overflow-hidden">
                {Array.from({ length: tiles.rows }).map((_, col) => (
                    <div
                        key={col}
                        className="flex"
                        style={{ height: `${100 / tiles.rows}%` }}
                    >
                        {Array.from({ length: tiles.columns }).map((_, row) => (
                            <div
                                key={row}
                                className={`
                                        transition-all
                                        duration-500
                                        h-full
                                        relative
                                        after:content-['']
                                        after:block
                                        after:absolute
                                        after:w-full
                                        after:h-full
                                        after:z-0
                                        after:transition-[outline-color]
                                        after:duration-200
                                        after:left-0
                                        after:top-0
                                        after:outline-2
                                        after:-outline-offset-8
                                        after:outline
                                        ${flipped.includes(`${row}-${col}`) ? 'after:outline-foreground after:scale-75 after:bg-background after:rounded-xl' : 'after:outline-transparent'}
                                    `}
                                style={{
                                    width: `${100 / tiles.columns}%`,
                                    backgroundColor:
                                        gradients[tiles.gradientName][
                                            calculateColorIndex(row, col, time)
                                        ],
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <Sidebar tiles={tiles} setTiles={setTiles} />
            <div className="h-full relative z-10 pt-24 container mx-auto">
                {children}
            </div>
        </>
    );
};

export default Tiles;

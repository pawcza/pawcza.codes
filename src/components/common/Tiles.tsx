'use client';

import React, {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';

interface TilesProps {
	children: React.ReactNode[] | React.ReactNode;
}

interface TilesConfig<Colors> {
	columns: number;
	rows: number;
	color: Colors;
}

const Tiles: React.FC<TilesProps> = ({children}) => {
	const size = 2;
	const pathname = usePathname();
	const [prevClosestTile, setPrevClosestTile] = useState({row: 0, col: 0});
	const [flipped, setFlipped] = useState([] as string[]);
	const [time, setTime] = useState(0);
	const colorsConfig = {
		calming: [
			'#f6eeab',
			'#c9dd94',
			'#9dcf94',
			'#7ec796',
			'#5ebd96',
			'#11a797',
		],
		pinotNoir: [
			'#4b6cb7',
			'#405eaa',
			'#35509d',
			'#2a438f',
			'#1f3582',
			'#182848',
		],
		influenza: ['#C04848', '#9e3f3f', '#7c3636', '#5a2d2d', '#381414'],
		moonrise: ['#DAE2F8', '#cbd7f1', '#bccbf0', '#adc7f0', '#9eb2ef'],
		titanium: ['#283048', '#3a475b', '#4c5b6f', '#5e6f83', '#70838f'],
		purpleParadise: ['#1D2B64', '#3a3f77', '#57638a', '#74879d', '#93abc0'],
	};

	const [tilesConfig, setTilesConfig] = useState<
		TilesConfig<keyof typeof colorsConfig>
	>({
		columns: 0,
		rows: 0,
		color: Object.keys(colorsConfig)[
			Math.floor(Math.random() * Object.keys(colorsConfig).length)
			] as keyof typeof colorsConfig,
	});

	const tilesConfigRef = useRef(tilesConfig);

	useEffect(() => {
		const interval = setInterval(() => {
			setTime((prevTime) => prevTime + 1);
		}, 1000 / 60); // 60 FPS

		return () => {
			clearInterval(interval);
		};
	}, []);

	useEffect(() => {
		tilesConfigRef.current = tilesConfig;
	}, [tilesConfig]);

	useEffect(() => {
		setTilesConfig((prev) => ({
			...prev,
			color: getRandomColorName(),
		}));
	}, [pathname]);

	useEffect(() => {
		setTilesConfig((prev) => ({
			...prev,
			columns: Math.floor(window.innerWidth / (60 / size)),
			rows: Math.floor(window.innerHeight / (60 / size)),
		}));

		document.addEventListener('mousemove', onMouseMove);
		window.addEventListener('resize', onResize);

		return () => {
			document.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('resize', onResize);
		};
	}, []);

	const getRandomColorName = () => {
		// Ensure the new color is different from the current color
		const colorKeys = Object.keys(colorsConfig).filter(
			(key) => key !== tilesConfig?.color,
		);
		// Select a random color name
		const randomKey: keyof typeof colorsConfig = colorKeys[
			Math.floor(Math.random() * colorKeys.length)
			] as keyof typeof colorsConfig;
		return randomKey;
	};

	const onResize = () => {
		setPrevClosestTile({row: 0, col: 0});
		setTilesConfig((prev) => ({
			...prev,
			columns: Math.floor(window.innerWidth / (60 / size)),
			rows: Math.floor(window.innerHeight / (60 / size)),
		}));
	};

	const onMouseMove = (event: MouseEvent) => {
		const {clientX, clientY} = event;
		const {columns, rows} = tilesConfigRef.current;
		const tileWidth = window.innerWidth / columns;
		const tileHeight = window.innerHeight / rows;

		let closestTile = {row: 0, col: 0};
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
					closestTile = {row, col};
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
		const waveFrequency = 0.5; // Adjust this value to change the wave frequency
		const waveAmplitude = 1.5; // Amplitude of the secondary wave
		const secondaryFrequency = 0.2; // Frequency for the wavy effect
		const waveSpeed = 0.005; // Speed of the wave animation

		// Add time to the sine wave for horizontal animation
		const waveValue = Math.sin(
			waveFrequency * j +
			waveAmplitude * Math.sin(secondaryFrequency * i) +
			-time * waveSpeed,
		);

		// Normalize to range [0, 1]
		const normalizedWaveValue = (waveValue + 1) / 2;

		// Map to the color index
		const colorIndex = Math.round(
			normalizedWaveValue * (colorsConfig[tilesConfig.color].length - 1),
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

		// Diamond effect
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

		// 'X' marker
		// addTile(row - 1, col - 1);
		// addTile(row + 1, col + 1);
		// addTile(row - 1, col + 1);
		// addTile(row + 1, col - 1);
		// addTile(row - 2, col - 2);
		// addTile(row + 2, col + 2);
		// addTile(row - 2, col + 2);
		// addTile(row + 2, col - 2);
		// addTile(row - 3, col - 3);
		// addTile(row + 3, col + 3);
		// addTile(row - 3, col + 3);
		// addTile(row + 3, col - 3);

		setFlipped(Array.from(copy) as string[]);
	};

	return (
		<>
			<div className="fixed top-0 left-0 w-full h-screen flex flex-col z-0 overflow-hidden">
				{Array.from({length: tilesConfig.rows}).map((_, col) => (
					<div
						key={col}
						className="flex"
						style={{height: `${100 / tilesConfig.rows}%`}}
					>
						{Array.from({length: tilesConfig.columns}).map(
							(_, row) => (
								<div
									key={row}
									className={`
                                        transition-all
                                        duration-500
                                        will-change-auto
                                        h-full
                                        ${flipped.includes(`${row}-${col}`) ? 'opacity-75' : ''}
                                    `}
									style={{
										width: `${100 / tilesConfig.columns}%`,
										boxShadow: flipped.includes(
											`${row}-${col}`,
										)
											? // ? '0 0 10px 0 rgba(0, 0, 0, 0.5)'
											'none'
											: 'none',
										backgroundColor:
											colorsConfig[tilesConfig.color][
												calculateColorIndex(
													row,
													col,
													time,
												)
												],
									}}
								/>
							),
						)}
					</div>
				))}
			</div>
			<div className="h-full relative z-10 pt-24 container mx-auto">
				{children}
			</div>
		</>
	);
};

export default Tiles;

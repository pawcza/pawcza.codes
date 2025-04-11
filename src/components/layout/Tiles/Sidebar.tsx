import IconLink from '@/components/common/IconLink';
import Settings from '@mui/icons-material/Settings';
import Close from '@mui/icons-material/Close';
import Restore from '@mui/icons-material/Restore';

import { Gradients, gradients } from '@/components/layout/Tiles/config';
import { Tiles } from '@/components/layout/Tiles';
import { config } from '@/components/layout/Tiles/config';

import React, { useEffect, useState } from 'react';

const Sidebar: React.FC<{
    tiles: Tiles;
    setTiles: React.Dispatch<React.SetStateAction<Tiles>>;
}> = ({ tiles, setTiles }) => {
    const [open, setOpen] = useState(false);
    const [changes, setChanges] = useState(false);

    useEffect(() => {
        document.addEventListener('click', handleOutsideClick);

        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    const handleOutsideClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (target.closest('#tiles-sidebar')) return;

        setOpen(false);
    };

    const handleChange = (changes: React.SetStateAction<Tiles>) => {
        setChanges(true);
        setTiles(changes);
    };

    const resetChanges = () => {
        setChanges(false);
        setTiles((prev: Tiles) => ({
            ...prev,
            size: config.size,
            pattern: config.pattern,
        }));
    };

    const Title = ({ children }: { children: React.ReactNode }) => (
        <span className="my-2 font-semibold text-xl px-4">{children}</span>
    );

    return (
        <div id="tiles-sidebar">
            <div className="fixed right-2 top-2 z-50">
                <IconLink
                    onClick={() => setOpen((prev) => !prev)}
                    MuiIcon={Settings}
                    inverted
                />
            </div>
            <div
                className={`flex flex-col fixed transition-transform will-change-transform h-full bg-background py-2 z-50 right-0 border-l border-l-foreground ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex gap-2 justify-end px-2">
                    <IconLink
                        inverted
                        onClick={resetChanges}
                        MuiIcon={Restore}
                        disabled={!changes}
                    />
                    <IconLink
                        onClick={() => setOpen((prev) => !prev)}
                        MuiIcon={Close}
                        inverted
                    />
                </div>
                <Title>Gradients</Title>
                <div className="flex flex-col max-h-72 overflow-y-scroll border-t-2 border-b-2 border-foreground">
                    {Object.keys(gradients).map((color) => {
                        const typedColor = color as keyof Gradients;
                        const colors = gradients[typedColor];
                        const isSelected = tiles.gradientName === typedColor;

                        return (
                            <button
                                key={color}
                                className={`hover:outline-foreground flex flex-col p-4 ${isSelected ? 'cursor-default bg-foreground text-background' : ''}`}
                                onClick={() =>
                                    setTiles((prev: Tiles) => ({
                                        ...prev,
                                        gradientName: color as keyof Gradients,
                                    }))
                                }
                            >
                                <div className="flex overflow-hidden rounded-lg border border-foreground">
                                    {colors.map((color) => (
                                        <div
                                            key={color}
                                            className="w-full h-6"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <span className="text-left">{color}</span>
                            </button>
                        );
                    })}
                </div>
                <Title>Size</Title>
                <div className="px-4 py-2">
                    <input
                        type="range"
                        min="100"
                        max="200"
                        value={tiles.size * 100}
                        onChange={(e) =>
                            handleChange((prev) => ({
                                ...prev,
                                size: parseInt(e.target.value, 10) / 100,
                            }))
                        }
                    />
                </div>
                <Title>Pattern</Title>
                <div className="flex flex-col gap-2 px-4 py-2">
                    <span>Wave Frequency</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={tiles.pattern.waveFrequency}
                        onChange={(e) =>
                            handleChange((prev) => ({
                                ...prev,
                                pattern: {
                                    ...prev.pattern,
                                    waveFrequency: parseFloat(e.target.value),
                                },
                            }))
                        }
                    />
                    <span>Wave Amplitude</span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={tiles.pattern.waveAmplitude}
                        onChange={(e) =>
                            handleChange((prev) => ({
                                ...prev,
                                pattern: {
                                    ...prev.pattern,
                                    waveAmplitude: parseFloat(e.target.value),
                                },
                            }))
                        }
                    />
                    <span>Secondary Frequency</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={tiles.pattern.secondaryFrequency}
                        onChange={(e) =>
                            handleChange((prev) => ({
                                ...prev,
                                pattern: {
                                    ...prev.pattern,
                                    secondaryFrequency: parseFloat(
                                        e.target.value,
                                    ),
                                },
                            }))
                        }
                    />
                    <span>Wave Speed</span>
                    <input
                        type="range"
                        min="0"
                        max="0.01"
                        step="0.0001"
                        value={tiles.pattern.waveSpeed}
                        onChange={(e) =>
                            handleChange((prev) => ({
                                ...prev,
                                pattern: {
                                    ...prev.pattern,
                                    waveSpeed: parseFloat(e.target.value),
                                },
                            }))
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

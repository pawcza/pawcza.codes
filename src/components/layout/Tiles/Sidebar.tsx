import { AnimatePresence, motion } from 'motion/react';

import IconLink from '@/components/common/IconLink';
import Settings from '@mui/icons-material/Settings';
import Close from '@mui/icons-material/Close';
import Restore from '@mui/icons-material/Restore';

import { Gradients, gradients } from '@/components/layout/Tiles/config';
import { Tiles } from '@/components/layout/Tiles';
import { config } from '@/components/layout/Tiles/config';
import { Range } from '@/components/common/inputs/Range';

import React, { useRef, useState } from 'react';
import { useOutsideClick } from '@/hooks/useOutsideClick';

const Sidebar: React.FC<{
    tiles: Tiles;
    setTiles: React.Dispatch<React.SetStateAction<Tiles>>;
}> = ({ tiles, setTiles }) => {
    const gradientsRef =
        useRef() as React.MutableRefObject<HTMLDivElement | null>;

    const [open, setOpen] = useState(false);
    const [changes, setChanges] = useState(false);

    const sidebarRef =
        useRef() as React.MutableRefObject<HTMLDivElement | null>;

    useOutsideClick(sidebarRef, () => setOpen(false));

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
        <>
            {!open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed right-2 top-2 z-50"
                >
                    <IconLink
                        onClick={() => setOpen((prev) => !prev)}
                        MuiIcon={Settings}
                        inverted
                    />
                </motion.div>
            )}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        ref={sidebarRef}
                        className={`fixed flex flex-col h-full bg-background py-2 right-0 z-50 shadow-xl`}
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
                        <div
                            ref={gradientsRef}
                            className="flex flex-col max-h-72 overflow-y-scroll border-t-2 border-b-2 border-foreground"
                        >
                            {Object.keys(gradients).map((color) => {
                                const typedColor = color as keyof Gradients;
                                const colors = gradients[typedColor];
                                const isSelected =
                                    tiles.gradientName === typedColor;

                                return (
                                    <button
                                        key={color}
                                        className={`hover:outline-foreground flex flex-col p-4 ${isSelected ? 'cursor-default bg-foreground text-background' : ''}`}
                                        onClick={() =>
                                            setTiles((prev: Tiles) => ({
                                                ...prev,
                                                gradientName:
                                                    color as keyof Gradients,
                                            }))
                                        }
                                    >
                                        <div className="flex overflow-hidden border border-foreground">
                                            {colors.map((color) => (
                                                <div
                                                    key={color}
                                                    className="w-full h-6"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-left">
                                            {color}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <Title>Size</Title>
                        <div className="px-4 py-2">
                            <Range
                                min={1}
                                max={100}
                                step={1}
                                value={tiles.size * 100 - 100}
                                onChange={(value) =>
                                    handleChange((prev) => ({
                                        ...prev,
                                        size: (value + 100) / 100,
                                    }))
                                }
                            />
                        </div>
                        <Title>Pattern</Title>
                        <div className="flex flex-col gap-2 px-4 py-2">
                            <span>Wave Frequency</span>
                            <Range
                                min={0}
                                max={100}
                                step={1}
                                value={tiles.pattern.waveFrequency * 100}
                                onChange={(value) =>
                                    handleChange((prev) => ({
                                        ...prev,
                                        pattern: {
                                            ...prev.pattern,
                                            waveFrequency: value / 100,
                                        },
                                    }))
                                }
                            />
                            <span>Wave Amplitude</span>
                            <Range
                                min={0}
                                max={100}
                                step={1}
                                value={tiles.pattern.waveAmplitude * 50}
                                onChange={(value) =>
                                    handleChange((prev) => ({
                                        ...prev,
                                        pattern: {
                                            ...prev.pattern,
                                            waveAmplitude: value / 50,
                                        },
                                    }))
                                }
                            />
                            <span>Secondary Frequency</span>
                            <Range
                                min={0}
                                max={100}
                                step={1}
                                value={tiles.pattern.secondaryFrequency * 100}
                                onChange={(value) =>
                                    handleChange((prev) => ({
                                        ...prev,
                                        pattern: {
                                            ...prev.pattern,
                                            secondaryFrequency: value / 100,
                                        },
                                    }))
                                }
                            />
                            <span>Wave Speed</span>
                            <Range
                                min={0}
                                max={100}
                                step={1}
                                value={tiles.pattern.waveSpeed * 1000}
                                onChange={(value) =>
                                    handleChange((prev) => ({
                                        ...prev,
                                        pattern: {
                                            ...prev.pattern,
                                            waveSpeed: value / 1000,
                                        },
                                    }))
                                }
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useRef } from 'react';
import { useOutsideClick } from '@/hooks/useOutsideClick';

export const Popup = ({
    open,
    close,
    children,
}: {
    open: boolean;
    close: () => void;
    children: React.ReactNode;
}) => {
    const insideRef = useRef() as React.MutableRefObject<HTMLDivElement | null>;

    useOutsideClick(insideRef, () => close());

    // Prevent scrolling when the popup is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [open]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed bottom-0 left-0 right-0 z-50 flex h-screen w-screen justify-center items-center p-4 bg-[rgba(0,0,0,.25)] backdrop-blur-sm`}
                >
                    <motion.div
                        className="flex flex-col gap-4 max-w-screen-sm bg-background p-8 shadow-xl"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        ref={insideRef}
                    >
                        {children}
                    </motion.div>
                </motion.section>
            )}
        </AnimatePresence>,
        document.body,
    );
};

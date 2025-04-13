import React from 'react';

export const Container = ({ children }: { children: React.ReactNode[] }) => {
    return (
        <div
            className="container"
            style={{
                viewTransitionName: 'view-transition-container',
            }}
        >
            {children}
        </div>
    );
};

'use client';

import { WaveSettings, waveRanges } from '@/components/hero/tiles';

export const RangeSlider = ({
    label,
    description,
    min,
    max,
    step,
    value,
    onChange,
}: {
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
}) => {
    // Match the readout to the slider's precision: 0.05 steps reading "1.000"
    // implies a resolution the control does not have.
    const decimals = step >= 1 ? 0 : step >= 0.01 ? 2 : 3;

    return (
        <label className="block">
            <span className="flex items-baseline justify-between gap-3">
                <span className="eyebrow !text-ink-muted">{label}</span>
                <span className="font-mono text-micro tabular-nums text-ink-muted">
                    {value.toFixed(decimals)}
                </span>
            </span>
            <span className="mt-1 block text-micro leading-snug text-ink-faint">
                {description}
            </span>
            <input
                type="range"
                className="mt-2 w-full"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </label>
    );
};

export const Slider = ({
    settingKey,
    value,
    onChange,
}: {
    settingKey: keyof WaveSettings;
    value: number;
    onChange: (value: number) => void;
}) => {
    const { label, description, min, max, step } = waveRanges[settingKey];
    return (
        <RangeSlider
            label={label}
            description={description}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
        />
    );
};

export const Swatches = ({ colors }: { colors: readonly string[] }) => (
    <span className="flex h-full w-full">
        {colors.map((color, index) => (
            <span
                key={index}
                className="h-full flex-1"
                style={{ backgroundColor: color }}
            />
        ))}
    </span>
);

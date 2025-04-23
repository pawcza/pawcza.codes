export interface TilesConfig {
    size: number;
    pattern: {
        waveFrequency: number;
        waveAmplitude: number;
        secondaryFrequency: number;
        waveSpeed: number;
    };
}

export interface Gradients {
    calming: string[];
    pinotNoir: string[];
    influenza: string[];
    moonrise: string[];
    titanium: string[];
    purpleParadise: string[];
}

export const gradients: Gradients = {
    calming: ['#f6eeab', '#c9dd94', '#9dcf94', '#7ec796', '#5ebd96', '#11a797'],
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

export const config: TilesConfig = {
    size: 1.5,
    pattern: {
        waveFrequency: 0.5,
        waveAmplitude: 1.5,
        secondaryFrequency: 0.2,
        waveSpeed: 0.001,
    },
};

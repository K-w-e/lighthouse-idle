export interface Relic {
    id: string;
    name: string;
    description: string;
    cost: number;
    effectDescription: string;
}

export const RELICS: Relic[] = [
    {
        id: 'prism_of_greed',
        name: 'Prism of Greed',
        description: 'A cursed prism that refracts light into abundance, at a cost.',
        cost: 10,
        effectDescription: 'Enemies drop 300% Light but move 50% faster.',
    },
    {
        id: 'solar_sail',
        name: 'Solar Sail',
        description: 'Captures the raw essence of the sun.',
        cost: 20,
        effectDescription: 'Energy regenerates 2x faster. Max Health low, Regen high.',
    },
];

export const getRelicById = (id: string): Relic | undefined => {
    return RELICS.find((r) => r.id === id);
};

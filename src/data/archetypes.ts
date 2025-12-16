export enum ArchetypeID {
    NONE = 'none',
    CHRONOMANCER = 'chronomancer',
    STORMBRINGER = 'stormbringer',
    ARCHITECT = 'architect',
}

export interface Archetype {
    id: ArchetypeID;
    name: string;
    description: string;
    passiveDescription: string;
    activeAbilityDescription: string;
    cost: number;
}

export const ARCHETYPES: Record<ArchetypeID, Archetype> = {
    [ArchetypeID.NONE]: {
        id: ArchetypeID.NONE,
        name: 'The Keeper',
        description: 'A standard lighthouse keeper.',
        passiveDescription: 'None',
        activeAbilityDescription: 'None',
        cost: 0,
    },
    [ArchetypeID.CHRONOMANCER]: {
        id: ArchetypeID.CHRONOMANCER,
        name: 'The Chronomancer',
        description: 'Manipulates the flow of time to gain an advantage.',
        passiveDescription: 'Logic ticks 20% faster.',
        activeAbilityDescription: 'Light Surge: Temporarily expand light beam.',
        cost: 50,
    },
    [ArchetypeID.STORMBRINGER]: {
        id: ArchetypeID.STORMBRINGER,
        name: 'The Stormbringer',
        description: 'Harnesses the fury of the storm.',
        passiveDescription: 'Chance to strike enemies with lightning on spawn. (10%)',
        activeAbilityDescription: 'Overload: Massive screen-wide damage.',
        cost: 75,
    },
    [ArchetypeID.ARCHITECT]: {
        id: ArchetypeID.ARCHITECT,
        name: 'The Architect',
        description: 'Builder of impenetrable defenses.',
        passiveDescription: 'Chance to take 0 damage from waves. (10%)',
        activeAbilityDescription: 'Fortified Construct: Temporary invulnerability.',
        cost: 60,
    },
};

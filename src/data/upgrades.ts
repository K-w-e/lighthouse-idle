export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  costIncrease: number;
  value?: number;
}

export const upgrades: { [key: string]: Upgrade[] } = {
  offensive: [
    {
      id: 'beam_pierce',
      name: 'Beam Pierce',
      description: 'The light beam can pass through an additional enemy (+1).',
      cost: 10,
      costIncrease: 1.15,
      value: 1,
    }, {
      id: 'beam_length',
      name: 'Beam Length',
      description: 'Increases lenght of the beam (+10).',
      cost: 15,
      costIncrease: 1.15,
      value: 10,
    },
    {
      id: 'rotation_speed',
      name: 'Rotation Speed',
      description: 'Lighthouse spins faster (+0.2).',
      cost: 50,
      costIncrease: 1.3,
      value: 0.2,
    },
    {
      id: 'multi_lens',
      name: 'Additional-Lens',
      description: 'Adds an additional light beam.',
      cost: 2500,
      costIncrease: 3,
      value: 1,
    },
    {
      id: 'light_amplitude',
      name: 'Light Amplitude',
      description: 'Increases the width of the light beam (+5°).',
      cost: 100,
      costIncrease: 1.2,
      value: 5,
    },
    {
      id: 'chain_lightning',
      name: 'Chain Lightning',
      description: 'When the light beam destroys a wave, there is a chance it will chain to a nearby wave, destroying it as well (+5% chance).',
      cost: 2000,
      costIncrease: 1.5,
      value: 0.05,
    },
    {
      id: 'mega_bomb',
      name: 'Mega Bomb',
      description: 'Unleashes a powerful explosion, destroying all waves in a large radius. Can be activated once every 60 seconds.',
      cost: 10000,
      costIncrease: 1, // a single purchase
    },
  ],
  defensive: [
    {
      id: 'shield_core',
      name: 'Shield Core',
      description: "Increases the Shield's maximum HP (+10).",
      cost: 20,
      costIncrease: 1.2,
      value: 10,
    },
    {
      id: 'shield_capacitor',
      name: 'Shield Capacitor',
      description: "Increases the Shield's HP/sec regeneration (+1).",
      cost: 200,
      costIncrease: 1.3,
      value: 1,
    },
    {
      id: 'slowing_pulse',
      name: 'Slowing Pulse',
      description: 'Emits a pulse every 5 seconds that slows all waves on screen. Each upgrade increase slow effect.',
      cost: 1500,
      costIncrease: 1.5,
      value: 0.1,
    },
    {
      id: 'auto_builder',
      name: 'Auto-Builder',
      description: 'Passively repairs destroyed tiles very slowly.',
      cost: 1000,
      costIncrease: 1, // a single purchase
    },
    {
      id: 'island_reconstruction',
      name: 'Island Reconstruction',
      description: 'Fully repair the island.',
      cost: 1000,
      costIncrease: 2,
    },
    {
      id: 'island_expansion',
      name: 'Island Expansion',
      description: 'Expand the island radius (+20).',
      cost: 5000,
      costIncrease: 2,
      value: 20,
    },
    {
      id: 'island_fortification',
      name: 'Island Fortification',
      description: 'Increases the health of island tiles, making them more resistant to erosion (+10 HP).',
      cost: 500,
      costIncrease: 1.5,
      value: 10,
    },
  ],
  economic: [
    {
      id: 'core_crystal',
      name: 'Core Crystal',
      description: 'Increases the passive "Light" generated per second (+1).',
      cost: 25,
      costIncrease: 1.2,
      value: 1,
    },
    {
      id: 'wave_fragments',
      name: 'Wave Fragments',
      description: 'Increases "Light" granted for killing a wave (+1).',
      cost: 50,
      costIncrease: 1.5,
      value: 1,
    },
    {
      id: 'kinetic_siphon',
      name: 'Kinetic Siphon',
      description: 'Waves hitting the shield grant a small bonus "Light" (+0.5).',
      cost: 150,
      costIncrease: 1.5,
      value: 0.5,
    },
    {
      id: 'tidal_force',
      name: 'Tidal Force',
      description: 'Increases passive "Light" generation based on the number of active waves (+0.1).',
      cost: 1000,
      costIncrease: 1.8,
      value: 0.1,
    },
    {
      id: 'multiplier',
      name: 'Multiplier',
      description: 'Doubles all "Light" generation.',
      cost: 10000,
      costIncrease: 1, // a single purchase
      value: 2,
    },
    {
      id: 'auto_light_collector',
      name: 'Auto Light Collector',
      description: 'Passively collects light from waves (+1/sec).',
      cost: 500,
      costIncrease: 1.4,
      value: 1,
    },
    {
      id: 'light_interest',
      name: 'Light Interest',
      description: 'Passively generate "Light" based on a percentage of your current "Light" total (+0.1%).',
      cost: 5000,
      costIncrease: 2.5,
      value: 0.001,
    },
    {
      id: 'sale',
      name: 'Sale',
      description: 'Reduces the cost of all upgrades (-1%).',
      cost: 10000,
      costIncrease: 1.9,
      value: 0.01,
    },
    {
      id: 'time_warp',
      name: 'Time Warp',
      description: 'Speeds up time for 10 seconds, accelerating all processes. 2 minutes cooldown.',
      cost: 25000,
      costIncrease: 1, // a single purchase
    },
  ],
  energy: [
    {
      id: 'energy_capacity',
      name: 'Energy Capacity',
      description: 'Increases maximum energy storage (+20).',
      cost: 10,
      costIncrease: 1.2,
      value: 20,
    },
    {
      id: 'energy_efficiency',
      name: 'Energy Efficiency',
      description: 'Decreases energy drain rate (-0.05).',
      cost: 30,
      costIncrease: 1.3,
      value: 0.05,
    },
    {
      id: 'click_power',
      name: 'Click Power',
      description: 'Increases energy gained per click (+0.5).',
      cost: 15,
      costIncrease: 1.15,
      value: 0.5,
    },
    {
      id: 'auto_energy_collector',
      name: 'Auto Energy Collector',
      description: 'Passively generates energy over time (+1/sec).',
      cost: 250,
      costIncrease: 1.3,
      value: 1,
    },
    {
      id: 'overcharge',
      name: 'Overcharge',
      description: 'Gives a small chance to receive a large energy boost when clicking the lighthouse (+1% chance).',
      cost: 1000,
      costIncrease: 1.8,
      value: 0.01,
    },
    {
      id: 'energy_on_kill',
      name: 'Energy Siphon',
      description: 'Gain a small amount of energy for each wave destroyed (+0.1).',
      cost: 2000,
      costIncrease: 1.7,
      value: 0.1,
    },
  ],
};

export const getUpgradeById = (id: string): Upgrade | undefined => {
  for (const category of Object.values(upgrades)) {
    const found = category.find(u => u.id === id);
    if (found) {
      return found;
    }
  }
  return undefined;
};
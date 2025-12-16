import GameManager from '../GameManager';
import { ARCHETYPES, ArchetypeID } from '../data/archetypes';
import { RELICS, getRelicById } from '../data/relics';

class PrestigeManager {
    private static instance: PrestigeManager;

    private _aether: number = 0;
    private _unlockedRelics: string[] = [];
    private _activeRelics: string[] = [];
    private _activeArchetype: ArchetypeID = ArchetypeID.NONE;
    private _unlockedArchetypes: ArchetypeID[] = [ArchetypeID.NONE];

    private _totalLightEarnedThisRun: number = 0;
    private _highestWaveThisRun: number = 0;

    private constructor() {
        this.load();
    }

    public static getInstance(): PrestigeManager {
        if (!PrestigeManager.instance) {
            PrestigeManager.instance = new PrestigeManager();
        }
        return PrestigeManager.instance;
    }

    public get aether(): number {
        return this._aether;
    }

    public get activeArchetype(): ArchetypeID {
        return this._activeArchetype;
    }

    public get unlockedRelics(): string[] {
        return this._unlockedRelics;
    }

    public get activeRelics(): string[] {
        return this._activeRelics;
    }

    public get unlockedArchetypes(): ArchetypeID[] {
        return this._unlockedArchetypes;
    }

    public setArchetype(id: ArchetypeID) {
        if (this._unlockedArchetypes.includes(id)) {
            this._activeArchetype = id;
            this.save();
        }
    }

    public unlockArchetype(id: ArchetypeID): boolean {
        const archetype = ARCHETYPES[id];
        if (!archetype) return false;
        if (this._unlockedArchetypes.includes(id)) return true;

        if (this._aether >= archetype.cost) {
            this._aether -= archetype.cost;
            this._unlockedArchetypes.push(id);
            this.save();
            return true;
        }
        return false;
    }

    public unlockRelic(id: string): boolean {
        const relic = getRelicById(id);
        if (!relic) return false;
        if (this._unlockedRelics.includes(id)) return true; // Already unlocked

        if (this._aether >= relic.cost) {
            this._aether -= relic.cost;
            this._unlockedRelics.push(id);
            this.save();
            return true;
        }
        return false;
    }

    public toggleRelic(id: string): void {
        if (!this._unlockedRelics.includes(id)) return;

        const index = this._activeRelics.indexOf(id);
        if (index > -1) {
            this._activeRelics.splice(index, 1);
        } else {
            this._activeRelics.push(id);
        }
        this.save();
    }

    public calculatePotentialAether(): number {
        const lightGain = Math.floor(GameManager.getLight() / 1000);
        const waveGain = Math.floor(GameManager.waveNumber * 2);
        return Math.floor((lightGain + waveGain) * 1.0);
    }

    public prestige() {
        const aetherGain = this.calculatePotentialAether();
        this._aether += aetherGain;
        this.save();
        window.location.reload();
    }

    private save() {
        const data = {
            aether: this._aether,
            unlockedRelics: this._unlockedRelics,
            activeRelics: this._activeRelics,
            activeArchetype: this._activeArchetype,
            unlockedArchetypes: this._unlockedArchetypes,
        };
        localStorage.setItem('lighthouse_idle_prestige', JSON.stringify(data));
    }

    private load() {
        const stored = localStorage.getItem('lighthouse_idle_prestige');
        if (stored) {
            const data = JSON.parse(stored);
            this._aether = data.aether || 0;
            this._unlockedRelics = data.unlockedRelics || [];
            this._activeRelics = data.activeRelics || [];
            this._activeArchetype = data.activeArchetype || ArchetypeID.NONE;
            this._unlockedArchetypes = data.unlockedArchetypes || [ArchetypeID.NONE];
        }
    }

    public addAether(amount: number) {
        this._aether += amount;
        this.save();
    }
}

export default PrestigeManager.getInstance();

import GameManager from "../GameManager";
import { ArchetypeID } from "../data/archetypes";
import { RELICS, getRelicById } from "../data/relics";

class PrestigeManager {
    private static instance: PrestigeManager;

    private _aether: number = 0;
    private _unlockedRelics: string[] = [];
    private _activeArchetype: ArchetypeID = ArchetypeID.NONE;

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

    public setArchetype(id: ArchetypeID) {
        this._activeArchetype = id;
        this.save();
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
            activeArchetype: this._activeArchetype,
        };
        localStorage.setItem("lighthouse_idle_prestige", JSON.stringify(data));
    }

    private load() {
        const stored = localStorage.getItem("lighthouse_idle_prestige");
        if (stored) {
            const data = JSON.parse(stored);
            this._aether = data.aether || 0;
            this._unlockedRelics = data.unlockedRelics || [];
            this._activeArchetype = data.activeArchetype || ArchetypeID.NONE;
        }
    }

    public addAether(amount: number) {
        this._aether += amount;
        this.save();
    }
}

export default PrestigeManager.getInstance();

import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import { getUpgradeById, resetUpgradeCosts } from './data/upgrades';
import { Wave } from './object/Wave';
import PrestigeManager from './managers/PrestigeManager';
import { ArchetypeID } from './data/archetypes';

class GameManager {
    private static instance: GameManager;

    private gameScene!: GameScene;
    private uiScene!: UIScene;

    private purchasedUpgrades: Set<string> = new Set();
    private currentArchetypeEffect: ArchetypeID = ArchetypeID.NONE;

    // Offensive properties
    public lightRadius: number = 150;
    public lightAngle: number = 3;
    public rotationSpeed: number = 1;
    public beamPenetration: number = 1;
    public lightBeamCount: number = 1;
    public lighthousePulseRadius: number = 300;
    public lighthousePulseForce: number = 50;

    public hasSlowingPulse: boolean = false;
    public slowingPulseCooldown: number = 5000; // ms
    public slowingPulseTimer: number = 0;
    public slowingPulseSlowFactor: number = 0.1;
    public slowingPulseDuration: number = 1000; // ms

    public chainLightningChance: number = 0;

    // Energy properties
    public currentEnergy: number = 10;
    public maxEnergy: number = 10;
    public energyPerClick: number = 0.2;
    public energyDrainRate: number = 0.5;
    public autoEnergyCollectorRate: number = 0;
    public overchargeChance: number = 0;
    public energyOnKill: number = 0;

    // Defensive properties
    public lighthouseHealth: number = 100;
    public maxLighthouseHealth: number = 100;
    public lighthouseHealthRegen: number = 1;
    public tileHealth: number = 10;
    public beamDamage: number = 1;
    public hasAutoBuilder: boolean = false;
    private autoBuilderTimer: number = 0;
    public isInvulnerable: boolean = false;
    public invulnerableTimer: number = 0;
    public invulnerableDuration: number = 5000;
    public invulnerableCooldown: number = 60000;
    public invulnerableCooldownTimer: number = 0;

    // Economic properties
    private light: number = 100;
    public lightPerSecond: number = 0;
    public waveFragmentsModifier: number = 1;
    public kineticSiphonModifier: number = 0;
    public tidalForceModifier: number = 0;
    public lightMultiplier: number = 1;
    public autoLightCollectorRate: number = 0;
    public lightInterestRate: number = 0;
    public saleModifier: number = 1;

    // Active ability properties
    public hasMegaBomb: boolean = false;
    public megaBombCooldown: number = 60000; // ms
    public megaBombTimer: number = 0;

    public hasLightSurge: boolean = false;
    public lightSurgeCooldown: number = 90000; // ms
    public lightSurgeTimer: number = 0;
    public isLightSurgeActive: boolean = false;
    public lightSurgeDuration: number = 3000; // ms
    public lightSurgeDurationTimer: number = 0;
    private surgeAddedRadius: number = 0;
    private surgeAddedAngle: number = 0;
    public timeScale: number = 1;

    // Wave properties
    public waveNumber: number = 10;
    public waveTime: number = 30; // seconds
    public waveTimer: number = this.waveTime;
    public waveReward: number = 100;
    public waveState: 'in_wave' | 'waiting' = 'in_wave';
    public waveDelay: number = 10; // seconds

    public enemySpeedModifier: number = 1;
    public baseTimeScale: number = 1;

    private constructor() {}

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public initialize(gameScene: GameScene, uiScene: UIScene) {
        this.gameScene = gameScene;
        this.uiScene = uiScene;

        this.currentEnergy = this.maxEnergy;
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
        this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
        this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
        this.uiScene.setLight(this.light);

        this.recalculateStats();
        this.timeScale = this.baseTimeScale;
    }

    public update(delta: number) {
        this.currentEnergy -= this.energyDrainRate * (delta / 1000);
        this.currentEnergy = Math.max(0, this.currentEnergy);
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);

        if (this.hasAutoBuilder) {
            this.autoBuilderTimer += delta * this.timeScale;
            if (this.autoBuilderTimer >= 3000) {
                this.autoBuilderTimer = 0;
                this.gameScene.repairIsland();
            }
        }

        if (this.hasSlowingPulse) {
            this.slowingPulseTimer -= delta;
            if (this.slowingPulseTimer <= 0) {
                this.slowingPulseTimer = this.slowingPulseCooldown;
                this.gameScene.triggerSlowingPulse();
            }
        }

        if (this.hasMegaBomb) {
            this.megaBombTimer -= delta;
        }

        if (this.hasLightSurge) {
            this.lightSurgeTimer -= delta;
        }

        if (this.isLightSurgeActive) {
            this.lightSurgeDurationTimer -= delta;
            if (this.lightSurgeDurationTimer <= 0) {
                this.deactivateLightSurge();
            }
        }

        if (this.isInvulnerable) {
            this.invulnerableTimer -= delta;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
                this.gameScene.setInvulnerabilityEffect(false);
            }
        }
        if (this.invulnerableCooldownTimer > 0) {
            this.invulnerableCooldownTimer -= delta;
        }

        if (this.waveState === 'in_wave') {
            this.waveTimer -= delta / 1000;
            if (this.waveTimer <= 0) {
                this.endWave();
            }
            this.uiScene.updateWaveTimer(this.waveTimer, this.waveTime);
        } else if (this.waveState === 'waiting') {
            this.waveTimer -= delta / 1000;
            if (this.waveTimer <= 0) {
                this.startWave();
            }
            this.uiScene.updateWaveTimer(this.waveTimer, this.waveDelay);
        }

        this.lighthouseHealth = Math.min(
            this.maxLighthouseHealth,
            this.lighthouseHealth + this.lighthouseHealthRegen * (delta / 1000) * this.timeScale,
        );
        this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
    }

    private endWave() {
        this.waveState = 'waiting';
        this.waveNumber++;
        this.waveTimer = this.waveDelay;
        this.addLight(this.waveReward * this.waveNumber * this.lightMultiplier);
        this.uiScene.updateWaveNumber(this.waveNumber);
    }

    private startWave() {
        this.waveState = 'in_wave';
        this.waveNumber++;
        this.waveTimer = this.waveTime;
        this.gameScene.waveSpawnDelay = Math.max(100, this.gameScene.waveSpawnDelay - 100);
    }

    public applyUpgrade(type: string) {
        const upgrade = getUpgradeById(type);
        if (!upgrade) {
            return;
        }

        this.purchasedUpgrades.add(type);

        if (this.handleInstantUpgrade(type, upgrade.value || 0)) {
            return;
        }

        this.recalculateStats();
    }

    private handleInstantUpgrade(type: string, value: number): boolean {
        switch (type) {
            case 'island_reconstruction':
                this.gameScene.rebuildIsland();
                return true;
            case 'island_expansion':
                this.gameScene.expandIsland();
                return true;
            default:
                return false;
        }
    }

    public getWaveLightReward(wave: Wave): number {
        return Math.floor((wave.waveWidth / 10 + this.waveFragmentsModifier) * this.lightMultiplier);
    }

    public onWaveDestroyed(wave: Wave) {
        let lightToAdd = this.getWaveLightReward(wave);
        this.addLight(lightToAdd);
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + this.energyOnKill);
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
    }

    public handleWaveLighthouseCollision() {
        if (this.isInvulnerable) {
            return; // No damage if invulnerable
        }
        this.lighthouseHealth -= 10;
        this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
        if (this.lighthouseHealth <= 0) {
            this.gameOver();
        }
        this.addLight(this.kineticSiphonModifier * this.lightMultiplier);
    }

    private gameOver() {
        this.gameScene.scene.pause();
        this.uiScene.showGameOver();
    }

    public addLight(amount: number) {
        this.light += amount;
        this.uiScene.setLight(this.light);
    }

    public getLight(): number {
        return this.light;
    }

    public setLight(amount: number) {
        this.light = amount;
        this.uiScene.setLight(this.light);
    }

    public activateMegaBomb() {
        if (!this.hasMegaBomb) {
            return;
        }

        if (this.megaBombTimer > 0) {
            this.uiScene.showInfoText(`Mega Bomb on cooldown for ${Math.ceil(this.megaBombTimer / 1000)}s`);
            return;
        }

        this.megaBombTimer = this.megaBombCooldown;
        this.gameScene.triggerMegaBomb();
    }

    public activateLightSurge() {
        if (!this.hasLightSurge) {
            return;
        }

        if (this.lightSurgeTimer > 0) {
            this.uiScene.showInfoText(`Light Surge on cooldown for ${Math.ceil(this.lightSurgeTimer / 1000)}s`);
            return;
        }

        this.lightSurgeTimer = this.lightSurgeCooldown;
        this.isLightSurgeActive = true;
        this.lightSurgeDurationTimer = this.lightSurgeDuration;

        // Boost Light
        this.surgeAddedRadius = 300; // Big increase
        this.surgeAddedAngle = 45;
        this.lightRadius += this.surgeAddedRadius;
        this.lightAngle += this.surgeAddedAngle;

        this.uiScene.showInfoText('LIGHT SURGE ACTIVATED!');
    }

    private deactivateLightSurge() {
        this.isLightSurgeActive = false;
        this.lightRadius -= this.surgeAddedRadius;
        this.lightAngle -= this.surgeAddedAngle;
        this.surgeAddedRadius = 0;
        this.surgeAddedAngle = 0;
    }

    public activateInvulnerability() {
        if (this.invulnerableCooldownTimer > 0) {
            this.uiScene.showInfoText(
                `Fortified Construct on cooldown for ${Math.ceil(this.invulnerableCooldownTimer / 1000)}s`,
            );
            return;
        }

        this.isInvulnerable = true;
        this.invulnerableTimer = this.invulnerableDuration;
        this.invulnerableCooldownTimer = this.invulnerableCooldown;
        this.uiScene.showInfoText('FORTIFIED CONSTRUCT ACTIVE!');
        this.gameScene.setInvulnerabilityEffect(true);
    }

    public handleLighthouseClick() {
        this.currentEnergy = Math.min(this.currentEnergy + this.energyPerClick, this.maxEnergy);
        if (this.overchargeChance > 0 && Math.random() < this.overchargeChance) {
            this.currentEnergy = Math.min(this.currentEnergy + this.maxEnergy * 0.1, this.maxEnergy);
        }
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
    }

    private resetStats() {
        this.lightRadius = 150;
        this.lightAngle = 3;
        this.rotationSpeed = 1;
        this.beamPenetration = 1;
        this.lightBeamCount = 1;
        this.lighthousePulseRadius = 300;
        this.lighthousePulseForce = 50;

        this.hasSlowingPulse = false;
        this.slowingPulseSlowFactor = 0.1;

        this.chainLightningChance = 0;

        // Energy (preserve current)
        this.maxEnergy = 10;
        this.energyPerClick = 0.2;
        this.energyDrainRate = 0.5;
        this.autoEnergyCollectorRate = 0;
        this.overchargeChance = 0;
        this.energyOnKill = 0;

        // Defensive (preserve current health)
        this.maxLighthouseHealth = 100;
        this.lighthouseHealthRegen = 1;
        this.tileHealth = 10;
        this.beamDamage = 1;
        this.hasAutoBuilder = false;

        // Economic (preserve current light)
        this.lightPerSecond = 0;
        this.waveFragmentsModifier = 1;
        this.kineticSiphonModifier = 0;
        this.tidalForceModifier = 0;
        this.lightMultiplier = 1;
        this.autoLightCollectorRate = 0;
        this.lightInterestRate = 0;
        this.saleModifier = 1;

        this.hasMegaBomb = false;
        this.hasLightSurge = false;
        this.enemySpeedModifier = 1;
        this.baseTimeScale = 1;
    }

    public fullReset() {
        this.purchasedUpgrades.clear();

        resetUpgradeCosts();

        this.resetStats();

        this.light = 100;
        this.currentEnergy = this.maxEnergy;
        this.lighthouseHealth = this.maxLighthouseHealth;

        this.waveNumber = 1;
        this.waveTimer = this.waveTime;
        this.waveState = 'in_wave';

        this.megaBombTimer = 0;
        this.lightSurgeTimer = 0;
        this.isLightSurgeActive = false;
        this.lightSurgeDurationTimer = 0;
        this.surgeAddedRadius = 0;
        this.surgeAddedAngle = 0;
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableCooldownTimer = 0;
        this.slowingPulseTimer = 0;
        this.autoBuilderTimer = 0;

        this.applyPrestigeModifiers();

        this.timeScale = this.baseTimeScale;
        if (this.uiScene) {
            this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
            this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
            this.uiScene.setLight(this.light);
            this.uiScene.updateWaveNumber(this.waveNumber);
        }
    }

    private applyUpgradeEffect(type: string) {
        const upgrade = getUpgradeById(type);
        if (!upgrade) return;
        const value = upgrade.value || 0;

        switch (type) {
            // Offensive
            case 'beam_pierce':
                this.beamPenetration += value;
                break;
            case 'beam_length':
                this.lightRadius += value;
                break;
            case 'rotation_speed':
                this.rotationSpeed += value;
                break;
            case 'slowing_pulse':
                this.hasSlowingPulse = true;
                this.slowingPulseSlowFactor += value;
                break;
            case 'dual_lens':
                this.lightBeamCount = Math.max(this.lightBeamCount, 2);
                break;
            case 'light_amplitude':
                this.lightAngle += value;
                break;
            case 'multi_lens':
                this.lightBeamCount += value;
                break;
            case 'chain_lightning':
                this.chainLightningChance += value;
                break;
            case 'mega_bomb':
                this.hasMegaBomb = true;
                break;

            // Defensive
            case 'shield_core':
                this.maxLighthouseHealth += value;
                break;
            case 'shield_capacitor':
                this.lighthouseHealthRegen += value;
                break;
            case 'auto_builder':
                this.hasAutoBuilder = true;
                break;
            case 'island_fortification':
                this.tileHealth += value;
                break;

            // Economic
            case 'core_crystal':
                this.lightPerSecond += value;
                break;
            case 'wave_fragments':
                this.waveFragmentsModifier += value;
                break;
            case 'kinetic_siphon':
                this.kineticSiphonModifier += value;
                break;
            case 'tidal_force':
                this.tidalForceModifier += value;
                break;
            case 'multiplier':
                this.lightMultiplier *= value;
                break;
            case 'auto_light_collector':
                this.autoLightCollectorRate += value;
                break;
            case 'light_interest':
                this.lightInterestRate += value;
                break;
            case 'sale':
                this.saleModifier -= value;
                break;
            case 'time_warp':
            case 'light_surge':
                this.hasLightSurge = true;
                break;

            // Energy
            case 'energy_capacity':
                this.maxEnergy += value;
                break;
            case 'energy_efficiency':
                this.energyDrainRate = Math.max(0.01, this.energyDrainRate - value);
                break;
            case 'click_power':
                this.energyPerClick += value;
                break;
            case 'auto_energy_collector':
                this.autoEnergyCollectorRate += value;
                break;
            case 'overcharge':
                this.overchargeChance += value;
                break;
            case 'energy_on_kill':
                this.energyOnKill += value;
                break;
        }
    }

    public recalculateStats() {
        this.resetStats();

        this.purchasedUpgrades.forEach((type) => this.applyUpgradeEffect(type));

        this.applyPrestigeModifiers();

        this.currentEnergy = Math.min(this.currentEnergy, this.maxEnergy);
        this.lighthouseHealth = Math.min(this.lighthouseHealth, this.maxLighthouseHealth);

        if (this.uiScene) {
            this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
            this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
        }

        this.timeScale = this.baseTimeScale;
        console.log('Recalculated Stats');
    }

    public refreshPrestigeModifiers() {
        this.recalculateStats();
    }

    private applyPrestigeModifiers() {
        const archetype = PrestigeManager.activeArchetype;
        const relics = PrestigeManager.activeRelics;

        // Apply Archetype
        if (archetype === ArchetypeID.CHRONOMANCER) {
            console.log('Archetype: Chronomancer Active');
            this.hasLightSurge = true;
            this.baseTimeScale = 1.2;
        } else if (archetype === ArchetypeID.STORMBRINGER) {
            console.log('Archetype: Stormbringer Active');
            this.hasMegaBomb = true;
            this.chainLightningChance += 0.2;
        } else if (archetype === ArchetypeID.ARCHITECT) {
            console.log('Archetype: Architect Active');
            this.hasAutoBuilder = true;
            this.autoBuilderTimer = 0;
        }

        this.currentArchetypeEffect = archetype;

        // Apply Relics
        if (relics.includes('prism_of_greed')) {
            this.lightMultiplier *= 3;
            this.enemySpeedModifier = 1.5;
        }
        if (relics.includes('solar_sail')) {
            this.energyDrainRate *= 0.5;
            this.maxLighthouseHealth = 20;
            this.lighthouseHealth = Math.min(this.lighthouseHealth, 20);
            this.lighthouseHealthRegen = 20;
        }
    }
}

export default GameManager.getInstance();

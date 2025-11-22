import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

class GameManager {
    private static instance: GameManager;

    private gameScene!: GameScene;
    private uiScene!: UIScene;

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
    public hasAutoBuilder: boolean = false;
    private autoBuilderTimer: number = 0;

    // Economic properties
    private light: number = 1000000;
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

    public hasTimeWarp: boolean = false;
    public timeWarpCooldown: number = 120000; // ms
    public timeWarpTimer: number = 0;
    public isTimeWarpActive: boolean = false;
    public timeWarpDuration: number = 10000; // ms
    public timeWarpDurationTimer: number = 0;

    // Wave properties
    public waveNumber: number = 1;
    public waveTime: number = 30; // seconds
    public waveTimer: number = this.waveTime;
    public waveReward: number = 100;
    public waveState: 'in_wave' | 'waiting' = 'in_wave';
    public waveDelay: number = 10; // seconds

    public getWaveLightReward(): number {
        return Math.floor(this.waveReward * this.waveFragmentsModifier * this.lightMultiplier);
    }

    private constructor() { }

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
        this.uiScene.setLight(this.light);
    }

    public update(delta: number) {
        this.currentEnergy -= this.energyDrainRate * (delta / 1000);
        this.currentEnergy = Math.max(0, this.currentEnergy);
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);

        if (this.hasAutoBuilder) {
            this.autoBuilderTimer += delta;
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

        if (this.hasTimeWarp) {
            this.timeWarpTimer -= delta;
        }

        if (this.isTimeWarpActive) {
            this.timeWarpDurationTimer -= delta;
            if (this.timeWarpDurationTimer <= 0) {
                this.isTimeWarpActive = false;
                this.gameScene.physics.world.timeScale = 1;
            }
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

        this.lighthouseHealth = Math.min(this.maxLighthouseHealth, this.lighthouseHealth + this.lighthouseHealthRegen * (delta / 1000));
        this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
    }

    private endWave() {
        this.waveState = 'waiting';
        this.waveTimer = this.waveDelay;
        this.addLight(this.waveReward);
        this.uiScene.updateWaveNumber(this.waveNumber);
    }

    private startWave() {
        this.waveState = 'in_wave';
        this.waveNumber++;
        this.waveTimer = this.waveTime;
        this.gameScene.waveSpawnDelay = Math.max(100, this.gameScene.waveSpawnDelay - 100);
    }

    public applyUpgrade(type: string) {
        switch (type) {
            // Offensive
            case 'beam_pierce':
                this.beamPenetration += 1;
                break;
            case 'beam_length':
                this.lightRadius += 10;
                break;
            case 'rotation_speed':
                this.rotationSpeed += 0.2;
                break;
            case 'slowing_pulse':
                this.hasSlowingPulse = true;
                this.slowingPulseSlowFactor += 0.1;
                break;
            case 'dual_lens':
                this.lightBeamCount = Math.max(this.lightBeamCount, 2);
                break;
            case 'light_amplitude':
                this.lightAngle += 5;
                break;
            case 'multi_lens':
                this.lightBeamCount += 1;
                break;
            case 'chain_lightning':
                this.chainLightningChance += 0.05;
                break;
            case 'mega_bomb':
                this.hasMegaBomb = true;
                break;

            // Defensive
            case 'shield_core':
                this.maxLighthouseHealth += 10;
                this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
                break;
            case 'shield_capacitor':
                this.lighthouseHealthRegen += 1;
                break;
            case 'auto_builder':
                this.hasAutoBuilder = true;
                break;
            case 'island_reconstruction':
                this.gameScene.rebuildIsland();
                break;
            case 'island_expansion':
                this.gameScene.expandIsland();
                break;
            case 'island_fortification':
                this.tileHealth += 10;
                break;

            // Economic
            case 'core_crystal':
                this.lightPerSecond += 1;
                break;
            case 'wave_fragments':
                this.waveFragmentsModifier += 1;
                break;
            case 'kinetic_siphon':
                this.kineticSiphonModifier += 0.5;
                break;
            case 'tidal_force':
                this.tidalForceModifier += 0.1;
                break;
            case 'multiplier':
                this.lightMultiplier *= 2;
                break;
            case 'auto_light_collector':
                this.autoLightCollectorRate += 1;
                break;
            case 'light_interest':
                this.lightInterestRate += 0.001;
                break;
            case 'sale':
                this.saleModifier -= 0.01;
                break;
            case 'time_warp':
                this.hasTimeWarp = true;
                break;

            // Energy
            case 'energy_capacity':
                this.maxEnergy += 20;
                this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
                break;
            case 'energy_efficiency':
                this.energyDrainRate = Math.max(0.01, this.energyDrainRate - 0.05);
                break;
            case 'click_power':
                this.energyPerClick += 0.5;
                break;
            case 'auto_energy_collector':
                this.autoEnergyCollectorRate += 1;
                break;
            case 'overcharge':
                this.overchargeChance += 0.01;
                break;
            case 'energy_on_kill':
                this.energyOnKill += 0.1;
                break;
        }
    }

    public onWaveDestroyed() {
        let lightToAdd = 1 * this.waveFragmentsModifier * this.lightMultiplier;
        this.addLight(lightToAdd);
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + this.energyOnKill);
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
    }

    public handleWaveLighthouseCollision() {
        this.lighthouseHealth -= 10;
        this.uiScene.updateLighthouseHealth(this.lighthouseHealth, this.maxLighthouseHealth);
        if (this.lighthouseHealth <= 0) {
            this.gameOver();
        }
        this.addLight(this.kineticSiphonModifier);
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

    public activateTimeWarp() {
        if (!this.hasTimeWarp) {
            return;
        }

        if (this.timeWarpTimer > 0) {
            this.uiScene.showInfoText(`Time Warp on cooldown for ${Math.ceil(this.timeWarpTimer / 1000)}s`);
            return;
        }

        this.timeWarpTimer = this.timeWarpCooldown;
        this.isTimeWarpActive = true;
        this.timeWarpDurationTimer = this.timeWarpDuration;
        this.gameScene.physics.world.timeScale = 2; // Speed up time by 2x
        this.uiScene.showInfoText('TIME WARP ACTIVATED!');
    }

    public handleLighthouseClick() {
        this.currentEnergy = Math.min(this.currentEnergy + this.energyPerClick, this.maxEnergy);
        if (this.overchargeChance > 0 && Math.random() < this.overchargeChance) {
            this.currentEnergy = Math.min(this.currentEnergy + (this.maxEnergy * 0.1), this.maxEnergy);
        }
        this.uiScene.updateEnergy(this.currentEnergy, this.maxEnergy);
    }
}

export default GameManager.getInstance();

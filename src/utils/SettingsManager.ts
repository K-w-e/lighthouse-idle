import Phaser from 'phaser';

export class SettingsManager {
    private static instance: SettingsManager;

    public musicVolume: number = 0.5;
    public sfxVolume: number = 0.5;
    public fullscreen: boolean = false;
    public particlesEnabled: boolean = true;
    public screenShakeEnabled: boolean = true;
    public showFps: boolean = true;
    public maxFps: number = 90;

    private constructor() {
        this.loadSettings();
    }

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    public loadSettings() {
        const savedSettings = localStorage.getItem('lighthouse-idle-settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            console.log(parsed);
            this.musicVolume = parsed.musicVolume ?? 0.5;
            this.sfxVolume = parsed.sfxVolume ?? 0.5;
            this.fullscreen = parsed.fullscreen ?? false;
            this.particlesEnabled = parsed.particlesEnabled ?? true;
            this.screenShakeEnabled = parsed.screenShakeEnabled ?? true;
            this.showFps = parsed.showFps ?? true;
            this.maxFps = parsed.maxFps ?? 60;
        }
    }

    public saveSettings() {
        const settings = {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            fullscreen: this.fullscreen,
            particlesEnabled: this.particlesEnabled,
            screenShakeEnabled: this.screenShakeEnabled,
            showFps: this.showFps,
            maxFps: this.maxFps
        };
        localStorage.setItem('lighthouse-idle-settings', JSON.stringify(settings));
    }

    public applySettings(scene: Phaser.Scene) {
        scene.sound.setVolume(this.musicVolume);

        if (this.fullscreen) {
            if (!scene.scale.isFullscreen) {
                scene.scale.startFullscreen();
            }
        } else {
            if (scene.scale.isFullscreen) {
                scene.scale.stopFullscreen();
            }
        }

        scene.game.loop.targetFps = this.maxFps;
        scene.game.loop.fpsLimit = this.maxFps;
        (scene.game.loop as any).forceSetTimeOut = true;
    }
}

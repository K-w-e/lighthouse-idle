import Phaser from 'phaser';

export class SettingsManager {
    private static instance: SettingsManager;

    public musicVolume: number = 0.5;
    public sfxVolume: number = 0.5;
    public fullscreen: boolean = false;
    public particlesEnabled: boolean = true;
    public screenShakeEnabled: boolean = true;

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
            this.musicVolume = parsed.musicVolume ?? 0.5;
            this.sfxVolume = parsed.sfxVolume ?? 0.5;
            this.fullscreen = parsed.fullscreen ?? false;
            this.particlesEnabled = parsed.particlesEnabled ?? true;
            this.screenShakeEnabled = parsed.screenShakeEnabled ?? true;
        }
    }

    public saveSettings() {
        const settings = {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            fullscreen: this.fullscreen,
            particlesEnabled: this.particlesEnabled,
            screenShakeEnabled: this.screenShakeEnabled
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
    }
}

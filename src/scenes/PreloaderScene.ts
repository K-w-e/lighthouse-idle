import Phaser from "phaser";

export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super("PreloaderScene");
    }

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("lighthouse", "assets/lighthouse.png");

        this.load.image("defensive", "assets/icons/defensive.svg");
        this.load.image("offensive", "assets/icons/offensive.svg");
        this.load.image("economic", "assets/icons/economic.svg");
        this.load.image("energy", "assets/icons/energy.svg");
        this.load.image("icon_stats", "assets/icons/stats.svg");
        this.load.image("icon_settings", "assets/icons/settings.svg");

        this.load.audio("wave_crash1", "assets/audio/wave_crash1.mp3");
        this.load.audio("wave_crash2", "assets/audio/wave_crash2.mp3");
        this.load.audio("wave_crash3", "assets/audio/wave_crash3.mp3");
        this.load.audio("wave_crash4", "assets/audio/wave_crash4.mp3");

        this.load.audio("bg_audio1", "assets/audio/bg_audio1.mp3");
        this.load.audio("bg_audio2", "assets/audio/bg_audio2.mp3");
        this.load.audio("bg_audio3", "assets/audio/bg_audio3.mp3");
        this.load.audio("bg_audio4", "assets/audio/bg_audio4.mp3");
    }

    create() {
        this.add.image(400, 300, "preloader");

        const waveGraphics = this.make.graphics();
        waveGraphics.fillStyle(0x0000ff);
        waveGraphics.fillRect(0, 0, 10, 10);
        waveGraphics.generateTexture("wave_block", 10, 10);
        waveGraphics.destroy();

        const foamGraphics = this.make.graphics();
        foamGraphics.fillStyle(0xffffff);
        foamGraphics.fillRect(0, 0, 5, 5);
        foamGraphics.generateTexture("foam_block", 5, 5);
        foamGraphics.destroy();

        this.scene.start("TitleScene");
    }
}

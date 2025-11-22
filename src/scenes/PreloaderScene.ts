import Phaser from 'phaser';

export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super('PreloaderScene');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('lighthouse', 'assets/lighthouse.png');
    }

    create() {
        this.add.image(400, 300, 'preloader');

        const waveGraphics = this.make.graphics();
        waveGraphics.fillStyle(0x0000ff);
        waveGraphics.fillRect(0, 0, 10, 10);
        waveGraphics.generateTexture('wave_block', 10, 10);
        waveGraphics.destroy();

        const foamGraphics = this.make.graphics();
        foamGraphics.fillStyle(0xffffff);
        foamGraphics.fillRect(0, 0, 5, 5);
        foamGraphics.generateTexture('foam_block', 5, 5);
        foamGraphics.destroy();

        this.scene.start('TitleScene');
    }
}

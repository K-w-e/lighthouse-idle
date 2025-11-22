import Phaser from 'phaser';
import UIScene from './UIScene';

export default class TitleScene extends Phaser.Scene {

    constructor() {
        super('TitleScene');
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        this.add.image(centerX, centerY, 'background').setAlpha(0.5);

        this.add.text(centerX, centerY - 100, 'Waves Are Very Erosive', {
            fontSize: '48px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const startButton = this.add.text(centerX, centerY, 'Start', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.scene.start('UIScene');
            this.scene.start('GameScene');
        });

        const tutorialButton = this.add.text(centerX, centerY + 70, 'Tutorial', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        tutorialButton.on('pointerdown', () => {
            this.scene.launch('TutorialScene');
            this.scene.pause();
        });
    }
}

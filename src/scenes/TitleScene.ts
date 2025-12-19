import Phaser from 'phaser';
import UIScene from './UIScene';
import WaterPipeline from '../pipelines/WaterPipeline';
import PrestigeManager from '../managers/PrestigeManager';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        if (!renderer.pipelines.has('WaterPipeline')) {
            renderer.pipelines.addPostPipeline('WaterPipeline', WaterPipeline);
        }

        const bg = this.add.image(centerX, centerY, 'background').setAlpha(0.5);
        bg.setPostPipeline('WaterPipeline');

        this.add
            .text(centerX, centerY - 100, 'Waves Are Very Erosive', {
                fontSize: '36px',
                color: '#ffffff',
                align: 'center',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);

        const startButton = this.add
            .text(centerX, centerY, 'Start', {
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 },
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.scene.start('UIScene');
            this.scene.start('GameScene');
        });

        const settingsButton = this.add
            .text(centerX, centerY + 70, 'Settings', {
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 },
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        settingsButton.on('pointerdown', () => {
            this.scene.launch('SettingsScene');
        });

        const tutorialButton = this.add
            .text(centerX, centerY + 140, 'Tutorial', {
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 },
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        tutorialButton.on('pointerdown', () => {
            this.scene.launch('TutorialScene');
            this.scene.pause();
        });

        const prestigeButton = this.add
            .text(centerX, centerY + 210, 'Prestige Shop', {
                fontSize: '28px',
                color: '#A78BFA',
                backgroundColor: '#1e1b4b',
                padding: { x: 20, y: 10 },
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        prestigeButton.on('pointerdown', () => {
            this.scene.launch('PrestigeScene', { fromTitle: true });
            this.scene.pause();
        });

        this.add
            .text(centerX, height - 40, `Aether: ${PrestigeManager.aether}`, {
                fontSize: '22px',
                color: '#A78BFA',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);
    }
}

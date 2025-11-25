import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import PreloaderScene from './scenes/PreloaderScene';
import UIScene from './scenes/UIScene';
import { StatsScene } from './scenes/StatsScene';
import TitleScene from './scenes/TitleScene';
import { TutorialScene } from './scenes/TutorialScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SettingsManager } from './utils/SettingsManager';

const settingsManager = SettingsManager.getInstance();

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    width: 1200,
    height: 900,
    parent: 'game-container',
    pixelArt: true,
    scene: [PreloaderScene, TitleScene, GameScene, UIScene, StatsScene, SettingsScene, TutorialScene],
    physics: {
        default: 'arcade',
        arcade: {
            //debug: true,
        }
    },
    fps: {
        target: settingsManager.maxFps,
        limit: settingsManager.maxFps
    }
};

export default new Phaser.Game(config);

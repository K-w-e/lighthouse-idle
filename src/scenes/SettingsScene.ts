import Phaser from 'phaser';
import { SettingsManager } from '../utils/SettingsManager';

const BORDER_COLOR = 0x5b6d84;
const BG_COLOR = 0x1a2130;
const TEXT_COLOR = '#FFFFFF';
const ACCENT_COLOR = '#FBBF24';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add
            .graphics()
            .fillStyle(BG_COLOR, 0.95)
            .fillRect(0, 0, width, height)
            .lineStyle(2, BORDER_COLOR)
            .strokeRect(0, 0, width, height);

        this.add
            .text(width / 2, 40, 'Settings', {
                fontSize: '32px',
                color: TEXT_COLOR,
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);

        const closeButton = this.add
            .text(width - 30, 30, 'X', {
                fontSize: '28px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        closeButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
        closeButton.on('pointerover', () => closeButton.setColor(ACCENT_COLOR));
        closeButton.on('pointerout', () => closeButton.setColor(TEXT_COLOR));

        const startY = 100;
        const gapY = 60;
        const settingsManager = SettingsManager.getInstance();

        this.add
            .text(width / 2 - 250, startY, 'Music Volume', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createSlider(width / 2 + 100, startY, settingsManager.musicVolume, (value) => {
            settingsManager.musicVolume = value;
            settingsManager.saveSettings();
            settingsManager.applySettings(this);
        });

        this.add
            .text(width / 2 - 250, startY + gapY, 'SFX Volume', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createSlider(width / 2 + 100, startY + gapY, settingsManager.sfxVolume, (value) => {
            settingsManager.sfxVolume = value;
            settingsManager.saveSettings();
        });

        this.add
            .text(width / 2 - 250, startY + gapY * 2, 'Fullscreen', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createToggle(width / 2 + 50, startY + gapY * 2, settingsManager.fullscreen, (value) => {
            settingsManager.fullscreen = value;
            settingsManager.saveSettings();
            settingsManager.applySettings(this);
        });

        this.add
            .text(width / 2 - 250, startY + gapY * 3, 'Particles', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createToggle(width / 2 + 50, startY + gapY * 3, settingsManager.particlesEnabled, (value) => {
            settingsManager.particlesEnabled = value;
            settingsManager.saveSettings();
        });

        this.add
            .text(width / 2 - 250, startY + gapY * 4, 'Screen Shake', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createToggle(width / 2 + 50, startY + gapY * 4, settingsManager.screenShakeEnabled, (value) => {
            settingsManager.screenShakeEnabled = value;
            settingsManager.saveSettings();
        });

        this.add
            .text(width / 2 - 250, startY + gapY * 5, 'Show FPS', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createToggle(width / 2 + 50, startY + gapY * 5, settingsManager.showFps, (value) => {
            settingsManager.showFps = value;
            settingsManager.saveSettings();
        });

        this.add
            .text(width / 2 - 250, startY + gapY * 6, 'Max FPS', {
                fontSize: '20px',
                color: TEXT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0, 0.5);
        this.createFpsSelector(
            width / 2 + 100,
            startY + gapY * 6,
            [30, 60, 90, 120],
            settingsManager.maxFps,
            (value) => {
                settingsManager.maxFps = value;
                settingsManager.saveSettings();
                settingsManager.applySettings(this);
            },
        );
    }

    private createSlider(x: number, y: number, initialValue: number, onChange: (value: number) => void) {
        const width = 200;
        const height = 10;
        const handleRadius = 10;

        const bar = this.add.graphics();
        bar.fillStyle(0x5b6d84);
        bar.fillRoundedRect(x - width / 2, y - height / 2, width, height, 5);

        const handle = this.add
            .circle(x - width / 2 + initialValue * width, y, handleRadius, 0xfbbf24)
            .setInteractive({ useHandCursor: true, draggable: true });

        this.input.setDraggable(handle);

        handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            const minX = x - width / 2;
            const maxX = x + width / 2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            handle.x = clampedX;

            const value = (clampedX - minX) / width;
            onChange(value);
        });

        return handle;
    }

    private createToggle(x: number, y: number, initialValue: boolean, onChange: (value: boolean) => void) {
        const size = 30;
        const border = this.add.graphics();

        const draw = (checked: boolean) => {
            border.clear();
            border.lineStyle(2, 0x5b6d84);
            border.strokeRect(x - size / 2, y - size / 2, size, size);

            if (checked) {
                border.fillStyle(0xfbbf24);
                border.fillRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, size - 8);
            }
        };

        draw(initialValue);

        const hitArea = new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size);
        border.setInteractive({
            hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        });

        let isChecked = initialValue;

        border.on('pointerdown', () => {
            isChecked = !isChecked;
            draw(isChecked);
            onChange(isChecked);
        });

        return border;
    }

    private createFpsSelector(
        x: number,
        y: number,
        options: number[],
        currentValue: number,
        onChange: (value: number) => void,
    ) {
        const buttonWidth = 60;
        const buttonHeight = 30;
        const gap = 10;
        const totalWidth = options.length * buttonWidth + (options.length - 1) * gap;
        const startX = x - totalWidth / 2 + buttonWidth / 2;

        const buttons: {
            graphics: Phaser.GameObjects.Graphics;
            text: Phaser.GameObjects.Text;
            option: number;
            x: number;
        }[] = [];

        const updateButtons = (selectedValue: number) => {
            buttons.forEach((btn) => {
                const isSelected = btn.option === selectedValue;
                const color = isSelected ? 0xfbbf24 : 0x1a2130;
                const textColor = isSelected ? '#1A2130' : '#FFFFFF';

                btn.graphics.clear();
                btn.graphics.lineStyle(2, 0x5b6d84);

                if (isSelected) {
                    btn.graphics.fillStyle(color);
                    btn.graphics.fillRoundedRect(
                        btn.x - buttonWidth / 2,
                        y - buttonHeight / 2,
                        buttonWidth,
                        buttonHeight,
                        5,
                    );
                }

                btn.graphics.strokeRoundedRect(
                    btn.x - buttonWidth / 2,
                    y - buttonHeight / 2,
                    buttonWidth,
                    buttonHeight,
                    5,
                );

                btn.text.setColor(textColor);
            });
        };

        options.forEach((option, index) => {
            const buttonX = startX + index * (buttonWidth + gap);

            const graphics = this.add.graphics();
            const text = this.add
                .text(buttonX, y, option.toString(), {
                    fontSize: '16px',
                    color: '#FFFFFF',
                    fontStyle: 'bold',
                    fontFamily: 'PixelFont',
                })
                .setOrigin(0.5);

            const hitArea = new Phaser.Geom.Rectangle(
                buttonX - buttonWidth / 2,
                y - buttonHeight / 2,
                buttonWidth,
                buttonHeight,
            );
            graphics.setInteractive({
                hitArea,
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true,
            });

            graphics.on('pointerdown', () => {
                onChange(option);
                updateButtons(option);
            });

            buttons.push({ graphics, text, option, x: buttonX });
        });

        updateButtons(currentValue);
    }
}

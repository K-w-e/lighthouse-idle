import Phaser from 'phaser';
import GameManager from '../GameManager';
import { upgrades } from '../data/upgrades';
import { SettingsManager } from '../utils/SettingsManager';

type UpgradeCategory = string;
type Upgrade = typeof upgrades[UpgradeCategory][0];

const SHOP_BORDER_COLOR = 0x5B6D84;
const SHOP_BG_COLOR = 0x1A2130;
const SHOP_TAB_BG_COLOR = 0x2A3140;
const SHOP_TEXT_COLOR = '#FFFFFF';
const SHOP_TEXT_COLOR_MEDIUM = '#D1D5DB';
const SHOP_TEXT_COLOR_DARK = '#6B7280';
const SHOP_ACCENT_COLOR = '#FBBF24';
const SHOP_BUY_BUTTON_COLOR = 0x10B981;
const SHOP_BUY_BUTTON_COLOR_HOVER = 0x34D399;
const SHOP_DISABLED_BUTTON_COLOR = 0x4B5563;

const BORDER_COLOR = 0x5B6D84;
const BG_COLOR = 0x1A2130;
const TEXT_COLOR = '#FFFFFF';
const ACCENT_COLOR = 0xFBBF24;
const HEALTH_COLOR = 0xFF0000;

export default class UIScene extends Phaser.Scene {
    private energyBar!: Phaser.GameObjects.Graphics;
    private energyBarBg!: Phaser.GameObjects.Graphics;
    private healthBar!: Phaser.GameObjects.Graphics;
    private healthBarBg!: Phaser.GameObjects.Graphics;
    private waveText!: Phaser.GameObjects.Text;
    private waveTimerText!: Phaser.GameObjects.Text;
    private infoText!: Phaser.GameObjects.Text;
    private megaBombButton!: Phaser.GameObjects.Graphics;
    private megaBombText!: Phaser.GameObjects.Text;
    private megaBombCooldownText!: Phaser.GameObjects.Text;
    private timeWarpButton!: Phaser.GameObjects.Graphics;
    private timeWarpText!: Phaser.GameObjects.Text;
    private timeWarpCooldownText!: Phaser.GameObjects.Text;

    private upgradesContainer!: Phaser.GameObjects.Container;
    private currentCategory: UpgradeCategory = 'offensive';
    private shopLightText!: Phaser.GameObjects.Text;
    private tabs: { [key in UpgradeCategory]?: Phaser.GameObjects.Image } = {};
    private tabIndicator!: Phaser.GameObjects.Graphics;
    private scrollMinY = 0;
    private scrollMaxY = 0;
    private fpsText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        const gameWidth = 800;
        const statsBarHeight = 80;

        const settingsManager = SettingsManager.getInstance();

        this.fpsText = this.add.text(10, this.cameras.main.height - 30, `FPS: ${Math.round(this.game.loop.actualFps)}`, {
            fontSize: '18px',
            color: TEXT_COLOR,
            fontFamily: 'PixelFont',
        }).setOrigin(0, 1);
        this.fpsText.setVisible(settingsManager.showFps);

        this.add.graphics()
            .fillStyle(BG_COLOR)
            .fillRect(0, 0, gameWidth, statsBarHeight)
            .lineStyle(2, BORDER_COLOR)
            .strokeRect(0, 0, gameWidth, statsBarHeight);

        this.add.text(15, 15, 'Health', { fontSize: '18px', color: TEXT_COLOR, fontFamily: 'PixelFont' });
        this.healthBarBg = this.add.graphics()
            .fillStyle(BG_COLOR)
            .fillRoundedRect(15, 40, 150, 25, 10)
            .lineStyle(2, BORDER_COLOR)
            .strokeRoundedRect(15, 40, 150, 25, 10);
        this.healthBar = this.add.graphics({ x: 15, y: 40 })
            .fillStyle(HEALTH_COLOR)
            .fillRoundedRect(0, 0, 150, 25, 10);

        this.add.text(200, 15, 'Energy', { fontSize: '18px', color: TEXT_COLOR, fontFamily: 'PixelFont' });
        this.energyBarBg = this.add.graphics()
            .fillStyle(BG_COLOR)
            .fillRoundedRect(200, 40, 150, 25, 10)
            .lineStyle(2, BORDER_COLOR)
            .strokeRoundedRect(200, 40, 150, 25, 10);
        this.energyBar = this.add.graphics({ x: 200, y: 40 })
            .fillStyle(ACCENT_COLOR)
            .fillRoundedRect(0, 0, 150, 25, 10);
        this.energyBar.scaleX = 0;

        this.waveText = this.add.text(400, 25, 'Wave: 1', {
            fontSize: '20px',
            color: TEXT_COLOR,
            fontFamily: 'PixelFont',
        }).setOrigin(0, 0.5);
        this.waveTimerText = this.add.text(400, 55, 'Time: 30', {
            fontSize: '20px',
            color: TEXT_COLOR,
            fontFamily: 'PixelFont',
        }).setOrigin(0, 0.5);

        const iconSize = 40;
        const iconPadding = 20;
        const startX = gameWidth - iconSize / 2 - iconPadding;
        const startY = iconSize / 2 + iconPadding;

        const settingsIcon = this.add.image(startX, startY, 'icon_settings')
            .setScale(0.05)
            .setInteractive({ useHandCursor: true });

        settingsIcon.on('pointerdown', () => {
            if (!this.scene.isActive('SettingsScene')) {
                this.scene.launch('SettingsScene');
                this.scene.pause('GameScene');
            }
        });

        this.addHoverEffect(settingsIcon);

        const statsIcon = this.add.image(startX - iconSize - iconPadding, startY, 'icon_stats')
            .setScale(0.05)
            .setInteractive({ useHandCursor: true });

        statsIcon.on('pointerdown', () => {
            if (!this.scene.isActive('StatsScene')) {
                this.scene.launch('StatsScene');
                this.scene.pause('GameScene');
            }
        });

        this.addHoverEffect(statsIcon);

        this.createShopUI();

        this.updateLightText();
        this.updateEnergy(0, 1);
        this.updateLighthouseHealth(1, 1);

        const buttonSize = 60;
        const buttonX = (gameWidth / 2) - buttonSize - 5;
        const buttonY = this.cameras.main.height - 80;

        this.megaBombButton = this.add.graphics()
            .fillStyle(BG_COLOR)
            .fillRoundedRect(buttonX, buttonY, buttonSize, buttonSize, 10)
            .lineStyle(2, BORDER_COLOR)
            .strokeRoundedRect(buttonX, buttonY, buttonSize, buttonSize, 10);

        this.megaBombText = this.add.text(buttonX + buttonSize / 2, buttonY + buttonSize / 2, 'B', {
            fontSize: '32px',
            color: TEXT_COLOR,
            fontStyle: 'bold',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);

        this.megaBombCooldownText = this.add.text(buttonX + buttonSize / 2, buttonY + buttonSize + 15, '', {
            fontSize: '18px',
            color: TEXT_COLOR,
            fontStyle: 'bold',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);

        const hitArea = new Phaser.Geom.Rectangle(buttonX, buttonY, buttonSize, buttonSize);
        this.megaBombButton.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })
            .on('pointerdown', () => GameManager.activateMegaBomb())
            .on('pointerover', () => {
                if (GameManager.megaBombTimer <= 0) {
                    this.megaBombButton.fillStyle(BORDER_COLOR);
                }
            })
            .on('pointerout', () => {
                this.megaBombButton.fillStyle(BG_COLOR);
            });

        this.megaBombButton.setVisible(false);
        this.megaBombText.setVisible(false);
        this.megaBombCooldownText.setVisible(false);

        const twButtonSize = 60;
        const twButtonX = (gameWidth / 2) + 5;
        const twButtonY = this.cameras.main.height - 80;

        this.timeWarpButton = this.add.graphics()
            .fillStyle(BG_COLOR)
            .fillRoundedRect(twButtonX, twButtonY, twButtonSize, twButtonSize, 10)
            .lineStyle(2, BORDER_COLOR)
            .strokeRoundedRect(twButtonX, twButtonY, twButtonSize, twButtonSize, 10);

        this.timeWarpText = this.add.text(twButtonX + twButtonSize / 2, twButtonY + twButtonSize / 2, 'T', {
            fontSize: '32px',
            color: TEXT_COLOR,
            fontStyle: 'bold',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);

        this.timeWarpCooldownText = this.add.text(twButtonX + twButtonSize / 2, twButtonY + twButtonSize + 15, '', {
            fontSize: '18px',
            color: TEXT_COLOR,
            fontStyle: 'bold',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);

        const twHitArea = new Phaser.Geom.Rectangle(twButtonX, twButtonY, twButtonSize, twButtonSize);
        this.timeWarpButton.setInteractive({ hitArea: twHitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })
            .on('pointerdown', () => GameManager.activateTimeWarp())
            .on('pointerover', () => {
                if (GameManager.timeWarpTimer <= 0) {
                    this.timeWarpButton.fillStyle(BORDER_COLOR);
                }
            })
            .on('pointerout', () => {
                this.timeWarpButton.fillStyle(BG_COLOR);
            });

        this.timeWarpButton.setVisible(false);
        this.timeWarpText.setVisible(false);
        this.timeWarpCooldownText.setVisible(false);
    }

    update() {
        this.updateLightText();

        const settingsManager = SettingsManager.getInstance();
        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
        this.fpsText.setVisible(settingsManager.showFps);

        if (GameManager.hasMegaBomb) {
            this.megaBombButton.setVisible(true);
            this.megaBombText.setVisible(true);
            this.megaBombCooldownText.setVisible(true);

            if (GameManager.megaBombTimer > 0) {
                this.megaBombCooldownText.setText(`${Math.ceil(GameManager.megaBombTimer / 1000)}s`);
                this.megaBombButton.setAlpha(0.5);
            } else {
                this.megaBombCooldownText.setText('');
                this.megaBombButton.setAlpha(1);
            }
        }

        if (GameManager.hasTimeWarp) {
            this.timeWarpButton.setVisible(true);
            this.timeWarpText.setVisible(true);
            this.timeWarpCooldownText.setVisible(true);

            if (GameManager.timeWarpTimer > 0) {
                this.timeWarpCooldownText.setText(`${Math.ceil(GameManager.timeWarpTimer / 1000)}s`);
                this.timeWarpButton.setAlpha(0.5);
            } else {
                this.timeWarpCooldownText.setText('');
                this.timeWarpButton.setAlpha(1);
            }

            if (GameManager.isTimeWarpActive) {
                if (!this.tweens.isTweening(this.timeWarpButton)) {
                    this.tweens.add({
                        targets: this.timeWarpButton,
                        scaleX: 1.1,
                        scaleY: 1.1,
                        duration: 200,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            } else {
                this.tweens.killTweensOf(this.timeWarpButton);
                this.timeWarpButton.setScale(1);
            }
        }
    }

    public setLight(light: number) {
        this.updateLightText();
    }

    public updateEnergy(currentEnergy: number, maxEnergy: number) {
        const percentage = maxEnergy > 0 ? currentEnergy / maxEnergy : 0;
        this.tweens.add({
            targets: this.energyBar,
            scaleX: percentage,
            ease: 'Linear',
            duration: 200
        });
    }

    public updateLighthouseHealth(currentHealth: number, maxHealth: number) {
        const percentage = maxHealth > 0 ? currentHealth / maxHealth : 0;
        this.tweens.add({
            targets: this.healthBar,
            scaleX: percentage,
            ease: 'Linear',
            duration: 200
        });
    }

    public updateWaveNumber(waveNumber: number) {
        this.waveText.setText(`Wave: ${waveNumber}`);
    }

    public updateWaveTimer(waveTimer: number, waveTime: number) {
        this.waveTimerText.setText(`Time: ${Math.ceil(waveTimer)}`);
    }

    public showGameOver() {
        const { height } = this.cameras.main;
        const gameWidth = 800;
        const gameOverBg = this.add.graphics();
        gameOverBg.fillStyle(0x000000, 0.7);
        gameOverBg.fillRect(0, 0, gameWidth, height);

        this.add.text(gameWidth / 2, height / 2, 'Game Over', {
            fontSize: '64px',
            color: '#ff0000',
            fontStyle: 'bold',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);
    }

    public showInfoText(message: string) {
        if (this.infoText) {
            this.infoText.destroy();
        }
        const gameWidth = 800;
        this.infoText = this.add.text(gameWidth / 2, 150, message, {
            fontSize: '24px',
            color: '#FBBF24',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.infoText,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                if (this.infoText) {
                    this.infoText.destroy();
                }
            }
        });
    }

    private createShopUI() {
        const shopWidth = 400;
        const shopX = 1200 - shopWidth;
        const { height } = this.cameras.main;

        this.add.graphics()
            .fillStyle(SHOP_BG_COLOR, 1)
            .fillRect(shopX, 0, shopWidth, height)
            .lineStyle(2, SHOP_BORDER_COLOR)
            .strokeRect(shopX, 0, shopWidth, height);

        this.add.text(shopX + shopWidth / 2, 40, 'Upgrades', {
            fontSize: '28px',
            color: SHOP_TEXT_COLOR,
            fontStyle: 'bold',
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);

        this.shopLightText = this.add.text(shopX + shopWidth / 2, 80, '', {
            fontSize: '22px',
            color: SHOP_ACCENT_COLOR,
            fontFamily: 'PixelFont',
        }).setOrigin(0.5);
        this.updateLightText();

        const categories = Object.keys(upgrades) as UpgradeCategory[];
        const tabWidth = (shopWidth - 40) / categories.length;

        this.add.graphics()
            .fillStyle(SHOP_TAB_BG_COLOR)
            .fillRect(shopX + 20, 120, shopWidth - 40, 50);

        this.tabIndicator = this.add.graphics();

        categories.forEach((category, index) => {
            const tabX = shopX + 20 + index * tabWidth + tabWidth / 2;
            const tab = this.add.image(tabX, 145, category)
                .setScale(0.04)
                .setInteractive({ useHandCursor: true });

            tab.on('pointerdown', () => {
                this.showUpgrades(category);
            });

            this.tabs[category] = tab;
        });

        this.upgradesContainer = this.add.container(shopX + 20, 200);

        const maskGraphics = this.make.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(shopX, 180, shopWidth, height - 200);
        const mask = maskGraphics.createGeometryMask();
        this.upgradesContainer.setMask(mask);

        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
            if (pointer.x > shopX && this.scrollMinY !== this.scrollMaxY) {
                this.upgradesContainer.y -= deltaY * 0.5;
                this.upgradesContainer.y = Phaser.Math.Clamp(this.upgradesContainer.y, this.scrollMinY, this.scrollMaxY);
            }
        });

        this.showUpgrades(this.currentCategory);
    }

    private showUpgrades(category: UpgradeCategory) {
        this.currentCategory = category;
        this.upgradesContainer.removeAll(true);
        this.updateLightText();
        this.upgradesContainer.y = 200;

        const shopWidth = 400;
        const shopX = 1200 - shopWidth;

        const categories = Object.keys(upgrades) as UpgradeCategory[];
        const tabWidth = (shopWidth - 40) / categories.length;
        const activeIndex = categories.indexOf(category);

        this.tabIndicator.clear()
            .fillStyle(ACCENT_COLOR)
            .fillRect(shopX + 20 + activeIndex * tabWidth, 165, tabWidth, 5);

        for (const cat in this.tabs) {
            if (this.tabs[cat as UpgradeCategory]) {
                this.tabs[cat as UpgradeCategory]!.clearTint();
            }
        }
        if (this.tabs[category]) {
            this.tabs[category]!.setTint(ACCENT_COLOR);
            this.tabs[category]!.setTintFill(ACCENT_COLOR);
        }

        const categoryUpgrades = upgrades[category];
        const light = GameManager.getLight();

        categoryUpgrades.forEach((upgrade, index) => {
            const y = index * 110;

            const currentCost = upgrade.id === 'sale' ? upgrade.cost : Math.ceil(upgrade.cost * GameManager.saleModifier);
            const canAfford = light >= currentCost;

            const nameText = this.add.text(0, y, upgrade.name, {
                fontSize: '14px',
                color: SHOP_TEXT_COLOR,
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            });

            const descText = this.add.text(0, y + 28, upgrade.description, {
                fontSize: '10px',
                color: SHOP_TEXT_COLOR_MEDIUM,
                wordWrap: { width: shopWidth - 160 },
                fontFamily: 'PixelFont',
            });

            const costText = this.add.text(shopWidth - 40, y + 10, `Cost: ${Math.ceil(currentCost)}`, {
                fontSize: '16px',
                color: canAfford ? SHOP_ACCENT_COLOR : SHOP_TEXT_COLOR_DARK,
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            }).setOrigin(1, 0);

            const buyButton = this.add.graphics();
            const buttonRect = new Phaser.Geom.Rectangle(shopWidth - 140, y + 55, 100, 35);

            const drawButton = (color: number) => {
                buyButton.clear().fillStyle(color).fillRoundedRect(buttonRect.x, buttonRect.y, buttonRect.width, buttonRect.height, 10);
            };

            drawButton(canAfford ? SHOP_BUY_BUTTON_COLOR : SHOP_DISABLED_BUTTON_COLOR);

            const buyButtonText = this.add.text(shopWidth - 90, y + 72, 'BUY', {
                fontSize: '18px',
                color: canAfford ? SHOP_TEXT_COLOR : SHOP_TEXT_COLOR_DARK,
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            }).setOrigin(0.5);


            if (canAfford) {
                buyButton.setInteractive({ hitArea: buttonRect, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })
                    .on('pointerdown', () => this.purchaseUpgrade(upgrade))
                    .on('pointerover', () => drawButton(SHOP_BUY_BUTTON_COLOR_HOVER))
                    .on('pointerout', () => drawButton(SHOP_BUY_BUTTON_COLOR));
            }

            this.upgradesContainer.add([nameText, descText, costText, buyButton, buyButtonText]);
        });

        const totalHeight = categoryUpgrades.length * 110;
        const visibleHeight = this.cameras.main.height - 200;

        if (totalHeight > visibleHeight) {
            this.scrollMaxY = 200;
            this.scrollMinY = 200 - (totalHeight - visibleHeight);
        } else {
            this.scrollMinY = 200;
            this.scrollMaxY = 200;
        }
    }

    private purchaseUpgrade(upgrade: Upgrade) {
        const light = GameManager.getLight();
        const currentCost = upgrade.id === 'sale' ? upgrade.cost : Math.ceil(upgrade.cost * GameManager.saleModifier);

        if (light >= currentCost) {
            GameManager.setLight(light - currentCost);
            GameManager.applyUpgrade(upgrade.id);

            if (upgrade.costIncrease === 1) {
                upgrade.cost = Infinity;
            } else {
                upgrade.cost = Math.ceil(upgrade.cost * upgrade.costIncrease);
            }

            this.showUpgrades(this.currentCategory);
        }
    }

    private updateLightText() {
        const lightValue = `Light: ${Math.floor(GameManager.getLight())}`;
        if (this.shopLightText) {
            this.shopLightText.setText(lightValue);
        }
    }

    private addHoverEffect(image: Phaser.GameObjects.Image) {
        image.on('pointerover', () => {
            this.tweens.add({
                targets: image,
                scale: 0.06,
                duration: 100,
                ease: 'Linear'
            });
        });

        image.on('pointerout', () => {
            this.tweens.add({
                targets: image,
                scale: 0.05,
                duration: 100,
                ease: 'Linear'
            });
        });
    }
}
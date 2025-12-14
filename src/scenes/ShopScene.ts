import Phaser from 'phaser';
import { upgrades } from '../data/upgrades';
import GameManager from '../GameManager';

type UpgradeCategory = keyof typeof upgrades;
type Upgrade = (typeof upgrades)[UpgradeCategory][0];

const BORDER_COLOR = 0x5b6d84;
const BG_COLOR = 0x1a2130;
const TAB_BG_COLOR = 0x2a3140;
const TEXT_COLOR = '#FFFFFF';
const TEXT_COLOR_MEDIUM = '#D1D5DB';
const TEXT_COLOR_DARK = '#6B7280';
const ACCENT_COLOR = '#FBBF24';
const BUY_BUTTON_COLOR = 0x10b981;
const BUY_BUTTON_COLOR_HOVER = 0x34d399;
const DISABLED_BUTTON_COLOR = 0x4b5563;

export class ShopScene extends Phaser.Scene {
    private upgradesContainer!: Phaser.GameObjects.Container;
    private currentCategory: UpgradeCategory = 'offensive';
    private lightText!: Phaser.GameObjects.Text;
    private tabs: { [key in UpgradeCategory]?: Phaser.GameObjects.Text } = {};
    private tabIndicator!: Phaser.GameObjects.Graphics;
    private scrollMinY = 0;
    private scrollMaxY = 0;

    constructor() {
        super('ShopScene');
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
            .text(width / 2, 40, 'Lighthouse Upgrades', {
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

        this.lightText = this.add
            .text(width / 2, 80, '', {
                fontSize: '24px',
                color: ACCENT_COLOR,
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);
        this.updateLightDisplay();

        const categories = Object.keys(upgrades) as UpgradeCategory[];
        const tabWidth = (width - 100) / categories.length;

        this.add
            .graphics()
            .fillStyle(TAB_BG_COLOR)
            .fillRect(50, 120, width - 100, 50);

        this.tabIndicator = this.add.graphics();

        categories.forEach((category, index) => {
            const tabX = 50 + index * tabWidth + tabWidth / 2;
            const tab = this.add
                .text(tabX, 145, category.toUpperCase(), {
                    fontSize: '20px',
                    color: TEXT_COLOR_MEDIUM,
                    fontStyle: 'bold',
                    fontFamily: 'PixelFont',
                })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            tab.on('pointerdown', () => {
                this.showUpgrades(category);
            });
            tab.on('pointerover', () => {
                if (this.currentCategory !== category) {
                    tab.setColor(TEXT_COLOR);
                }
            });
            tab.on('pointerout', () => {
                if (this.currentCategory !== category) {
                    tab.setColor(TEXT_COLOR_MEDIUM);
                }
            });

            this.tabs[category] = tab;
        });

        this.upgradesContainer = this.add.container(70, 200);

        const maskGraphics = this.make.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(0, 180, width, height - 230);
        const mask = maskGraphics.createGeometryMask();
        this.upgradesContainer.setMask(mask);

        this.input.on(
            'wheel',
            (
                pointer: Phaser.Input.Pointer,
                gameObjects: Phaser.GameObjects.GameObject[],
                deltaX: number,
                deltaY: number,
            ) => {
                if (this.scrollMinY !== this.scrollMaxY) {
                    this.upgradesContainer.y -= deltaY * 0.5;
                    this.upgradesContainer.y = Phaser.Math.Clamp(
                        this.upgradesContainer.y,
                        this.scrollMinY,
                        this.scrollMaxY,
                    );
                }
            },
        );

        this.showUpgrades(this.currentCategory);
    }

    private updateLightDisplay() {
        const light = GameManager.getLight();
        this.lightText.setText(`Light: ${Math.floor(light)}`);
    }

    private showUpgrades(category: UpgradeCategory) {
        this.currentCategory = category;
        this.upgradesContainer.removeAll(true);
        this.updateLightDisplay();
        this.upgradesContainer.y = 200;

        const categories = Object.keys(upgrades) as UpgradeCategory[];
        const tabWidth = (this.cameras.main.width - 100) / categories.length;
        const activeIndex = categories.indexOf(category);

        this.tabIndicator
            .clear()
            .fillStyle(0xfbbf24)
            .fillRect(50 + activeIndex * tabWidth, 165, tabWidth, 5);

        for (const cat in this.tabs) {
            if (this.tabs[cat as UpgradeCategory]) {
                this.tabs[cat as UpgradeCategory]!.setColor(cat === category ? TEXT_COLOR : TEXT_COLOR_MEDIUM);
            }
        }

        const categoryUpgrades = upgrades[category];
        const light = GameManager.getLight();

        categoryUpgrades.forEach((upgrade, index) => {
            const y = index * 100;

            const currentCost =
                upgrade.id === 'sale' ? upgrade.cost : Math.ceil(upgrade.cost * GameManager.saleModifier);
            const canAfford = light >= currentCost;

            const nameText = this.add.text(0, y, upgrade.name, {
                fontSize: '22px',
                color: TEXT_COLOR,
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            });

            const descText = this.add.text(0, y + 28, upgrade.description, {
                fontSize: '16px',
                color: TEXT_COLOR_MEDIUM,
                wordWrap: { width: this.cameras.main.width - 300 },
                fontFamily: 'PixelFont',
            });

            const costText = this.add
                .text(this.cameras.main.width - 200, y + 15, `Cost: ${Math.ceil(currentCost)}`, {
                    fontSize: '18px',
                    color: canAfford ? ACCENT_COLOR : TEXT_COLOR_DARK,
                    fontStyle: 'bold',
                    fontFamily: 'PixelFont',
                })
                .setOrigin(1, 0);

            const buyButton = this.add.graphics();
            const buttonRect = new Phaser.Geom.Rectangle(this.cameras.main.width - 210, y + 45, 120, 40);

            const drawButton = (color: number) => {
                buyButton
                    .clear()
                    .fillStyle(color)
                    .fillRoundedRect(buttonRect.x, buttonRect.y, buttonRect.width, buttonRect.height, 10);
            };

            drawButton(canAfford ? BUY_BUTTON_COLOR : DISABLED_BUTTON_COLOR);

            const buyButtonText = this.add
                .text(this.cameras.main.width - 150, y + 65, 'BUY', {
                    fontSize: '20px',
                    color: canAfford ? TEXT_COLOR : TEXT_COLOR_DARK,
                    fontStyle: 'bold',
                    fontFamily: 'PixelFont',
                })
                .setOrigin(0.5);

            if (canAfford) {
                buyButton
                    .setInteractive({
                        hitArea: buttonRect,
                        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                        useHandCursor: true,
                    })
                    .on('pointerdown', () => this.purchaseUpgrade(upgrade))
                    .on('pointerover', () => drawButton(BUY_BUTTON_COLOR_HOVER))
                    .on('pointerout', () => drawButton(BUY_BUTTON_COLOR));
            }

            this.upgradesContainer.add([nameText, descText, costText, buyButton, buyButtonText]);
        });

        const totalHeight = categoryUpgrades.length * 100;
        const visibleHeight = this.cameras.main.height - 230;

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
}

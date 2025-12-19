import Phaser from 'phaser';
import PrestigeManager from '../managers/PrestigeManager';
import { ARCHETYPES, ArchetypeID } from '../data/archetypes';
import { RELICS } from '../data/relics';
import GameManager from '../GameManager';

const BG_COLOR = 0x0f172a;
const ACCENT_COLOR = '#818CF8';
const TEXT_COLOR = '#F1F5F9';
const BORDER_COLOR = 0x334155;
const BUTTON_COLOR = 0x4f46e5;
const BUTTON_HOVER_COLOR = 0x6366f1;

export default class PrestigeScene extends Phaser.Scene {
    private aetherText!: Phaser.GameObjects.Text;
    private container!: Phaser.GameObjects.Container;
    private currentTab: 'archetypes' | 'relics' = 'archetypes';
    private fromTitle: boolean = false;

    constructor() {
        super('PrestigeScene');
    }

    create(data?: { fromTitle?: boolean }) {
        this.fromTitle = data?.fromTitle ?? false;
        const { width, height } = this.cameras.main;

        this.add.graphics().fillStyle(BG_COLOR, 1).fillRect(0, 0, width, height);

        this.add
            .text(width / 2, 40, "The Keeper's Path", {
                fontSize: '32px',
                color: ACCENT_COLOR,
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);

        const closeBtn = this.add
            .text(width - 40, 40, 'X', {
                fontSize: '28px',
                color: TEXT_COLOR,
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            if (this.fromTitle) {
                this.scene.resume('TitleScene');
            } else {
                this.scene.resume('GameScene');
            }
        });

        this.aetherText = this.add
            .text(width / 2, 80, `Aether: ${PrestigeManager.aether}`, {
                fontSize: '24px',
                color: '#A78BFA',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);

        this.createTabs(width);

        this.container = this.add.container(0, 150);

        this.refreshContent();

        if (!this.fromTitle) {
            this.createRebirthButton(width, height);
        }
    }

    private createTabs(width: number) {
        const tabY = 120;
        const tabWidth = 200;

        const archetypesTab = this.add
            .text(width / 2 - 100, tabY, 'ARCHETYPES', {
                fontSize: '20px',
                color: this.currentTab === 'archetypes' ? ACCENT_COLOR : '#64748B',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const relicsTab = this.add
            .text(width / 2 + 100, tabY, 'RELICS', {
                fontSize: '20px',
                color: this.currentTab === 'relics' ? ACCENT_COLOR : '#64748B',
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        archetypesTab.on('pointerdown', () => {
            this.currentTab = 'archetypes';
            this.refreshContent();
            archetypesTab.setColor(ACCENT_COLOR);
            relicsTab.setColor('#64748B');
        });

        relicsTab.on('pointerdown', () => {
            this.currentTab = 'relics';
            this.refreshContent();
            relicsTab.setColor(ACCENT_COLOR);
            archetypesTab.setColor('#64748B');
        });
    }

    private refreshContent() {
        this.container.removeAll(true);
        if (this.currentTab === 'archetypes') {
            this.showArchetypes();
        } else {
            this.showRelics();
        }
        this.aetherText.setText(`Aether: ${PrestigeManager.aether}`);
    }

    private showArchetypes() {
        const { width } = this.cameras.main;
        let y = 0;

        Object.values(ARCHETYPES).forEach((arch) => {
            const isUnlocked = PrestigeManager.unlockedArchetypes.includes(arch.id);
            const isActive = PrestigeManager.activeArchetype === arch.id;
            const canAfford = PrestigeManager.aether >= arch.cost;

            const cardBg = this.add.graphics();
            cardBg.fillStyle(isActive ? 0x312e81 : 0x1e293b);
            cardBg.lineStyle(2, isActive ? 0x818cf8 : isUnlocked ? 0x64748b : 0x334155);
            cardBg.fillRoundedRect(width / 2 - 250, y, 500, 150, 10);
            cardBg.strokeRoundedRect(width / 2 - 250, y, 500, 150, 10);

            const name = this.add.text(width / 2 - 230, y + 15, arch.name, {
                fontSize: '20px',
                color: '#F472B6',
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            });

            const descText =
                arch.cost > 0 && !isUnlocked
                    ? `${arch.description}\nCost: ${arch.cost} Aether\nPassive: ${arch.passiveDescription}`
                    : `${arch.description}\nPassive: ${arch.passiveDescription}\nActive: ${arch.activeAbilityDescription}`;

            const desc = this.add.text(width / 2 - 230, y + 45, descText, {
                fontSize: '12px',
                color: '#CBD5E1',
                wordWrap: { width: 350 },
                fontFamily: 'PixelFont',
            });

            this.container.add([cardBg, name, desc]);

            if (isUnlocked) {
                if (!isActive) {
                    const btnX = width / 2 + 150;
                    const btnY = y + 30;
                    const btnW = 100;
                    const btnH = 40;

                    const btn = this.add.graphics();
                    btn.fillStyle(0x4f46e5);
                    btn.fillRoundedRect(btnX, btnY, btnW, btnH, 5);
                    btn.lineStyle(2, 0xffffff);
                    btn.strokeRoundedRect(btnX, btnY, btnW, btnH, 5);

                    const btnText = this.add
                        .text(btnX + btnW / 2, btnY + btnH / 2, 'SELECT', {
                            fontSize: '14px',
                            fontFamily: 'PixelFont',
                            color: '#FFFFFF',
                        })
                        .setOrigin(0.5);

                    const clickZone = this.add
                        .zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
                        .setInteractive({ useHandCursor: true })
                        .on('pointerdown', () => {
                            PrestigeManager.setArchetype(arch.id);
                            if (!this.fromTitle) {
                                GameManager.refreshPrestigeModifiers();
                            }
                            this.refreshContent();
                        });

                    this.container.add([btn, btnText, clickZone]);
                } else {
                    const activeText = this.add
                        .text(width / 2 + 190, y + 50, 'ACTIVE', {
                            color: '#4ADE80',
                            fontSize: '16px',
                            fontFamily: 'PixelFont',
                            fontStyle: 'bold',
                        })
                        .setOrigin(0.5);
                    this.container.add(activeText);
                }
            } else {
                const btnX = width / 2 + 150;
                const btnY = y + 30;
                const btnW = 80;
                const btnH = 40;

                const btn = this.add.graphics();
                btn.fillStyle(canAfford ? 0x10b981 : 0x475569);
                btn.fillRoundedRect(btnX, btnY, btnW, btnH, 5);

                if (canAfford) {
                    btn.lineStyle(2, 0xffffff);
                    btn.strokeRoundedRect(btnX, btnY, btnW, btnH, 5);
                }

                const btnText = this.add
                    .text(btnX + btnW / 2, btnY + btnH / 2, `Buy ${arch.cost}`, {
                        fontSize: '14px',
                        fontFamily: 'PixelFont',
                        color: '#FFFFFF',
                    })
                    .setOrigin(0.5);

                if (canAfford) {
                    const clickZone = this.add
                        .zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
                        .setInteractive({ useHandCursor: true })
                        .on('pointerdown', () => {
                            if (PrestigeManager.unlockArchetype(arch.id)) {
                                this.refreshContent();
                            }
                        });
                    this.container.add(clickZone);
                }
                this.container.add([btn, btnText]);
            }

            y += 170;
        });
    }

    private showRelics() {
        const { width } = this.cameras.main;
        let y = 0;

        RELICS.forEach((relic) => {
            const isUnlocked = PrestigeManager.unlockedRelics.includes(relic.id);
            const isActive = PrestigeManager.activeRelics.includes(relic.id);
            const canAfford = PrestigeManager.aether >= relic.cost;

            const cardBg = this.add.graphics();
            cardBg.fillStyle(isUnlocked ? (isActive ? 0x064e3b : 0x0f172a) : 0x1e293b);
            cardBg.lineStyle(2, isUnlocked ? (isActive ? 0x34d399 : 0x475569) : 0x334155);
            cardBg.fillRoundedRect(width / 2 - 250, y, 500, 150, 10);
            cardBg.strokeRoundedRect(width / 2 - 250, y, 500, 150, 10);

            const name = this.add.text(width / 2 - 230, y + 15, relic.name, {
                fontSize: '20px',
                color: '#FBBF24',
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            });

            const desc = this.add.text(
                width / 2 - 230,
                y + 45,
                `${relic.description}\nEffect: ${relic.effectDescription}`,
                {
                    fontSize: '12px',
                    color: '#CBD5E1',
                    wordWrap: { width: 350 },
                    fontFamily: 'PixelFont',
                },
            );

            this.container.add([cardBg, name, desc]);

            if (!isUnlocked) {
                const btnX = width / 2 + 150;
                const btnY = y + 30;
                const btnW = 80;
                const btnH = 40;

                const btn = this.add.graphics();
                btn.fillStyle(canAfford ? 0x10b981 : 0x475569);
                btn.fillRoundedRect(btnX, btnY, btnW, btnH, 5);

                if (canAfford) {
                    btn.lineStyle(2, 0xffffff);
                    btn.strokeRoundedRect(btnX, btnY, btnW, btnH, 5);
                }

                const btnText = this.add
                    .text(btnX + btnW / 2, btnY + btnH / 2, `Buy ${relic.cost}`, {
                        fontSize: '14px',
                        fontFamily: 'PixelFont',
                        color: '#FFFFFF',
                    })
                    .setOrigin(0.5);

                if (canAfford) {
                    const clickZone = this.add
                        .zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
                        .setInteractive({ useHandCursor: true })
                        .on('pointerdown', () => {
                            if (PrestigeManager.unlockRelic(relic.id)) {
                                this.refreshContent();
                            }
                        });
                    this.container.add(clickZone);
                }

                this.container.add([btn, btnText]);
            } else {
                const btnX = width / 2 + 150;
                const btnY = y + 30;
                const btnW = 150;
                const btnH = 40;

                const btn = this.add.graphics();
                btn.fillStyle(isActive ? 0xef4444 : 0x10b981);
                btn.fillRoundedRect(btnX, btnY, btnW, btnH, 5);
                btn.lineStyle(2, 0xffffff);
                btn.strokeRoundedRect(btnX, btnY, btnW, btnH, 5);

                const btnText = this.add
                    .text(btnX + btnW / 2, btnY + btnH / 2, isActive ? 'DEACTIVATE' : 'ACTIVATE', {
                        fontSize: '14px',
                        fontFamily: 'PixelFont',
                        color: '#FFFFFF',
                    })
                    .setOrigin(0.5);

                const clickZone = this.add
                    .zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => {
                        PrestigeManager.toggleRelic(relic.id);
                        if (!this.fromTitle) {
                            GameManager.refreshPrestigeModifiers();
                        }
                        this.refreshContent();
                    });

                this.container.add([btn, btnText, clickZone]);
            }

            y += 170;
        });
    }

    private createRebirthButton(width: number, height: number) {
        const currentWave = GameManager.waveNumber;
        const canPrestige = currentWave >= 10;

        const btnW = 400;
        const btnH = 50;
        const btnX = width / 2 - btnW / 2;
        const btnY = height - 90;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(canPrestige ? 0xdc2626 : 0x4b5563);
        btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);

        const btnText = this.add
            .text(width / 2, btnY + btnH / 2, canPrestige ? `PRESTIGE (+1 Aether)` : `Wave ${currentWave}/10`, {
                fontSize: '18px',
                fontStyle: 'bold',
                color: canPrestige ? '#FFFFFF' : '#9CA3AF',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5);

        if (!canPrestige) {
            this.add
                .text(width / 2, btnY - 25, 'Reach Wave 10 to Prestige', {
                    fontSize: '16px',
                    color: '#9CA3AF',
                    fontFamily: 'PixelFont',
                })
                .setOrigin(0.5);
        }

        if (canPrestige) {
            const zone = this.add
                .zone(width / 2, btnY + btnH / 2, btnW, btnH)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.showConfirmModal();
                });
        }
    }

    private showConfirmModal() {
        const { width, height } = this.cameras.main;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(100);

        const modalW = 500;
        const modalH = 280;
        const modalX = width / 2 - modalW / 2;
        const modalY = height / 2 - modalH / 2;

        const modal = this.add.graphics();
        modal.fillStyle(0x1e293b);
        modal.fillRoundedRect(modalX, modalY, modalW, modalH, 15);
        modal.lineStyle(2, 0x818cf8);
        modal.strokeRoundedRect(modalX, modalY, modalW, modalH, 15);
        modal.setDepth(101);

        const title = this.add
            .text(width / 2, modalY + 40, 'Confirm Prestige', {
                fontSize: '28px',
                color: '#F472B6',
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setDepth(102);

        const message = this.add
            .text(width / 2, modalY + 110, 'You will lose all current progress\nbut gain 1 Aether.', {
                fontSize: '18px',
                color: '#CBD5E1',
                align: 'center',
                fontFamily: 'PixelFont',
                wordWrap: { width: modalW - 60 },
            })
            .setOrigin(0.5)
            .setDepth(102);

        const btnWidth = 140;
        const btnHeight = 50;
        const btnY = modalY + 190;

        const confirmBtn = this.add.graphics();
        confirmBtn.fillStyle(0xdc2626);
        confirmBtn.fillRoundedRect(width / 2 - btnWidth - 15, btnY, btnWidth, btnHeight, 10);
        confirmBtn.setDepth(102);

        const confirmText = this.add
            .text(width / 2 - btnWidth / 2 - 15, btnY + btnHeight / 2, 'PRESTIGE', {
                fontSize: '14px',
                color: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setDepth(102);

        const confirmZone = this.add
            .zone(width / 2 - btnWidth / 2 - 15, btnY + btnHeight / 2, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true })
            .setDepth(103)
            .on('pointerdown', () => {
                PrestigeManager.prestige();
                this.aetherText.setText(`Aether: ${PrestigeManager.aether}`);

                this.scene.stop('GameScene');
                this.scene.stop('UIScene');
                this.scene.start('GameScene');
                this.scene.start('UIScene');
                this.scene.stop();
            });

        const cancelBtn = this.add.graphics();
        cancelBtn.fillStyle(0x4b5563);
        cancelBtn.fillRoundedRect(width / 2 + 15, btnY, btnWidth, btnHeight, 10);
        cancelBtn.setDepth(102);

        const cancelText = this.add
            .text(width / 2 + btnWidth / 2 + 15, btnY + btnHeight / 2, 'CANCEL', {
                fontSize: '18px',
                color: '#FFFFFF',
                fontFamily: 'PixelFont',
            })
            .setOrigin(0.5)
            .setDepth(102);

        const cancelZone = this.add
            .zone(width / 2 + btnWidth / 2 + 15, btnY + btnHeight / 2, btnWidth, btnHeight)
            .setInteractive({ useHandCursor: true })
            .setDepth(103)
            .on('pointerdown', () => {
                overlay.destroy();
                modal.destroy();
                title.destroy();
                message.destroy();
                confirmBtn.destroy();
                confirmText.destroy();
                confirmZone.destroy();
                cancelBtn.destroy();
                cancelText.destroy();
                cancelZone.destroy();
            });
    }
}

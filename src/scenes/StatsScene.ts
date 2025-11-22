import Phaser from 'phaser';
import GameManager from '../GameManager';

const BORDER_COLOR = 0x5B6D84;
const BG_COLOR = 0x1A2130;
const TEXT_COLOR = '#FFFFFF';
const ACCENT_COLOR = '#FBBF24';

export class StatsScene extends Phaser.Scene {
    private statsContainer!: Phaser.GameObjects.Container;
    private scrollMinY = 0;
    private scrollMaxY = 0;

    constructor() {
        super('StatsScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.graphics()
            .fillStyle(BG_COLOR, 0.95)
            .fillRect(0, 0, width, height)
            .lineStyle(2, BORDER_COLOR)
            .strokeRect(0, 0, width, height);

        this.add.text(width / 2, 40, 'Statistics', {
            fontSize: '32px',
            color: TEXT_COLOR,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const closeButton = this.add.text(width - 30, 30, 'X', {
            fontSize: '28px',
            color: TEXT_COLOR,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
        closeButton.on('pointerover', () => closeButton.setColor(ACCENT_COLOR));
        closeButton.on('pointerout', () => closeButton.setColor(TEXT_COLOR));

        this.statsContainer = this.add.container(0, 100);

        const maskGraphics = this.make.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(0, 100, width, height - 150);
        const mask = maskGraphics.createGeometryMask();
        this.statsContainer.setMask(mask);

        const stats = this.getStats();
        let y = 0;

        for (const category in stats) {
            const header = this.add.text(50, y, category, {
                fontSize: '24px',
                color: ACCENT_COLOR,
                fontStyle: 'bold',
            });
            this.statsContainer.add(header);
            y += 35;

            stats[category].forEach(stat => {
                const statText = this.add.text(70, y, `${stat.name}: ${stat.value}`, {
                    fontSize: '20px',
                    color: TEXT_COLOR,
                });
                this.statsContainer.add(statText);
                y += 30;
            });
            y += 15;
        }

        const totalHeight = y;
        const visibleHeight = height - 150;

        if (totalHeight > visibleHeight) {
            this.scrollMaxY = 100;
            this.scrollMinY = 100 - (totalHeight - visibleHeight + 50);
        } else {
            this.scrollMinY = 100;
            this.scrollMaxY = 100;
        }

        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
            if (this.scrollMinY !== this.scrollMaxY) {
                this.statsContainer.y -= deltaY * 0.5;
                this.statsContainer.y = Phaser.Math.Clamp(this.statsContainer.y, this.scrollMinY, this.scrollMaxY);
            }
        });
    }

    private getStats(): { [category: string]: { name: string, value: string }[] } {
        const gm = GameManager;
        return {
            'Offensive': [
                { name: 'Beam Radius', value: gm.lightRadius.toFixed(2) },
                { name: 'Beam Angle', value: gm.lightAngle.toFixed(2) },
                { name: 'Rotation Speed', value: gm.rotationSpeed.toFixed(2) },
                { name: 'Beam Penetration', value: gm.beamPenetration.toString() },
                { name: 'Beam Count', value: gm.lightBeamCount.toString() },
                { name: 'Chain Lightning Chance', value: `${(gm.chainLightningChance * 100).toFixed(0)}%` },
            ],
            'Defensive': [
                { name: 'Lighthouse Health', value: `${gm.lighthouseHealth.toFixed(0)} / ${gm.maxLighthouseHealth}` },
                { name: 'Lighthouse Health Regen', value: gm.lighthouseHealthRegen.toFixed(2) },
                { name: 'Tile Health', value: gm.tileHealth.toString() },
                { name: 'Slowing Pulse', value: gm.hasSlowingPulse ? `Active (${gm.slowingPulseSlowFactor.toFixed(2)} slow)` : 'Inactive' },
                { name: 'Auto Builder', value: gm.hasAutoBuilder ? 'Active' : 'Inactive' },
            ],
            'Economic': [
                { name: 'Light per Second', value: gm.lightPerSecond.toFixed(2) },
                { name: 'Wave Fragments Modifier', value: gm.waveFragmentsModifier.toFixed(2) },
                { name: 'Kinetic Siphon Modifier', value: gm.kineticSiphonModifier.toFixed(2) },
                { name: 'Tidal Force Modifier', value: gm.tidalForceModifier.toFixed(2) },
                { name: 'Light Multiplier', value: `x${gm.lightMultiplier}` },
                { name: 'Auto Light Collector', value: `${gm.autoLightCollectorRate.toFixed(2)}/sec` },
                { name: 'Light Interest Rate', value: `${(gm.lightInterestRate * 100).toFixed(2)}%` },
            ],
            'Energy': [
                { name: 'Energy', value: `${gm.currentEnergy.toFixed(0)} / ${gm.maxEnergy}` },
                { name: 'Energy per Click', value: gm.energyPerClick.toFixed(2) },
                { name: 'Energy Drain Rate', value: gm.energyDrainRate.toFixed(2) },
                { name: 'Auto Energy Collector', value: `${gm.autoEnergyCollectorRate.toFixed(2)}/sec` },
                { name: 'Overcharge Chance', value: `${(gm.overchargeChance * 100).toFixed(0)}%` },
            ],
            'Wave': [
                { name: 'Wave Number', value: gm.waveNumber.toString() },
            ]
        };
    }
}

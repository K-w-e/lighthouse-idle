import Phaser from "phaser";
import GameManager from "../GameManager";

const BORDER_COLOR = 0x5b6d84;
const BG_COLOR = 0x1a2130;
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#FBBF24";

export class StatsScene extends Phaser.Scene {
    private statsContainer!: Phaser.GameObjects.Container;

    constructor() {
        super("StatsScene");
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
            .text(width / 2, 40, "Statistics", {
                fontSize: "32px",
                color: TEXT_COLOR,
                fontStyle: "bold",
                fontFamily: "PixelFont",
            })
            .setOrigin(0.5);

        const closeButton = this.add
            .text(width - 30, 30, "X", {
                fontSize: "28px",
                color: TEXT_COLOR,
                fontFamily: "PixelFont",
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        closeButton.on("pointerdown", () => {
            this.scene.stop();
            this.scene.resume("GameScene");
        });
        closeButton.on("pointerover", () => closeButton.setColor(ACCENT_COLOR));
        closeButton.on("pointerout", () => closeButton.setColor(TEXT_COLOR));

        this.statsContainer = this.add.container(0, 100);

        const stats = this.getStats();
        const categories = ["Offensive", "Defensive", "Economic", "Energy"];
        const cellWidth = width / 2;
        const cellHeight = (height - 150) / 2;
        let categoryIndex = 0;

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                if (categoryIndex >= categories.length) break;

                const category = categories[categoryIndex];
                const categoryStats = stats[category];

                const x = col * cellWidth;
                const y = row * cellHeight;

                const cellContainer = this.add.container(x, y);
                this.statsContainer.add(cellContainer);

                const header = this.add
                    .text(cellWidth / 2, 20, category, {
                        fontSize: "24px",
                        color: ACCENT_COLOR,
                        fontStyle: "bold",
                        fontFamily: "PixelFont",
                    })
                    .setOrigin(0.5);
                cellContainer.add(header);

                let statY = 60;
                categoryStats.forEach((stat) => {
                    const statText = this.add.text(
                        40,
                        statY,
                        `${stat.name}: ${stat.value}`,
                        {
                            fontSize: "18px",
                            color: TEXT_COLOR,
                            fontFamily: "PixelFont",
                        },
                    );
                    cellContainer.add(statText);
                    statY += 30;
                });
                categoryIndex++;
            }
        }
    }

    private getStats(): {
        [category: string]: { name: string; value: string }[];
    } {
        const gm = GameManager;
        return {
            Offensive: [
                { name: "Beam Radius", value: gm.lightRadius.toFixed(2) },
                { name: "Beam Angle", value: gm.lightAngle.toFixed(2) },
                { name: "Rotation Speed", value: gm.rotationSpeed.toFixed(2) },
                {
                    name: "Beam Penetration",
                    value: gm.beamPenetration.toString(),
                },
                { name: "Beam Count", value: gm.lightBeamCount.toString() },
                {
                    name: "Chain Lightning Chance",
                    value: `${(gm.chainLightningChance * 100).toFixed(0)}%`,
                },
            ],
            Defensive: [
                {
                    name: "Lighthouse Health",
                    value: `${gm.lighthouseHealth.toFixed(0)} / ${gm.maxLighthouseHealth}`,
                },
                {
                    name: "Lighthouse Health Regen",
                    value: gm.lighthouseHealthRegen.toFixed(2),
                },
                { name: "Tile Health", value: gm.tileHealth.toString() },
                {
                    name: "Slowing Pulse",
                    value: gm.hasSlowingPulse
                        ? `Active (${gm.slowingPulseSlowFactor.toFixed(2)} slow)`
                        : "Inactive",
                },
                {
                    name: "Auto Builder",
                    value: gm.hasAutoBuilder ? "Active" : "Inactive",
                },
            ],
            Economic: [
                {
                    name: "Light per Second",
                    value: gm.lightPerSecond.toFixed(2),
                },
                {
                    name: "Wave Fragments Modifier",
                    value: gm.waveFragmentsModifier.toFixed(2),
                },
                {
                    name: "Kinetic Siphon Modifier",
                    value: gm.kineticSiphonModifier.toFixed(2),
                },
                {
                    name: "Tidal Force Modifier",
                    value: gm.tidalForceModifier.toFixed(2),
                },
                { name: "Light Multiplier", value: `x${gm.lightMultiplier}` },
                {
                    name: "Auto Light Collector",
                    value: `${gm.autoLightCollectorRate.toFixed(2)}/sec`,
                },
                {
                    name: "Light Interest Rate",
                    value: `${(gm.lightInterestRate * 100).toFixed(2)}%`,
                },
            ],
            Energy: [
                {
                    name: "Energy",
                    value: `${gm.currentEnergy.toFixed(0)} / ${gm.maxEnergy}`,
                },
                {
                    name: "Energy per Click",
                    value: gm.energyPerClick.toFixed(2),
                },
                {
                    name: "Energy Drain Rate",
                    value: gm.energyDrainRate.toFixed(2),
                },
                {
                    name: "Auto Energy Collector",
                    value: `${gm.autoEnergyCollectorRate.toFixed(2)}/sec`,
                },
                {
                    name: "Overcharge Chance",
                    value: `${(gm.overchargeChance * 100).toFixed(0)}%`,
                },
            ],
        };
    }
}

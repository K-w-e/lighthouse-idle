import Phaser from "phaser";

const BORDER_COLOR = 0x5b6d84;
const BG_COLOR = 0x1a2130;
const TEXT_COLOR = "#FFFFFF";
const ACCENT_COLOR = "#FBBF24";

export class TutorialScene extends Phaser.Scene {
    private contentContainer!: Phaser.GameObjects.Container;
    private scrollMinY = 0;
    private scrollMaxY = 0;

    constructor() {
        super("TutorialScene");
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
            .text(width / 2, 40, "How to Play", {
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
            this.scene.resume("TitleScene");
        });
        closeButton.on("pointerover", () => closeButton.setColor(ACCENT_COLOR));
        closeButton.on("pointerout", () => closeButton.setColor(TEXT_COLOR));

        this.contentContainer = this.add.container(0, 100);

        const maskGraphics = this.make.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(0, 100, width, height - 150);
        const mask = maskGraphics.createGeometryMask();
        this.contentContainer.setMask(mask);

        const tutorialText = this.getTutorialText();
        let y = 0;

        for (const section of tutorialText) {
            const header = this.add.text(50, y, section.title, {
                fontSize: "24px",
                color: ACCENT_COLOR,
                fontStyle: "bold",
                wordWrap: { width: width - 100 },
                fontFamily: "PixelFont",
            });
            this.contentContainer.add(header);
            y += 40;

            const content = this.add.text(50, y, section.content, {
                fontSize: "18px",
                color: TEXT_COLOR,
                wordWrap: { width: width - 100 },
                fontFamily: "PixelFont",
            });
            this.contentContainer.add(content);
            y += content.height + 30;
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

        this.input.on(
            "wheel",
            (
                pointer: Phaser.Input.Pointer,
                gameObjects: Phaser.GameObjects.GameObject[],
                deltaX: number,
                deltaY: number,
            ) => {
                if (this.scrollMinY !== this.scrollMaxY) {
                    this.contentContainer.y -= deltaY * 0.5;
                    this.contentContainer.y = Phaser.Math.Clamp(
                        this.contentContainer.y,
                        this.scrollMinY,
                        this.scrollMaxY,
                    );
                }
            },
        );
    }

    private getTutorialText(): { title: string; content: string }[] {
        return [
            {
                title: "Objective",
                content:
                    "You are the keeper of a mystical lighthouse. Your goal is to protect it from waves of shadowy creatures that emerge from the sea. Shine your light to vanquish them and gather their remnants to upgrade your lighthouse.",
            },
            {
                title: "The Light",
                content:
                    "The lighthouse beam is your primary weapon. It automatically rotates and damages any creature it touches. You can click and drag the light to manually aim it.",
            },
            {
                title: "Resources",
                content:
                    " - Light: Gathered automatically over time and by defeating creatures. Used to purchase upgrades.\n - Energy: Click the lighthouse to generate Energy. Energy is used for powerful abilities.",
            },
            {
                title: "Upgrades",
                content:
                    "Spend your Light in the Shop (the coin icon) to buy permanent upgrades for your lighthouse, improving its offensive, defensive, and economic capabilities.",
            },
            {
                title: "Waves",
                content:
                    "Creatures attack in waves. Each wave is stronger than the last. Survive as long as you can!",
            },
            {
                title: "The Tiles",
                content:
                    "The ground around your lighthouse is made of tiles. Creatures will damage these tiles. If a tile is destroyed, you can rebuild it by clicking on it, which costs Light.",
            },
        ];
    }
}

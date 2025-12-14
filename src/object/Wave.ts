import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import GameManager from '../GameManager';

export class Wave extends Phaser.GameObjects.Container {
    declare body: Phaser.Physics.Arcade.Body;
    health: number = 1;
    maxHealth: number = 1;
    gameScene: GameScene;
    lighthouse!: Phaser.GameObjects.Sprite;

    private graphics!: Phaser.GameObjects.Graphics;
    public waveWidth: number = 0;
    private waveAmplitude: number = 0;
    private waveFrequency: number = 0;
    private foamPositions: { x: number; y: number; alpha: number }[] = [];
    public collisionSegments: Phaser.GameObjects.Zone[] = [];
    private time: number = 0;
    private pixelSize: number = 4;
    private waveHeight: number = 20;
    private bodyHeight: number = 30;
    private foamDrift: number = 0.5;
    private foamYSpeed: number = 0.1;
    private foamFade: number = 0.008;
    private foamFrequency: number = 0.01;
    private foamMinY: number = 5;
    private foamMaxY: number = 15;
    private foamMinAlpha: number = 0.3;
    private foamMaxAlpha: number = 0.8;
    private foamYSpread: number = 25;
    private minSlowFactor: number = 0.2;
    private slowedSpeed: number = 0.5;
    private timeSpeed: number = 0.1;
    private waveFrequency2: number = 0.75;
    private waveAmplitude2: number = 0.5;
    private foamCountFactor: number = 3;
    private minWaveWidth: number = 20;
    private maxWaveWidth: number = 100;
    private minWaveAmplitude: number = 5;
    private maxWaveAmplitude: number = 15;
    private minWaveFrequency: number = 0.01;
    private maxWaveFrequency: number = 0.03;
    private waveHeightFactor: number = 1.5;
    private waveColor: number = 0x1b2631;
    private crestColor: number = 0x4a6572;
    private foamColor: number = 0xd2b48c;

    private isSlowed: boolean = false;
    private slowTimer: number = 0;
    private originalSpeed: number = 50;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.gameScene = scene as GameScene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.graphics = this.scene.add.graphics();
        this.add(this.graphics);
    }

    setup(lighthouse: Phaser.GameObjects.Sprite) {
        this.lighthouse = lighthouse;
        this.setActive(true);
        this.setVisible(true);

        this.originalSpeed = 50;
        this.maxHealth = 1;
        this.waveColor = 0x1b2631;
        this.crestColor = 0x4a6572;
        this.health = this.maxHealth;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.lighthouse.x, this.lighthouse.y);
        this.setRotation(angle + Math.PI / 2);
        this.waveWidth = Phaser.Math.Between(this.minWaveWidth, this.maxWaveWidth);

        this.waveAmplitude = Phaser.Math.Between(this.minWaveAmplitude, this.maxWaveAmplitude);
        this.waveFrequency = Phaser.Math.FloatBetween(this.minWaveFrequency, this.maxWaveFrequency);
        this.waveHeight = this.waveAmplitude * this.waveHeightFactor;
        const foamCount = this.waveWidth / this.foamCountFactor;
        this.foamPositions = [];
        for (let i = 0; i < foamCount; i++) {
            this.foamPositions.push({
                x: Phaser.Math.FloatBetween(-this.waveWidth / 2, this.waveWidth / 2),
                y: Phaser.Math.FloatBetween(this.foamMinY, this.foamYSpread),
                alpha: Phaser.Math.FloatBetween(this.foamMinAlpha, this.foamMaxAlpha),
            });
        }

        const segments = Math.max(3, Math.floor(this.waveWidth / 20));
        const segmentSpacing = this.waveWidth / (segments - 1);

        this.collisionSegments.forEach((seg) => seg.destroy());
        this.collisionSegments = [];

        for (let i = 0; i < segments; i++) {
            const xOffset = -this.waveWidth / 2 + i * segmentSpacing;
            const segment = this.scene.add.zone(xOffset, 0, 20, 20);
            this.scene.physics.add.existing(segment);
            const body = segment.body as Phaser.Physics.Arcade.Body;
            body.setCircle(10);
            body.setOffset(-10, -10);

            this.add(segment);
            this.collisionSegments.push(segment);
        }

        const radius = Math.min(10, this.waveHeight);
        this.body.setCircle(radius);
        this.body.setOffset(-radius, -radius);

        this.drawWave();
    }

    drawWave() {
        this.graphics.clear();

        const points: { x: number; y: number; taper: number }[] = [];
        const halfWidth = this.waveWidth / 2;

        for (let i = -halfWidth; i <= halfWidth; i += this.pixelSize) {
            const normalizedPos = Math.abs(i) / halfWidth;
            const taper = 1 - Math.pow(normalizedPos, 2.5);

            const y1 = Math.sin((i + this.time) * this.waveFrequency) * this.waveAmplitude;
            const y2 =
                Math.sin((i + this.time) * this.waveFrequency * this.waveFrequency2) *
                (this.waveAmplitude * this.waveAmplitude2);
            const y = (y1 + y2) * taper;
            points.push({ x: i, y: y, taper: taper });
        }

        if (points.length === 0) return;

        this.graphics.lineTo(halfWidth, 20);
        this.graphics.lineTo(-halfWidth, 20);
        this.graphics.closePath();
        this.graphics.fillPath();

        this.graphics.fillStyle(this.crestColor, 1);
        for (let i = 0; i < points.length; i++) {
            if (points[i].taper > 0.1) {
                this.graphics.fillRect(points[i].x, points[i].y - 2, this.pixelSize, 4);
            }
        }

        this.graphics.fillStyle(this.foamColor);
        this.foamPositions.forEach((pos) => {
            const normalizedPos = Math.abs(pos.x) / halfWidth;
            if (normalizedPos > 1) return;

            const taper = 1 - Math.pow(normalizedPos, 2.5);
            const y1 = Math.sin((pos.x + this.time) * this.waveFrequency) * this.waveAmplitude;
            const y2 =
                Math.sin((pos.x + this.time) * this.waveFrequency * this.waveFrequency2) *
                (this.waveAmplitude * this.waveAmplitude2);
            const waveY = (y1 + y2) * taper;

            this.graphics.setAlpha(Math.max(0.3, pos.alpha * taper));
            const x = Math.floor(pos.x / this.pixelSize) * this.pixelSize;
            const finalY = Math.floor((pos.y + waveY) / this.pixelSize) * this.pixelSize;
            this.graphics.fillRect(x, finalY, this.pixelSize, this.pixelSize);
        });
    }

    update(time: number, delta: number) {
        this.time += delta * this.timeSpeed;

        this.foamPositions.forEach((pos) => {
            pos.x += Math.sin(this.time * this.foamFrequency) * this.foamDrift;
            pos.y += this.foamYSpeed;
            pos.alpha -= this.foamFade;

            if (pos.alpha <= 0) {
                pos.y = Phaser.Math.FloatBetween(this.foamMinY, this.foamMaxY);
                pos.x = Phaser.Math.FloatBetween(-this.waveWidth / 2, this.waveWidth / 2);
                pos.alpha = Phaser.Math.FloatBetween(this.foamMinAlpha, this.foamMaxAlpha);
            }
        });

        this.drawWave();

        if (this.isSlowed) {
            this.slowTimer -= delta;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
                this.body.velocity.normalize().scale(this.originalSpeed);
            }
        }

        if (this.lighthouse) {
            const currentSpeed =
                (this.isSlowed ? this.originalSpeed * this.slowedSpeed : this.originalSpeed) *
                GameManager.enemySpeedModifier;
            this.scene.physics.moveToObject(this, this.lighthouse, currentSpeed);
        }
    }

    public slowDown(factor: number, duration: number) {
        if (!this.isSlowed) {
            this.isSlowed = true;
            this.originalSpeed = this.originalSpeed * Math.max(this.minSlowFactor, 1 - factor);
        }
        this.slowTimer = duration;
    }
}

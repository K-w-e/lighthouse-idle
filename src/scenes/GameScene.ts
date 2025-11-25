import Phaser from 'phaser';
import { Wave } from '../object/Wave';
import UIScene from './UIScene';
import GameManager from '../GameManager';
import { SettingsManager } from '../utils/SettingsManager';
import { createLand, createVision, drawLight, getTileColor } from '../utils/draw';
import { FloatingText } from '../object/FloatingText';
import WaterPipeline from '../pipelines/WaterPipeline';

export default class GameScene extends Phaser.Scene {
    private lighthouse!: Phaser.GameObjects.Sprite;
    private uiScene!: UIScene;

    private visionCone!: Phaser.GameObjects.Graphics;

    private landRT!: Phaser.GameObjects.RenderTexture;
    private landTiles!: Phaser.Physics.Arcade.StaticGroup;
    private landRadius: number = 70;
    private landWaveCollider!: Phaser.Physics.Arcade.Collider;
    private landWaveSegmentCollider!: Phaser.Physics.Arcade.Collider;

    private waves!: Phaser.Physics.Arcade.Group;
    private waveSegments!: Phaser.Physics.Arcade.Group;
    private waveSpawnTimer!: Phaser.Time.TimerEvent;
    public waveSpawnDelay: number = 1000;
    private gameWidth = 800;
    private gameHeight = 900;
    private waveDestroyParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
    private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super('GameScene');
    }

    create() {
        const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        if (!renderer.pipelines.has('WaterPipeline')) {
            renderer.pipelines.addPostPipeline('WaterPipeline', WaterPipeline);
        }

        const bg = this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'background').setAlpha(0.5);
        bg.setPostPipeline('WaterPipeline');

        this.uiScene = this.scene.get('UIScene') as UIScene;
        GameManager.initialize(this, this.uiScene);

        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;

        this.lighthouse = this.add.sprite(centerX, centerY, 'lighthouse').setScale(5);
        this.lighthouse.setDepth(2);
        this.physics.add.existing(this.lighthouse, true);
        this.lighthouse.setInteractive({ useHandCursor: true });

        this.sound.play('bg_audio' + Phaser.Math.Between(1, 4), { loop: true, volume: SettingsManager.getInstance().musicVolume });

        const energyParticles = this.add.particles(0, 0, 'foam_block', {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: { min: 200, max: 500 },
            gravityY: 300,
            emitting: false,
            tint: 0xffff00,
        });

        this.lighthouse.on('pointerdown', () => {
            GameManager.handleLighthouseClick();
            if (SettingsManager.getInstance().particlesEnabled) {
                energyParticles.emitParticleAt(this.lighthouse.x, this.lighthouse.y, 16);
            }
        });

        this.waveDestroyParticles = this.add.particles(0, 0, 'foam_block', {
            speed: { min: -50, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: { min: 300, max: 600 },
            quantity: 20,
            emitting: false,
            tint: 0xADD8E6,
        });

        this.hitParticles = this.add.particles(0, 0, 'foam_block', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 200,
            quantity: 5,
            emitting: false,
            tint: 0xFFFFFF,
        });

        const { landRT, landTiles } = createLand(this, this.lighthouse, this.landRadius);
        this.landRT = landRT;
        this.landRT.setDepth(1).setAlpha(0.5);
        this.landTiles = landTiles;

        this.waves = this.physics.add.group({
            classType: Wave,
            runChildUpdate: true
        });

        this.waveSegments = this.physics.add.group();

        this.time.addEvent({
            delay: this.waveSpawnDelay,
            callback: this.spawnWave,
            callbackScope: this,
            loop: false
        });

        //@ts-ignore
        this.physics.add.overlap(this.waves, this.lighthouse, this.handleWaveLighthouseCollision, undefined, this);
        //@ts-ignore
        this.landWaveCollider = this.physics.add.overlap(this.waves, this.landTiles, this.handleWaveLandCollision, undefined, this);

        this.physics.add.overlap(this.waveSegments, this.lighthouse, (segment, lighthouse) => {
            const wave = (segment as any).parentContainer as Wave;
            if (wave && wave.active) this.handleWaveLighthouseCollision(lighthouse as Phaser.GameObjects.GameObject, wave);
        }, undefined, this);

        //@ts-ignore
        this.landWaveSegmentCollider = this.physics.add.overlap(this.waveSegments, this.landTiles, this.handleWaveSegmentLandCollision, undefined, this);

        this.events.on('applyUpgrade', this.applyUpgrade, this);

        this.events.on('waveDestroyed', (wave: Wave) => {
            GameManager.onWaveDestroyed(wave);
            new FloatingText(this, wave.x, wave.y, `+${GameManager.getWaveLightReward(wave)}`, '#FBBF24');
        });

        // Passive light generation
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                const activeWaves = this.waves.countActive(true);
                const tidalForceBonus = activeWaves * GameManager.tidalForceModifier;
                const interest = GameManager.getLight() * GameManager.lightInterestRate;
                const lightToAdd = (GameManager.lightPerSecond + tidalForceBonus + interest) * GameManager.lightMultiplier;
                GameManager.addLight(lightToAdd);
            },
            loop: true
        });

        // Passive energy generation
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (GameManager.autoEnergyCollectorRate > 0) {
                    GameManager.currentEnergy = Math.min(GameManager.currentEnergy + GameManager.autoEnergyCollectorRate, GameManager.maxEnergy);
                    this.uiScene.updateEnergy(GameManager.currentEnergy, GameManager.maxEnergy);
                }
            },
            loop: true
        });

        // Passive light generation
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (GameManager.autoLightCollectorRate > 0) {
                    const lightToAdd = GameManager.autoLightCollectorRate * GameManager.lightMultiplier;
                    GameManager.addLight(lightToAdd);
                }
            },
            loop: true
        });

        const { visionCone } = createVision(this);
        this.visionCone = visionCone;
    }

    update(time: number, delta: number) {
        GameManager.update(delta);

        if (GameManager.currentEnergy > 0) {
            const angle = (time / 10) * GameManager.rotationSpeed;
            drawLight(this, this.visionCone, this.lighthouse, angle);
            this.checkWaveLightCollision(angle);
        } else {
            this.visionCone.clear();
        }
    }

    private destroyWave(wave: Wave) {
        if (SettingsManager.getInstance().particlesEnabled) {
            this.waveDestroyParticles.emitParticleAt(wave.x, wave.y);
        }
        wave.destroy();
    }


    private handleWaveLighthouseCollision(lighthouse: Phaser.GameObjects.GameObject, waveObject: Phaser.GameObjects.GameObject) {
        const wave = waveObject as Wave;
        this.sound.play('wave_crash' + Phaser.Math.Between(1, 4), { volume: SettingsManager.getInstance().sfxVolume });
        if (SettingsManager.getInstance().screenShakeEnabled) {
            this.cameras.main.shake(100, 0.005);
        }

        GameManager.handleWaveLighthouseCollision();
        this.destroyWave(wave);
    }

    private handleWaveLandCollision(waveObject: Phaser.GameObjects.GameObject, landTile: Phaser.GameObjects.GameObject) {
        const wave = waveObject as Wave;
        this.erodeAt(wave.x, wave.y, Math.max(wave.body.width, 1) + 1);
        this.destroyWave(wave);
        this.sound.play('wave_crash' + Phaser.Math.Between(1, 4), { volume: SettingsManager.getInstance().sfxVolume });
        if (SettingsManager.getInstance().screenShakeEnabled) {
            this.cameras.main.shake(100, 0.005);
        }
        this.cameras.main.shake(100, 0.005);
    }

    private handleWaveSegmentLandCollision(segment: Phaser.GameObjects.GameObject, tile: Phaser.GameObjects.GameObject) {
        const wave = (segment as any).parentContainer as Wave;
        if (wave && wave.active) {
            this.handleWaveLandCollision(wave, tile);
        }
    }

    private erodeAt(x: number, y: number, radius: number) {
        const tileSize = 10;
        const eraseBlock = this.make.graphics();
        eraseBlock.fillStyle(0xffffff);
        eraseBlock.fillRect(0, 0, tileSize, tileSize);

        const minX = Math.floor((x - radius) / tileSize) * tileSize;
        const maxX = Math.ceil((x + radius) / tileSize) * tileSize;
        const minY = Math.floor((y - radius) / tileSize) * tileSize;
        const maxY = Math.ceil((y + radius) / tileSize) * tileSize;

        for (let tileY = minY; tileY < maxY; tileY += tileSize) {
            for (let tileX = minX; tileX < maxX; tileX += tileSize) {
                const blockCenterX = tileX + tileSize / 2;
                const blockCenterY = tileY + tileSize / 2;
                const distance = Phaser.Math.Distance.Between(x, y, blockCenterX, blockCenterY);

                if (distance < radius) {
                    this.landRT.erase(eraseBlock, tileX, tileY);
                }
            }
        }

        eraseBlock.destroy();

        this.landTiles.getChildren().forEach((tileGameObject: Phaser.GameObjects.GameObject) => {
            const tile = tileGameObject as Phaser.GameObjects.Rectangle;
            const body = tile.body as Phaser.Physics.Arcade.Body;
            if (body && body.enable) {
                const distance = Phaser.Math.Distance.Between(x, y, tile.x, tile.y);
                if (distance < radius + (tile.width / 2)) {
                    body.enable = false;
                    tile.setVisible(false);
                }
            }
        });
    }

    private checkWaveLightCollision(currentAngle: number) {
        const processBeam = (angle: number) => {
            const start = Phaser.Math.Angle.WrapDegrees(angle - GameManager.lightAngle);
            const end = Phaser.Math.Angle.WrapDegrees(angle + GameManager.lightAngle);

            const all = [...this.waves.getChildren()];
            const wavesInBeam: Wave[] = [];

            all.forEach(go => {
                const wave = go as Wave;
                if (!wave.active) return;

                let inBeam = false;

                for (const segment of wave.collisionSegments) {
                    const cos = Math.cos(wave.rotation);
                    const sin = Math.sin(wave.rotation);
                    const worldX = wave.x + (segment.x * cos - segment.y * sin);
                    const worldY = wave.y + (segment.x * sin + segment.y * cos);

                    const dx = worldX - this.lighthouse.x;
                    const dy = worldY - this.lighthouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > GameManager.lightRadius + 10) continue;

                    const angleToSegment = Phaser.Math.RadToDeg(Math.atan2(dy, dx));

                    const isAngleBetween = (angle: number, startAngle: number, endAngle: number) => {
                        if (startAngle < endAngle) return angle >= startAngle && angle <= endAngle;
                        return angle >= startAngle || angle <= endAngle;
                    };

                    if (isAngleBetween(angleToSegment, start, end)) {
                        inBeam = true;
                        break;
                    }
                }

                if (inBeam) {
                    wavesInBeam.push(wave);
                }
            });

            wavesInBeam.sort((a, b) =>
                Phaser.Math.Distance.Between(this.lighthouse.x, this.lighthouse.y, a.x, a.y) -
                Phaser.Math.Distance.Between(this.lighthouse.x, this.lighthouse.y, b.x, b.y)
            );

            for (let i = 0; i < Math.min(wavesInBeam.length, GameManager.beamPenetration); i++) {
                const waveToDestroy = wavesInBeam[i];
                const damage = 1; // Base damage
                waveToDestroy.health -= damage;

                if (SettingsManager.getInstance().particlesEnabled) {
                    this.hitParticles.emitParticleAt(waveToDestroy.x, waveToDestroy.y);
                }

                if (waveToDestroy.health <= 0) {
                    this.events.emit('waveDestroyed', waveToDestroy);

                    if (GameManager.chainLightningChance > 0 && Math.random() < GameManager.chainLightningChance) {
                        const nearbyWave = this.waves.getChildren().find(w => {
                            const wObj = w as Wave;
                            return wObj.active && wObj !== waveToDestroy && Phaser.Math.Distance.Between(waveToDestroy.x, waveToDestroy.y, wObj.x, wObj.y) < 150;
                        }) as Wave;

                        if (nearbyWave) {
                            const lightning = this.add.graphics();
                            lightning.lineStyle(2, 0xffff00);
                            lightning.lineBetween(waveToDestroy.x, waveToDestroy.y, nearbyWave.x, nearbyWave.y);
                            this.tweens.add({
                                targets: lightning,
                                alpha: 0,
                                duration: 200,
                                onComplete: () => lightning.destroy()
                            });
                            nearbyWave.health -= damage;
                            if (nearbyWave.health <= 0) {
                                this.events.emit('waveDestroyed', nearbyWave);
                                this.destroyWave(nearbyWave);
                            }
                        }
                    }

                    this.destroyWave(waveToDestroy);
                }
            }
        };

        for (let i = 0; i < GameManager.lightBeamCount; i++) {
            processBeam(currentAngle + (360 / GameManager.lightBeamCount) * i);
        }
    }

    private spawnWave() {
        if (GameManager.waveState === 'in_wave') {
            const edge = Phaser.Math.Between(0, 3);
            let x = 0, y = 0;
            const gameHeight = 900;

            switch (edge) {
                case 0: x = Phaser.Math.Between(0, this.gameWidth); y = -50; break;
                case 1: x = this.gameWidth + 50; y = Phaser.Math.Between(0, gameHeight); break;
                case 2: x = Phaser.Math.Between(0, this.gameWidth); y = gameHeight + 50; break;
                case 3: x = -50; y = Phaser.Math.Between(0, gameHeight); break;
            }

            const wave = this.waves.get(x, y) as Wave;
            if (wave) {
                wave.setup(this.lighthouse);

                wave.collisionSegments.forEach(segment => {
                    this.waveSegments.add(segment);
                });
            }
        }

        this.time.addEvent({
            delay: this.waveSpawnDelay,
            callback: this.spawnWave,
            callbackScope: this,
            loop: false
        });
    }

    private applyUpgrade(type: string) {
        GameManager.applyUpgrade(type);
    }

    public rebuildIsland() {
        if (this.landWaveCollider) {
            this.landWaveCollider.destroy();
        }
        if (this.landWaveSegmentCollider) {
            this.landWaveSegmentCollider.destroy();
        }
        this.landRT.destroy();
        this.landTiles.destroy(true);
        const { landRT, landTiles } = createLand(this, this.lighthouse, this.landRadius);
        this.landRT = landRT;
        this.landRT.setDepth(1).setAlpha(0.5);
        this.landTiles = landTiles;
        //@ts-ignore
        this.landWaveCollider = this.physics.add.overlap(this.waves, this.landTiles, this.handleWaveLandCollision, undefined, this);
        //@ts-ignore
        this.landWaveSegmentCollider = this.physics.add.overlap(this.waveSegments, this.landTiles, this.handleWaveSegmentLandCollision, undefined, this);
    }

    public expandIsland() {
        const oldRadius = this.landRadius;
        this.landRadius += 20;
        this.addLand(oldRadius, this.landRadius);
    }

    private addLand(fromRadius: number, toRadius: number) {
        const landCenterX = this.gameWidth / 2;
        const landCenterY = this.gameHeight / 2;
        const tileSize = 10;

        const landGraphics = this.make.graphics();

        for (let y = landCenterX - toRadius; y < landCenterY + toRadius; y += tileSize) {
            for (let x = landCenterX - toRadius; x < landCenterX + toRadius; x += tileSize) {
                const blockCenterX = x + tileSize / 2;
                const blockCenterY = y + tileSize / 2;
                const distance = Phaser.Math.Distance.Between(landCenterX, landCenterY, blockCenterX, blockCenterY);

                if (distance >= fromRadius && distance < toRadius) {
                    const color = getTileColor(distance);
                    landGraphics.fillStyle(color, 1);
                    landGraphics.fillRect(x, y, tileSize, tileSize);

                    const tile = this.add.rectangle(x + tileSize / 2, y + tileSize / 2, tileSize, tileSize, 0x00ff00, 0);
                    this.landTiles.add(tile);
                }
            }
        }

        this.landRT.draw(landGraphics);
        landGraphics.destroy();
    }

    public repairIsland() {
        const landCenterX = this.gameWidth / 2;
        const landCenterY = this.gameHeight / 2;
        const tileSize = 10;

        //@ts-ignore
        const disabledTiles = this.landTiles.getChildren().filter(t => !t.body.enable);
        if (disabledTiles.length > 0) {
            const tileToRepair = Phaser.Math.RND.pick(disabledTiles) as Phaser.GameObjects.Rectangle;

            tileToRepair.setVisible(true);
            const body = tileToRepair.body as Phaser.Physics.Arcade.Body;
            body.enable = true;

            const distance = Phaser.Math.Distance.Between(landCenterX, landCenterY, tileToRepair.x, tileToRepair.y);
            const color = getTileColor(distance);

            const graphics = this.make.graphics();
            graphics.fillStyle(color, 1);
            graphics.fillRect(tileToRepair.x - tileSize / 2, tileToRepair.y - tileSize / 2, tileSize, tileSize);
            this.landRT.draw(graphics);
            graphics.destroy();
        }
    }

    public triggerSlowingPulse() {
        const pulse = this.add.circle(this.lighthouse.x, this.lighthouse.y, 10, 0xffffff, 0.5);
        this.tweens.add({
            targets: pulse,
            radius: this.gameWidth,
            alpha: 0,
            duration: 1000,
            onUpdate: () => {
                this.waves.getChildren().forEach(go => {
                    const wave = go as Wave;
                    if (!wave.active || !wave.body) return;

                    const distance = Phaser.Math.Distance.Between(this.lighthouse.x, this.lighthouse.y, wave.x, wave.y);
                    if (Math.abs(distance - pulse.radius) < 20) {
                        wave.slowDown(GameManager.slowingPulseSlowFactor, GameManager.slowingPulseDuration);
                    }
                });
            },
            onComplete: () => {
                pulse.destroy();
            }
        });
    }

    public triggerMegaBomb() {
        const bombRadius = 500;
        const explosion = this.add.circle(this.lighthouse.x, this.lighthouse.y, 10, 0xffa500, 0.8);

        if (SettingsManager.getInstance().screenShakeEnabled) {
            this.cameras.main.shake(200, 0.01);
        }

        this.tweens.add({
            targets: explosion,
            radius: bombRadius,
            alpha: 0,
            duration: 500,
            onUpdate: () => {
                this.waves.getChildren().forEach(go => {
                    const wave = go as Wave;
                    if (!wave.active) return;
                    const distance = Phaser.Math.Distance.Between(this.lighthouse.x, this.lighthouse.y, wave.x, wave.y);
                    if (distance <= explosion.radius) {
                        this.events.emit('waveDestroyed', wave);
                        this.destroyWave(wave);
                    }
                });
            },
            onComplete: () => {
                explosion.destroy();
            }
        });

        this.cameras.main.shake(200, 0.01);

        this.waves.getChildren().forEach(go => {
            const wave = go as Wave;
            if (!wave.active || !wave.body) return;

            const distance = Phaser.Math.Distance.Between(this.lighthouse.x, this.lighthouse.y, wave.x, wave.y);
            if (distance <= bombRadius) {
                this.events.emit('waveDestroyed', wave);
                this.destroyWave(wave);
            }
        });
    }
}
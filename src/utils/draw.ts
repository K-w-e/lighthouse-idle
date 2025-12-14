import Phaser from "phaser";
import GameManager from "../GameManager";

export const spessoreAnello = 15;
export const coloreScuro = 0x8b4513;
export const coloreChiaro = 0xd2b48c;

export function getTileColor(distance: number): number {
    let ringIndex = Math.floor(distance / spessoreAnello);
    const noise = Phaser.Math.FloatBetween(0, 1);
    if (noise < 0.25) {
        ringIndex += 1;
    }
    return ringIndex % 2 === 0 ? coloreScuro : coloreChiaro;
}

export function createLand(
    scene: Phaser.Scene,
    lighthouse: Phaser.GameObjects.Sprite,
    landRadius: number,
): {
    landRT: Phaser.GameObjects.RenderTexture;
    landTiles: Phaser.Physics.Arcade.StaticGroup;
} {
    const landCenterX = lighthouse.x;
    const landCenterY = lighthouse.y;
    const tileSize = 10;

    const landRT = scene.add
        .renderTexture(lighthouse.x, lighthouse.y, 800, 900)
        .setDepth(-1);
    const landGraphics = scene.make.graphics();
    landGraphics.clear();

    for (
        let y = landCenterY - landRadius;
        y < landCenterY + landRadius;
        y += tileSize
    ) {
        for (
            let x = landCenterX - landRadius;
            x < landCenterX + landRadius;
            x += tileSize
        ) {
            const blockCenterX = x + tileSize / 2;
            const blockCenterY = y + tileSize / 2;

            const distance = Phaser.Math.Distance.Between(
                landCenterX,
                landCenterY,
                blockCenterX,
                blockCenterY,
            );
            const jitteredRadius = landRadius + Phaser.Math.FloatBetween(-7, 7);

            if (distance < jitteredRadius) {
                const coloreCorrente = getTileColor(distance);
                landGraphics.fillStyle(coloreCorrente, 1);
                landGraphics.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    landRT.draw(landGraphics);
    landGraphics.destroy();
    const landTiles = scene.physics.add.staticGroup();

    for (
        let y = landCenterY - landRadius;
        y < landCenterY + landRadius;
        y += tileSize
    ) {
        for (
            let x = landCenterX - landRadius;
            x < landCenterX + landRadius;
            x += tileSize
        ) {
            const distance = Phaser.Math.Distance.Between(
                landCenterX,
                landCenterY,
                x + tileSize / 2,
                y + tileSize / 2,
            );
            if (distance < landRadius) {
                const tile = scene.add.rectangle(
                    x + tileSize / 2,
                    y + tileSize / 2,
                    tileSize,
                    tileSize,
                    0x00ff00,
                    0,
                );
                tile.setData("health", GameManager.tileHealth);
                landTiles.add(tile);
            }
        }
    }

    return { landRT, landTiles };
}

export function createVision(scene: Phaser.Scene): {
    visionCone: Phaser.GameObjects.Graphics;
    visionMask: Phaser.Display.Masks.GeometryMask;
    waveness: Phaser.GameObjects.Graphics;
} {
    const visionCone = scene.add.graphics();
    const { width, height } = scene.scale;
    const waveness = scene.add
        .graphics()
        .fillStyle(0x000000, 0.5)
        .fillRect(0, 0, width, height);
    const visionMask = visionCone.createGeometryMask();
    waveness.setMask(visionMask);
    waveness.mask.invertAlpha = true;
    return { visionCone, visionMask, waveness };
}

export function drawLight(
    scene: Phaser.Scene,
    visionCone: Phaser.GameObjects.Graphics,
    lighthouse: Phaser.GameObjects.Sprite,
    angle: number,
) {
    visionCone.clear();
    visionCone.fillStyle(0xffffff, 1);

    for (let i = 0; i < GameManager.lightBeamCount; i++) {
        const beamAngleOffset = (360 / GameManager.lightBeamCount) * i;
        const current = angle + beamAngleOffset;

        visionCone.slice(
            lighthouse.x,
            lighthouse.y,
            GameManager.lightRadius,
            Phaser.Math.DegToRad(current - GameManager.lightAngle),
            Phaser.Math.DegToRad(current + GameManager.lightAngle),
            false,
        );
        visionCone.fillPath().setAlpha(0.3);
    }
}

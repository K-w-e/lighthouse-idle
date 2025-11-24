import Phaser from 'phaser';

export class FloatingText extends Phaser.GameObjects.Text {
    constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: string = '#ffffff') {
        super(scene, x, y, text, {
            fontSize: '20px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'PixelFont',
        });
        scene.add.existing(this);
        this.setOrigin(0.5);

        scene.tweens.add({
            targets: this,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
    }
}

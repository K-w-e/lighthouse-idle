import Phaser from 'phaser';

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;

varying vec2 outTexCoord;

void main()
{
    vec2 uv = outTexCoord;

    float speed = 1.0;
    float frequency = 20.0;
    float amplitude = 0.003;

    uv.y += sin(uv.x * frequency + uTime * speed) * amplitude;
    uv.x += cos(uv.y * frequency + uTime * speed) * amplitude;

    gl_FragColor = texture2D(uMainSampler, uv);
}
`;

export default class WaterPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game: Phaser.Game) {
        super({
            game,
            name: 'WaterPipeline',
            fragShader
        });
    }

    onPreRender() {
        this.set1f('uTime', this.game.loop.time / 1000);
    }
}

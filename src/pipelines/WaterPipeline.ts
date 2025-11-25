import Phaser from 'phaser';

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;

varying vec2 outTexCoord;

void main()
{
    vec2 uv = outTexCoord;
    float strength = 0.01; 
    float speed = 2.0;     
    
    float xOffset = sin(uv.y * 10.0 + uTime * speed) * 0.5 
                  + sin(uv.y * 25.0 - uTime * speed * 1.5) * 0.3
                  + sin(uv.x * 30.0 + uTime * speed * 0.5) * 0.2;

    float yOffset = cos(uv.x * 10.0 - uTime * speed) * 0.5 
                  + cos(uv.x * 20.0 + uTime * speed * 1.2) * 0.3
                  + cos(uv.y * 25.0 + uTime * speed * 0.8) * 0.2;

    vec2 distortedUV = uv + vec2(xOffset, yOffset) * strength;
    
    float red   = texture2D(uMainSampler, distortedUV + vec2(0.002, 0.0)).r;
    float green = texture2D(uMainSampler, distortedUV).g;
    float blue  = texture2D(uMainSampler, distortedUV - vec2(0.002, 0.0)).b;
    
    vec3 finalColor = vec3(red, green, blue);
    finalColor *= vec3(0.9, 0.95, 1.05);
    gl_FragColor = vec4(finalColor, 1.0);
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

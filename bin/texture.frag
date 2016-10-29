

#version 330 core
in vec3 vertexColor;
in vec3 vertexPosition;
in vec2 fragCoord;

uniform sampler2D ourTexture;
uniform float iGlobalTime;
uniform vec2 iResolution;
out vec4 fragColor;

void main()
{
    vec2 uv = fragCoord.xy;
    fragColor = texture(ourTexture, fragCoord) * vec4(vec3(1.0), 1.0);
}
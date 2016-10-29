

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
    fragColor = vec4(uv,0.5+0.5*sin(iGlobalTime),1.0);
}
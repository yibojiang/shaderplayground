

#version 330 core
in vec3 vertexColor;
in vec3 vertexPosition;
in vec2 fragCoord;

uniform sampler2D ourTexture;
uniform float iGlobalTime;
uniform vec2 iResolution;
out vec4 fragColor;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy;
    fragColor = vec4(uv,0.5+0.5*sin(iGlobalTime),1.0);
}

void main()
{
    mainImage( fragColor, fragCoord );
}
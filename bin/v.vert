


#version 330 core
layout (location = 0) in vec3 position;
layout (location = 1) in vec3 color;
layout (location = 2) in vec2 texCoord;

// uniform float time;
uniform vec2 iResolution;
out vec3 vertexColor;
out vec3 vertexPosition;
out vec2 fragCoord;

void main()
{
    gl_Position = vec4(position, 1.0);
    vertexColor = color;   
    vertexPosition = position;

    fragCoord = texCoord * iResolution;
    // fragCoord = vec2(texCoord.x, 1.0f - texCoord.y) * iResolution;
    
}
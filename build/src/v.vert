


#version 330 core
layout (location = 0) in vec3 position;
layout (location = 1) in vec3 color;
layout (location = 2) in vec2 texCoord;
uniform float time;
out vec3 vertexColor;
out vec3 vertexPosition;
out vec2 fragCoord;

void main()
{
    // gl_Position = vec4(position.x, position.y + sin(time), position.z, 1.0);
    gl_Position = vec4(position, 1.0);
    vertexColor = color;
//    vertexPosition = position.xyz + vec3(0.5);
    
    vertexPosition = position;
    fragCoord = texCoord;
}
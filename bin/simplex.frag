#version 330 core
in vec3 vertexColor;
in vec3 vertexPosition;
in vec2 fragCoord;

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

uniform vec4 iDate;
uniform float iGlobalTime;
uniform vec2 iResolution;
uniform vec4 iMouse;
out vec4 fragColor;

// #ifdef GL_ES
// precision mediump float;
// #endif


vec2 skew (vec2 st) {
    vec2 r = vec2(0.0);
    r.x = 1.1547 * st.x;
    r.y = st.y + 0.5 * r.x;
    return r;
}

vec3 simplexGrid (vec2 st) {
    vec3 xyz = vec3(0.0);

    vec2 p = fract(skew(st));
    if (p.x > p.y) {
        xyz.xy = 1.0 - vec2(p.x, p.y - p.x);
        xyz.z = p.y;
    } else {
        xyz.yz = 1.0 - vec2(p.x - p.y, p.y);
        xyz.x = p.x;
    }

    return fract(xyz);
}

void main() {
    vec2 st = fragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.0);

    // Scale the space to see the grid
    st *= 10.0;

    // Show the 2D grid
    color.rg = fract(st);

    // Skew the 2D grid
    color.rg = fract(skew(st));

    // Subdivide the grid into to equilateral triangles
    color = simplexGrid(st);

    fragColor = vec4(color, 1.0);
}
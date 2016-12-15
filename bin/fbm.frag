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
// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

// #ifdef GL_ES
// precision mediump float;
// #endif

// uniform vec2 u_resolution;
// uniform vec2 u_mouse;
// uniform float u_time;

float random (in vec2 st) { 
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))* 
        43758.5453123);
}


float random2 (in vec2 st) { 
    return 2.0*fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))* 
        43758.5453123) -1.0;
}
// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + 
            (c - a)* u.y * (1.0 - u.x) + 
            (d - b) * u.x * u.y;
}

vec2 hash( vec2 p )
{
    p = vec2( dot(p,vec2(127.1,311.7)),
              dot(p,vec2(269.5,183.3)) );

    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float snoise( in vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

    vec2 i = floor( p + (p.x+p.y)*K1 );
    
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0*K2;

    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

    vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

    return dot( n, vec3(70.0) );
    
}

#define OCTAVES 5
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * snoise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

float ridge(in vec2 st){
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;

    float offset = 1.0;
    for (int i = 0; i < OCTAVES; i++) {
        
        float n = snoise(st * iGlobalTime*0.5);
        n = abs(n);     // create creases
        n = offset - n; // invert so creases are at top
        n = n * n;      // sharpen creases
        value += amplitude *  n;
        st *= 2.;
        amplitude *= .5;

    }
    return value;
}

float turbulence(in vec2 st){
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;

    for (int i = 0; i < OCTAVES; i++) {
        
        value += amplitude * abs(snoise(st));
        st *= 2.;
        amplitude *= .5;
    }


    // float offset = 0.0;
    // value = abs(value);     // create creases
    // value = offset - value; // invert so creases are at top
    // value = value * value;      // sharpen creases
    return value;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 st = gl_FragCoord.xy/iResolution.xy;
    st.x *= iResolution.x/iResolution.y;

    vec3 color = vec3(0.0);
    // color += fbm(st*3.0);
    // color += turbulence(st*3.0);
    color += ridge(st*3.0);
    
 
    // gl_FragColor = vec4(color,1.0);
    fragColor=vec4(color,1);    
}


void main()
{
    mainImage( fragColor, fragCoord );
}


#version 330 core
in vec3 vertexColor;
in vec3 vertexPosition;
in vec2 fragCoord;

uniform sampler2D ourTexture;
uniform float iGlobalTime;
uniform vec2 iResolution;
out vec4 fragColor;

//#define pi 3.1415926
//#define flyCount 40
//
//float pingPong(float v) {
//    
//    const float amplitude = 1.;
//    const float t = pi * 2.0;
//    float k = 4.0*amplitude / t;
//    float r = mod( v  , t);
//    float d = floor(v / (0.5 * t) );
//    return mix(k * r - amplitude ,  amplitude * 3. - k * r , mod(d, 2.0));
//    
//}
//
//float getRad(vec2 q) {
//    return atan(q.y, q.x);
//}
//
//vec2 hash(vec2 p)
//{
//    p = vec2( dot(p, vec2(127.1, 311.7)),
//             dot(p, vec2(269.5, 183.3)) );
//    return -1. + 2.*fract(sin(p) * 53758.5453123);
//}
//
//vec2 noise(vec2 tc) {
//    return hash(tc);
//}
//
//float firefly(vec2 p, float size) {
//    return smoothstep(0.0, size, length(p) );
//    
//}

//const float pow = 1.0;
//const float flySpeed = 0.1;


const int NUM_STEPS = 8;
const float PI	 	= 3.1415;
const float EPSILON	= 1e-3;
float EPSILON_NRM	= 0.1 / iResolution.x;

// sea
const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.1,0.19,0.22);
const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6);
float SEA_TIME = 1.0 + iGlobalTime * SEA_SPEED;
mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
    vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
    m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
    m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
    return m;
}
float hash( vec2 p ) {
    float h = dot(p,vec2(127.1,311.7));
    return fract(sin(h)*43758.5453123);
}
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ),
                             hash( i + vec2(1.0,0.0) ), u.x),
                        mix( hash( i + vec2(0.0,1.0) ),
                            hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// lighting
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}
float specular(vec3 n,vec3 l,vec3 e,float s) {
    float nrm = (s + 8.0) / (3.1415 * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = max(e.y,0.0);
    vec3 ret;
    ret.x = pow(1.0-e.y,2.0);
    ret.y = 1.0-e.y;
    ret.z = 0.6+(1.0-e.y)*0.4;
    return ret;
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;
    for(int i = 0; i < ITER_GEOMETRY; i++) {
        d = sea_octave((uv+SEA_TIME)*freq,choppy);
        d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;
        uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;
    for(int i = 0; i < ITER_FRAGMENT; i++) {
        d = sea_octave((uv+SEA_TIME)*freq,choppy);
        d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;
        uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
    fresnel = pow(fresnel,3.0) * 0.65;
    
    vec3 reflected = getSkyColor(reflect(eye,n));
    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12;
    
    vec3 color = mix(refracted,reflected,fresnel);
    
    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;
    
    color += vec3(specular(n,l,eye,60.0));
    
    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
    float tm = 0.0;
    float tx = 1000.0;
    float hx = map(ori + dir * tx);
    if(hx > 0.0) return tx;
    float hm = map(ori + dir * tm);
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm,tx, hm/(hm-hx));
        p = ori + dir * tmid;
        float hmid = map(p);
        if(hmid < 0.0) {
            tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}
void main()
{
//    vec2 uv = fragCoord.xy;
//    fragColor = vec4(uv,0.5+0.5*sin(iGlobalTime),1.0);
//    float r = 0.5;
//    uv.x *= iResolution.x/iResolution.y;
//    float circle = smoothstep(0.0, r, length(uv - vec2(0.5)));
//    vec3 color = mix(vec3(1.0), vec3(0.0), circle);
//    fragColor = vec4(color, 1.0);
    
//    const float duration = 1.0;
//    float t = duration * (1. + sin(3.0 * iGlobalTime ) );
//    
//    vec2 p = fragCoord.xy;
//    
//    float ratio = iResolution.y / iResolution.x;
//    
//    vec2 uv = p;
//    uv.y *= ratio;
//    
//    
//    vec2 flowerP = vec2(0.618, 0.518);
//    vec2 q = p - flowerP - vec2( pow * 0.008 * cos(3.0*iGlobalTime) , pow * 0.008 * sin(3.0*iGlobalTime) ) ;
//    vec2 rootP = p - flowerP - vec2( pow * 0.02 * cos(3.0*iGlobalTime) * p.y , -0.48 + pow * 0.008 * sin(3.0*iGlobalTime) );
//    
//    q.y *= ratio;
//    
//    //sky
//    vec3 col = mix( vec3(0.1, 0.6, 0.5), vec3(0.2, 0.1, 0.2), sqrt(p.y) * .6 );
//    
//    
//    //draw stem
//    float width = 0.01;
//    float h = 0.5;
//    float w = 0.0005;
//    col = mix(vec3(0.5, 0.7, 0.4), col,
//              1.0 - (1.0 - smoothstep(h, h + width, abs(rootP.y)))
//              * (1.0 - smoothstep(w, w + width, abs(rootP.x - 0.1 * sin(4.*rootP.y + pi * .35)))));
//    
//    //draw flower
//    vec3 flowerCol = mix(vec3(0.7, 0.7, 0.2), vec3(0.7, 0.9, 0.7), smoothstep(0.0, 1.0, length(q) * 10.0));
//    
//    
//    float r = 0.1 + 0.05 * ( pingPong( getRad( q ) * 7.  + 2.*q.x * (t - duration)  )  );
//    
//    col = mix(flowerCol, col, smoothstep(r, r + 0.02,  length(q)));
//    
//    //draw buds
//    float r1 = 0.04;
//    vec3 budCol = mix (vec3(.3, .4, 0.), vec3(.9, .8, 0.), length(q) * 10.0);
//    col = mix(budCol, col, smoothstep(r1, r1 + 0.01,  length(q)));
//    
//    
//    for (int ii = 0; ii < flyCount; ii++) {
//        float i = float(ii);
//        float seed = i / float(flyCount);
//        float t1 = 1.0*(1. + sin(noise(vec2(seed) ).x * iGlobalTime));
//        vec2 fireflyP = uv - vec2(noise(vec2(seed) ).x + noise(vec2(seed) ).y * t1 * flySpeed, noise(vec2(seed) ).y + noise(vec2(seed) ).y * t1 * flySpeed);
//        float fly = firefly( fireflyP, 0.002 + 0.008 * seed );
//        vec3 flyCol = mix(vec3(0.1, 0.9, 0.1) * t1, vec3(0.0), fly );
//        col += flyCol;
//    }
//    fragColor = vec4(col, 0.);
    
    
    vec2 uv = fragCoord.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    float time = iGlobalTime * 0.3;
    
    // ray
    vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);
    vec3 ori = vec3(0.0,3.5,time*5.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); dir.z += length(uv) * 0.15;
    dir = normalize(dir) * fromEuler(ang);
    
    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8));
    
    // color
    vec3 color = mix(
                     getSkyColor(dir),
                     getSeaColor(p,n,light,dir,dist),
                     pow(smoothstep(0.0,-0.05,dir.y),0.3));
    color = vec3(0.2);
    // post
    fragColor = vec4(pow(color,vec3(0.75)), 1.0);
}



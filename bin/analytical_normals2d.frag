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
// Created by inigo quilez - iq/2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


// Computes analytical normals (right side of the screen) for a value-noise based fbm(), 
// and compares them to the numerically computer normals (left side of the screen) which
// are computed by the standard central difference method.
//
// Computing normals analytically has the benefit of being faster and "free", while
// numerical normals are easier to filter for antialiasing.


// value noise, and its analytical derivatives
vec3 noised( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    vec2 u = f*f*(3.0-2.0*f);

  float a = texture(iChannel0,(p+vec2(0.5,0.5))/256.0).x;
  float b = texture(iChannel0,(p+vec2(1.5,0.5))/256.0).x;
  float c = texture(iChannel0,(p+vec2(0.5,1.5))/256.0).x;
  float d = texture(iChannel0,(p+vec2(1.5,1.5))/256.0).x;
  
  return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
        6.0*f*(1.0-f)*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
}

const float scale  = 0.003;
const float height = 180.0;

vec4 fbmd( in vec2 x )
{
    float a = 0.0;
    float b = 1.0;
  float f = 1.0;
    vec2  d = vec2(0.0);
    for( int i=0; i<10; i++ ) // 10 octaves
    {
        vec3 n = noised(f*x*scale);
        a += b*n.x;           // accumulate values    
        d += b*n.yz*f*scale;  // accumulate derivatives (note that in this case b*f=1.0)
        b *= 0.5;             // amplitude decrease
        f *= 2.0;             // frequency increase
    }

  a *= height;
  d *= height;
  
  // compute normal based on derivatives
  return vec4( a, normalize( vec3(-d.x,1.0,-d.y) ) );
}

// raymarch against fbm heightfield
vec4 interesect( in vec3 ro, in vec3 rd )
{
  vec4 res = vec4(-1.0);
    float t = 0.0;
  for( int i=0; i<70; i++ )
  {
        vec3 pos = ro + t*rd;
    vec4 hnor = fbmd( pos.xz );

    res = vec4(t,hnor.yzw);
    if( (pos.y-hnor.x)<0.05 ||  t>2000.0) break;
    
    t += (pos.y-hnor.x)*(0.001+hnor.z);
  }

  if( t>2000.0 ) res = vec4(-1.0);
  return res;
}

// compute normal numerically
vec3 calcNormal( in vec3 pos )
{
    vec3 e = vec3(0.01,0.0,0.0);
  return normalize( vec3(fbmd(pos.xz-e.xy).x - fbmd(pos.xz+e.xy).x,
                           2.0*e.x,
                           fbmd(pos.xz-e.yx).x - fbmd(pos.xz+e.yx).x ) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy) / iResolution.y;

  // camera anim
  vec3 ro = vec3( 1000.0*cos(0.001*iGlobalTime), 0.0, 1000.0*sin(0.001*iGlobalTime) );
  vec3 ta = vec3( 0.0 );
    ro.y = fbmd(ro.xz).x + 2.0;
    ta.y = fbmd(ro.xz).x + 2.0;
  
    // camera matrix  
  vec3  cw = normalize( ta-ro );
  vec3  cu = normalize( cross(cw,vec3(0.0,1.0,0.0)) );
  vec3  cv = normalize( cross(cu,cw) );
  vec3  rd = normalize( p.x*cu + p.y*cv + 2.0*cw );

  // render
  vec3 col = vec3(0.0);
    vec4 tnor = interesect( ro, rd );
  float t = tnor.x;
  
  // commented out becasue of an ANGLE bug:
    //if( t>0.0 )
  {
    vec3 pos = ro + t*rd;
    col = mix( tnor.yzw, calcNormal( pos ), step(0.0,p.x) );
        col = 0.5 + 0.5*col;
    col *= exp(-0.000015*t*t);
  }
  
  // here becasue of the ANGLE bug:
  col *= smoothstep(-0.5,0.0,t);

  col = mix( vec3(0.0), col, smoothstep(0.006,0.007,abs(p.x)) );
  
    fragColor=vec4(col,1.0);
}

void main()
{
  mainImage(fragColor, fragCoord);
}
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


#define pi 3.14159
#define precis 0.001
vec3 ambi = vec3( 0.12, 0.12, 0.12);

#define tmin 0.0
#define tmax 300.0

const float indent = 0.1;
float angular = 5.0;

float drawStar(vec2 o, float size, float startAngle) {
  vec2 q = o;
  q *= normalize(iResolution).xy;
  mat4 rot = mat4( cos( startAngle ), -sin( startAngle ), 0.0, 0.0,
                              sin( startAngle ),  cos( startAngle ), 0.0, 0.0,
                              0.0,           0.0, 1.0, 0.0,
                              0.0,           0.0, 0.0, 1.0 );
  q = (rot * vec4(q, 0.0, 1.0)).xy;
  float angle = atan( q.y, q.x ) / (2.*pi);
  float segment = angle * angular;
  float segmentI = floor(segment);
  float segmentF = fract(segment);

  angle = (segmentI + 0.5) / angular;

  if (segmentF > 0.5) {

    angle -= indent;
  }
  else
  {

    angle += indent;
  }
  angle *= 2.0 * pi;

  vec2 outline;
  outline.y = sin(angle);
  outline.x = cos(angle);
  float dist = abs(dot(outline, q));
  float ss = size;
  float r = angular * ss;
  float star = smoothstep( r, r + 0.005, dist );
  return star;
}



vec3 rotY( vec3 dir, float rot ) {
  return dir *
         mat3( cos(rot), 0.0, -sin(rot),
               0.0,       1.0, 0.0,
               sin(rot),  0.0, cos(rot)
             );
}

vec4 eularToQuat( vec3 axis, float angle ) {
  vec4 q;
  float half_angle = angle / 2.0;
  q.x = axis.x * sin(half_angle);
  q.y = axis.y * sin(half_angle);
  q.z = axis.z * sin(half_angle);
  q.w = cos(half_angle);
  return q;
}

vec4 inverQuat( vec4 quat ) {
  return vec4( -quat.x, -quat.y, -quat.z, quat.w );
}

vec4 mul_quat(vec4 q1, vec4 q2) {
  vec4 qr;
  qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
  qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
  qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
  qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
  return qr;
}

vec4 rotate( vec3 p, vec3 axis, float an) {
  vec4 q = eularToQuat( axis, an );
  vec4 qr = inverQuat( q );
  vec4 pos = vec4( p.xyz, 0.0 );
  vec4 tmp = mul_quat( q, pos );
  return mul_quat( tmp, qr );
}

float plane( vec3 p ) {
  return p.y;
}

float sphere( vec3 p, float r ) {
  return length(p) - r;
}

float box( vec3 p, vec3 b ) {
  return length( max( abs( p.xyz ) - b.xyz, vec3( 0.0 ) ) );
}

vec2 opU( vec2 o1, vec2 o2 ) {
  if (o1.x < o2.x) {
    return o1;
  }
  else {
    return o2;
  }
}

float hash( float n ) {
  return ( sin( 21312.1 * n + 231.2 ));
}

float speed = 0.3;
vec3 bp = vec3( -iGlobalTime * speed, 0.5 * abs( sin( iGlobalTime * 1.0 ) ), iGlobalTime * speed );

vec2 map( vec3 p ) {
  vec2 res = vec2( plane( p - vec3( 0.0, -0.3, 0.0) ), 0.0 );

  //Rotate the space.
  //vec3 rp = rotate( p - vec3( 0.0, 0.2, 0.0 ), normalize( vec3( 0.4, 0.6, 0.3 ) ), iGlobalTime * 1.0 * pi/6.0 ).xyz;
  //rp = rotate( rp, vec3( 0.0, 1.0, 0.0 ), pi/4.0 ).xyz;
  //rp = rotate( rp, vec3( 0.0, 1.0, 0.0 ), 2.0 * iGlobalTime * pi ).xyz;
  //p.xz = mod( p.xz , 0.5 );

  res = opU( res, vec2( sphere( p - bp, 0.3 ), 1.0 ) );

  p.y -= 0.1 * floor(  p.x * 6.0  );
  //res = opU( res, vec2( box( p - vec3( 0.0, 0.2, 0.0 ) , vec3( 1.3, 0.1, 0.7 ) ), 1.0 ) );


  return res;
}

vec3 getNormal( vec3 p ) {
  vec2 e = vec2( precis, 0.0 );
  return normalize(vec3( map( p + e.xyy ).x - map( p - e.xyy ).x,
                         map( p + e.yxy ).x - map( p - e.yxy ).x,
                         map( p + e.yyx ).x - map( p - e.yyx ).x
                       ) );
}

float raymarching( vec3 ro, vec3 rd ) {

  float t = 0.0;
  for ( int i = 0; i < 512; i++ ) {

    float dist = map( ro + rd * t ).x;
    if ( dist < precis || t > tmax ) {
      break;
    }

    t = t + dist * 1.0;
  }

  return t;
}

float softShadow( vec3 ro, vec3 rd ) {
  float t = 1.0;
  float res = 1.0;
  for ( int i = 0; i < 128; i++ ) {

    float dist = map( ro + rd * t ).x;
    t = t + dist;
    res = min( res, 16.0 * dist / t );
    if ( res < precis || t > tmax ) {
      break;
    }
  }

  return clamp( res, 0.0, 1.0 );
}

float calcAO( in vec3 pos, in vec3 nor )
{
  float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord.xy / iResolution.xy;
  uv.y *= iResolution.y / iResolution.x;
  uv = uv * 2.0 - 1.0;

  vec3 rd = vec3( uv.xy, 1.0 );
  rd.y += 0.3;
  rd = normalize(rd);
  float time = iGlobalTime;
  float radY = -pi * iMouse.x * 0.004 + pi ;
  float radX = pi * 0.0 - pi * iMouse.y * 0.002;
  radX = clamp( radX, -pi * 0.5, pi * 0.15 );
  rd = rotate( rd, vec3( 0.0, 1.0, 0.0 ), -radY ).xyz;
  vec3 xAxis = rotate( vec3( 1.0, 0.0, 0.0 ), vec3( 0.0, 1.0, 0.0 ), -radY ).xyz;
  vec3 zAxis = rotate( vec3( 0.0, 0.0, 1.0 ), vec3( 0.0, 1.0, 0.0 ), -radY ).xyz;
  rd = rotate( rd, xAxis, -radX ).xyz;
  zAxis = rotate( zAxis, xAxis, -radX ).xyz;
  vec3 ro = vec3( bp.x, 0.0, bp.z) - zAxis * 1.2;
  ro.y += 0.26;

  vec3 color = vec3( 0.0, 0.4, 0.8 );
  color = mix( color, vec3( 0.1 ), uv.y );
  //color = vec3( 0.1 );

  float t = raymarching( ro, rd );
  vec3 ld = normalize( vec3( -0.1, -1.0, -0.8 ) );

  //if miss the scene
  if ( t > tmax ) {
    float sun = clamp( dot(-ld, rd), 0.0, 1.0 );
    color += 1.9 * vec3( 0.7, 0.8, 0.2) * pow( sun, 3.0 );
  }
  else {
    vec3 hit = ro + t * rd;
    vec2 res = map( hit );
    vec3 n = getNormal( hit );
    float sh = 1.0;
    float dif = clamp( dot( -ld, n ), 0.0, 1.0 ) + 0.2;

    if ( dif > 0.21 ) {
      sh = softShadow( hit + ld * 0.5, normalize( -ld ) );
    }
    vec3 difftex = vec3( 1.0 );
    vec3 sepctex = vec3( 1.0 );

    //Floor texture.
    if ( res.y == 0.0 ) {
      difftex = mod( floor( hit.x * 2.0 ) + floor( hit.z * 2.0 ), 2.0 ) * vec3( 0.7 );
      sepctex = vec3( 0.0 );
      // difftex = texture( iChannel1, vec2( hit.x , hit.z ) ).xyz;
      //difftex = vec3( 0.4 );
    }
    else if ( res.y == 1.0 ) {
      vec3 sp = ( hit.xyz - bp ) / 0.3;
      vec3 piv = normalize( vec3( 2.0, 0.0, 1.0 ) );
      sp = rotate( sp, piv,  -pi * 0.1 - 3.0 * iGlobalTime ).xyz;
      float u = ( atan( sp.x, sp.z ) ) / ( 2.0 * pi ) + 0.5;
      float v = asin( sp.y ) / pi + 0.5;


      // vec2 uv = fragCoord.xy / iResolution.xy;
      // vec2 p = uv;
      
      vec3 tc = vec3( 1.0, 1.0, 0.0 );
      float star = drawStar( vec2(u, v) - vec2( 0.5, 0.5 ), 0.0045, pi / 4.0  );
      tc = mix( vec3( 0.9, 0.1, 0.2 ), tc, star );
      vec4 texcol = vec4( tc.xyz, 1.0);
      
      difftex = texcol.xyz;
      // difftex = vec3(0.0);
      // texture( iChannel0, vec2( u, v ) ).xyz;

      float v1 = asin( sp.z ) / pi + 0.5;

      if ( v1 > 0.4 && v1 < 0.6 ) {
        difftex = vec3( 0.0, 0.4, 0.8 );
      }

      // difftex += 0.2 * textureCube( iChannel2, reflect( -rd, n ) ).xyz;
      sepctex = vec3( 1.0 );
    }

    //dif = 1.0;
    //sh = 1.0;

    vec3 diffCol = difftex * dif * sh;
    vec3 specCol = sepctex * pow( max( 0.0, dot( rd, reflect( -ld, n ) ) ), 110.0 );
    color = diffCol + specCol + ambi;
  }



  uv = fragCoord.xy / iResolution.xy;

  // vec3 tc = vec3( 1.0, 1.0, 0.0 );
  // float star = drawStar( uv - vec2( 0.5, 0.5 ), 0.0045, pi / 4.0  );
  // tc = mix( vec3( 0.9, 0.1, 0.2 ), tc, star );
  // vec4 texcol = vec4( tc.xyz, 1.0);
  // color = texcol.xyz;

  fragColor = vec4( color, 1.0);
}

void main()
{
    mainImage(fragColor, fragCoord);
}

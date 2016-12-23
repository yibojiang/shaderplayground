

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

//yibojiang
/*
I made serveral explosion pattern.
0 is normal explosion,
1 is circle,
2 is flower,
3 is star,
4 is heart

You can uncommet the playLevel to play a firework sequence I've made,
But it may crash your browsers on Windows, I'm not sure about the cause
(may be too many loops) since I havn't a pc to debug, what I do is add
the marco to toggle the play, which cuts lots of loops.
*/
//#define playLevel  //Define whether to play a firework sequence.
#define pi 3.1415926

#define til 10  // the trail length of firework 
#define etil 3  // the trail length of explosion particle, reduce this to 1 can improve performance
#define numParticle 30  // explode particle number

#define grivity .1
#define explodePow .25 // explosion force
#define lengthStep .5
#define explodeStep .5
#define grassCount 100
#define normalflickerPow .005 //flicker intensity of explosion effect
#define circleflickerPow .02
#define drawGrass // whether to draw the grass
#define dd1 4.
#define dd2 5.
#define tt1 2.

float hash(in float n ) {
  return fract(sin(n) * 43758.5453123);
}

vec2 hash2(vec2 p)
{
  p = vec2( dot(p, vec2(127.1, 311.7)),
            dot(p, vec2(269.5, 183.3)) );
  return -1. + 2.*fract(sin(p) * 53758.5453123);
}

vec2 noise(vec2 tc) {
  return (2*texture(iChannel0, tc.xy ).xy - 1.).xy;
}

float rand(vec2 c) {
  return fract(sin(dot(c.xy , vec2(12.9898, 78.233))) * 43758.5453);
}

float randDir(float val, float seed) {
  return cos(val * sin(val * seed) * seed);
}

float powFunc(in float v) {

  const float a = 0.004;
  const float t = pi * 2.;

  return mix(a * pow(0.2, mod(v  , t) - 2.*pi ) ,
             a * pow(5.0, mod(v  , t) ) ,
             mod( floor(v / (0.5 * t) ) , 2.0) );

}

vec2 getPos(in vec2 o, in float t, in vec2 d) {
  return vec2(o.x + d.x * t, o.y + d.y * t - grivity * t * t);
}

//no grivity
vec2 getPos2(in vec2 o, in float t, in vec2 d) {
  return vec2(o.x + d.x * t, o.y + d.y * t);
}

float drawPoint(in float r, in float size, in vec2 p) {
  return smoothstep(r, r + size, length(p) );
}

vec3 drawParticle(in vec2 p, in float size, in vec3 col) {
  return mix( col, vec3(0.0)  , smoothstep(0., size, dot(p, p) * 90.0 ) );
}

vec3 drawFlyHeart(in vec2 uv, in vec2 o, in float off, in vec3 color, in vec2 initDir, float rt ) {
  float t = iGlobalTime + off;
  vec3 col = vec3(0.0);
#ifdef playLevel
  if (t < 0. || t > dd2) {
    return col;
  }
#else
  if (t < 0. || t < dd2) {
    return col;
  }

#endif



  float nt = floor(t / dd2) + off + o.x + o.y;
  t = mod (t, dd2 );

  if (t < tt1) {
    for (int i = 0; i < til; i++) {
      float id = float(i) / float(til);
      vec2 q = uv - getPos(o, t - lengthStep * id, initDir) + noise( vec2((id + hash(nt) + t ) * .65) ) * 0.005;
      col += drawParticle(q, mix(0.02, 0.012, id) , mix(color, vec3(0.), id ));

    }
    //flare
    vec2 flarePos = uv - getPos(o, t, initDir );
    //col+=mix( color*mix( 1.0,0.0, length(flarePos)*20. ), vec3(0.) , drawPoint( (0.0003*abs(.1+ sin(t*.9+pi*.3) ) )*powFunc( atan( flarePos.y, flarePos.x )*4. ) ,.01,flarePos) );
    col += mix( color * mix( 1.0, 0.0, dot(flarePos, flarePos) * 800. ),
                vec3(0.) , drawPoint( (0.0003 * abs(.1 + sin(t * .9 + pi * .3) ) ) * powFunc( atan( flarePos.y, flarePos.x ) * 4. ) , .01, flarePos) );
  }
  else {
    float t2 = t - tt1;
    vec2 ep = getPos(o, tt1, initDir);
    float lerp = t2 / (dd2 - tt1);

    for (int j = 0; j < 100; j++) {
      vec2 rawdir = normalize(noise( vec2( float(j) / 100. , hash(float(j) + nt ) * .5 )) );

      float v = atan(rawdir.y, rawdir.x) + rt * t;
      float r = 0.1 * (2. - 2.*sin(v) + sin(v) * sqrt( abs(cos(v) ) ) / (sin(v) + 1.4) );
      vec2 q = uv - getPos2(ep, t2 - 0.2 * explodeStep, explodePow * r * rawdir );
      float flicker = circleflickerPow * hash(float(j) + lerp);
      col += drawParticle(q,
                          (0.01 + flicker) * abs(cos(lerp * .5 * pi) ),
                          color );
    }

    //boom light
    col += mix( mix(color, vec3(0.), clamp(3.*lerp , 0., 1.)  ) ,
                vec3(0.) ,
                drawPoint(0.0, .7, uv - ep) );
  }

  return col;
}

vec3 drawFlyStar(in vec2 uv, in vec2 o, in float off, in vec3 color, in vec2 initDir ) {
  float t = iGlobalTime + off;
  vec3 col = vec3(0.);
#ifdef playLevel
  if (t < 0. || t > dd1) {
    return col;
  }
#else
  if (t < 0. || t < dd1) {
    return col;
  }

#endif
  float nt = floor(t / dd1) + off + o.x + o.y;
  t = mod (t, dd1 );


  if (t < tt1) {
    for (int i = 0; i < til; i++) {
      float id = float(i) / float(til);
      vec2 q = uv - getPos(o, t - lengthStep * id, initDir) + noise( vec2((id + hash(nt) + t ) * .65) ) * 0.005;
      col += drawParticle(q, mix(0.02, 0.012, id) ,
                          mix(color, vec3(0.), id ));

    }
    //flare
    vec2 flarePos = uv - getPos(o, t, initDir );
    col += mix( color * mix( 1.0, 0.0, dot(flarePos, flarePos) * 800. ),
                vec3(0.) , drawPoint( (0.0003 * abs(.1 + sin(t * .9 + pi * .3) ) ) * powFunc( atan( flarePos.y, flarePos.x ) * 4. ) , .01, flarePos) );

  }
  else {
    float t2 = t - tt1;
    vec2 ep = getPos(o, tt1, initDir);
    float lerp = t2 / (dd1 - tt1);

    for (int j = 0; j < 150; j++) {
      vec2 rawdir = normalize(noise( vec2( float(j) / 150. , hash(float(j) + nt ) * .5 )) );

      float v = atan(rawdir.y, rawdir.x) + 1.*t;
      float r = 0.1 + 0.0015 * ( powFunc(atan(rawdir.y, rawdir.x) * 5. + t * 10.*(hash(nt) - .5) ) );
      vec2 q = uv - getPos2(ep, t2 - 0.2 * explodeStep, explodePow * r * rawdir );
      float flicker = circleflickerPow * hash(float(j) + lerp);
      col += drawParticle(q, (0.01 + flicker) * abs(cos(lerp * .5 * pi) ), color );
    }

    //boom light
    col += mix( mix(color, vec3(0.), clamp(3.*lerp , 0., 1.)  ) , vec3(0.) , drawPoint(0.0, .7, uv - ep) );
  }
  return col;
}

vec3 drawFlyFlower(in vec2 uv, in vec2 o, in float off, in vec3 color, in vec2 initDir, int num ) {
  float t = iGlobalTime + off;
  vec3 col = vec3(0.);
#ifdef playLevel
  if (t < 0. || t > dd2) {
    return col;
  }
#else
  if (t < 0. || t < dd2) {
    return col;
  }

#endif
  float nt = floor(t / dd2) + off + o.x + o.y;
  t = mod (t, dd2 );


  if (t < tt1) {
    for (int i = 0; i < til; i++) {
      float id = float(i) / float(til);
      vec2 q = uv - getPos(o, t - lengthStep * id, initDir) + noise( vec2((id + hash(nt) + t ) * .65) ) * 0.005;
      col += drawParticle(q, mix(0.02, 0.012, id) , mix(color, vec3(0.), id ));

    }
    //flare
    vec2 flarePos = uv - getPos(o, t, initDir );
    col += mix( color * mix( 1.0, 0.0, dot(flarePos, flarePos) * 800. ),
                vec3(0.) , drawPoint( (0.0003 * abs(.1 + sin(t * .9 + pi * .3) ) ) * powFunc( atan( flarePos.y, flarePos.x ) * 4. ) , .01, flarePos) );
    //col+=mix( color*mix( 1.0,0.0, length(flarePos)*20. ), vec3(0.) , drawPoint( (0.0003*abs(.1+ sin(t*.9+pi*.3) ) )*powFunc( atan( flarePos.y, flarePos.x )*4. ) ,.01,flarePos) );
  }
  else {
    float t2 = t - tt1;
    vec2 ep = getPos(o, tt1, initDir);
    float lerp = t2 / (dd2 - tt1);
    for (int j = 0; j < 100; j++) {
      vec2 rawdir = normalize(noise( vec2( float(j) / 100. , hash(float(j) + nt ) * .5 )) );

      float v = atan(rawdir.y, rawdir.x) + t * 10.*(hash(nt) - .5);
      float r = 0.05 * sin(atan(rawdir.y, rawdir.x) * float(num) + t * 10.*(hash(nt) - .5) ) ;
      vec2 q = uv - getPos2(ep, t2 - 0.2 * explodeStep, r * rawdir );
      float flicker = circleflickerPow * hash(float(j) + lerp);
      col += drawParticle(q, (0.01 + flicker) * abs(cos(lerp * .5 * pi) ), color );
    }

    //boom light
    col += mix( mix(color, vec3(0.), clamp(3.*lerp , 0., 1.)  ) , vec3(0.) , drawPoint(0.0, .7, uv - ep) );
  }
  return col;
}

vec3 drawFlyCircle(in vec2 uv, in vec2 o, in float off, in vec3 color, in vec2 initDir, float r ) {
  float t = iGlobalTime + off;
  vec3 col = vec3(0.);
#ifdef playLevel
  if (t < 0. || t > dd2) {
    return col;
  }
#else
  if (t < 0. || t < dd2) {
    return col;
  }

#endif

  float nt = floor(t / dd2) + off + o.x + o.y;
  t = mod (t, dd2 );


  if (t < tt1) {
    for (int i = 0; i < til; i++) {
      float id = float(i) / float(til);
      vec2 q = uv - getPos(o, t - lengthStep * id, initDir) + noise( vec2((id + hash(nt) + t ) * .65) ) * 0.005;
      col += drawParticle(q, mix(0.02, 0.012, id) , mix(color, vec3(0.), id ));

    }
    //flare
    vec2 flarePos = uv - getPos(o, t, initDir );
    col += mix( color * mix( 1.0, 0.0, dot(flarePos, flarePos) * 800. ),
                vec3(0.) , drawPoint( (0.0003 * abs(.1 + sin(t * .9 + pi * .3) ) ) * powFunc( atan( flarePos.y, flarePos.x ) * 4. ) , .01, flarePos) );
  }
  else {
    float t2 = t - tt1;
    vec2 ep = getPos(o, tt1, initDir);
    float lerp = t2 / (dd2 - tt1);
    for (int j = 0; j < 50; j++) {
      vec2 rawdir = normalize(noise( vec2( float(j) / 50. , hash(float(j) + nt ) * .5 )) );
      vec2 q = uv - getPos2(ep, t2, r * rawdir );

      float flicker = circleflickerPow * hash(float(j) + lerp);
      col += drawParticle(q, (0.01 + flicker) * abs(cos(lerp * .5 * pi) ), color );
    }

    //boom light
    col += mix( mix(color, vec3(0.), clamp(3.*lerp , 0., 1.)  ) , vec3(0.) , drawPoint(0.0, .7, uv - ep) );
  }
  return col;
}



vec3 drawFly(in vec2 uv, in vec2 o, in float off, in vec3 color, in vec2 initDir ) {
  float t = iGlobalTime + off;
  vec3 col = vec3(0.);


#ifdef playLevel
  if (t < 0. || t > dd1) {
    return col;
  }
#else
  if (t < 0. || t < dd1) {
    return col;
  }

#endif

  float nt = floor(t / dd1) + off + o.x + o.y;
  t = mod (t, dd1 );


  if (t < tt1) {
    for (int i = 0; i < til; i++) {
      float id = float(i) / float(til);
      vec2 q = uv - getPos(o, t - lengthStep * id, initDir) + noise( vec2((id + hash(nt) + t ) * .65) ) * 0.005;
      col += drawParticle(q, mix(0.02, 0.012, id),
                          mix(color, vec3(0.), id ));

    }
    //flare
    vec2 flarePos = uv - getPos(o, t, initDir );
    col += mix( color * mix( 1.0, 0.0, dot(flarePos, flarePos) * 800. ),
                vec3(0.) , drawPoint( (0.0003 * abs(.1 + sin(t * .9 + pi * .3) ) ) * powFunc( atan( flarePos.y, flarePos.x ) * 4. ) , .01, flarePos) );
  }
  else {
    float t2 = t - tt1;
    vec2 ep = getPos(o, tt1, initDir);
    float lerp = t2 / (dd1 - tt1);
    for (int i = 0; i < etil; i++) {
      float id = float(i) / float(etil);
      for (int j = 0; j < numParticle; j++) {
        vec2 dir = noise( vec2( float(j) / float(numParticle) ,
                                hash(float(j) + nt ) * .5 ) ) * explodePow;

        vec2 q = uv - getPos(ep, t2 - 0.2 * explodeStep * id, dir );
        float flicker = normalflickerPow * hash(float(j) + lerp);
        col += drawParticle(q, (0.01 + flicker) * abs(cos(lerp * .5 * pi) ), color * mix(1., 0., id ) );
      }
    }

    //boom light
    col += mix( mix(color, vec3(0.), clamp(3.*lerp , 0., 1.)  ) , vec3(0.) , drawPoint(0.0, .7, uv - ep) );

  }
  //return mix(fcol,ecol, 0.5*sign(t-tt1)+0.5 );
  return col;
}

float drawMoon(in vec2 p) {
  const float r = .18;
  float moon = smoothstep(r, r + 0.01 , dot(p, p) * 4.4 ) ;
  vec2 lp = p - vec2(-0.05, 0.01);
  float lightMoon = 1. - ( smoothstep(r - 0.01, r + 0.03 , dot(lp, lp) * 5.1 ) - moon );
  return clamp(lightMoon, 0.0, 1.0);
}

vec3 randomFire(vec2 p, vec2 uv, float time, vec2 os) {
  vec3 col = vec3(0.);
  vec2 rnd = vec2(0.3, 0.7);
  for (int i = 0; i < 10; i++) {
    rnd.x = 2.* ( hash( float(i) * 0.3 + time) - 0.5 );
    rnd.y = hash( float(i * 10) * .3 + 2. + time) ;
    vec3 color = vec3 ( hash( float(i) ), hash( float(i) + 1. ), hash( float(i) + 2. ) );

    col += drawFly(uv, p, time - float(i) * 0.25, color, vec2( rnd.x * 0.1 + os.x , os.y + rnd.y * 0.05 ) );
  }
  return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {


  vec2 p = fragCoord.xy / iResolution.xy;
  float ratio = iResolution.y / iResolution.x;
  vec2 uv = p;
  uv.y *= ratio;

  //bg sky
  float lerp = smoothstep(.0, 1. , uv.y );
  vec3 col = mix(vec3(.1, .2, .3), vec3(.1, .1, .1) , sqrt(uv.y)  );

  vec2 moonPos = uv - vec2(.568, .29);
  //bg stars
  col.xyz += mix(vec3(0.) , sign ( vec3( clamp(rand(uv) - 0.9985, 0., 1. ) ) ) ,   clamp (sign (dot(moonPos, moonPos) - 0.05), 0., 1. ) );

  vec3 moonCol = vec3(0.45, 0.3, 0.3);
  col = mix (moonCol, col, drawMoon(moonPos ) );


  //firework level sequence
#ifdef playLevel

  float stage = 0.;
  col += drawFly( uv, vec2(0.65, 0.0), 0., vec3(.9, .6, .0), vec2(-0.1, .4) );
  col += drawFly( uv, vec2(0.45, 0.0), -4.0, vec3(.3, .5, .9), vec2(.1, 0.35) );

  col += drawFly( uv, vec2(0.65, 0.0), -8.5, vec3(.9, .1, .0), vec2(-0.1, .4) );
  col += drawFly( uv, vec2(0.45, 0.0), -8.5, vec3(.3, .2, .9), vec2(0.1, 0.35) );

  col += drawFly( uv, vec2(0.65, 0.0), -12.5, vec3(.6, .9, .0), vec2(-0.15, .35) );
  col += drawFly( uv, vec2(0.5, 0.0), -12.5, vec3(.9, .9, .9), vec2(0.0, .4) );
  col += drawFly( uv, vec2(0.45, 0.0), -12.5, vec3(.9, .5, .1), vec2(.15, 0.35) );


  stage -= 16.;
  for (int ii = 0; ii < 5; ii++) {
    float i = float(ii);
    col += drawFly( uv, vec2(0.3 + 0.1 * i, 0.0), stage - 0.5 * i, vec3(.6, .4, .0), vec2(0.0, .4) );
  }
  /*
      stage-=5.0;
      for (float i=0.;i<5.;i++){
          col+=drawFly( uv,vec2(0.7-0.1*i,0.0),stage-i*0.5,vec3(.6,.4,.0), vec2(0.0,.4) );
      }


      stage-=5.;


      col+=drawFly( uv,vec2(0.4,0.0),stage,vec3(.6,.3,.5), vec2(0,0.3) );
      col+=drawFly( uv,vec2(0.6,0.0),stage,vec3(.6,.3,.5), vec2(0,0.3) );


      stage-=2.;
      col+=drawFly( uv,vec2(0.4,0.0),stage,vec3(.3,.5,.0), vec2(0,0.35) );
      col+=drawFly( uv,vec2(0.6,0.0),stage,vec3(.3,.5,.0), vec2(0,0.35) );

      stage-=2.;
      col+=drawFly( uv,vec2(0.4,0.0),stage,vec3(.1,.4,.4), vec2(0,0.4) );
      col+=drawFly( uv,vec2(0.6,0.0),stage,vec3(.1,.4,.4), vec2(0,0.4) );
  */
  stage -= 4.;
  col += randomFire(vec2(0.5, 0.0), uv, stage, vec2(0., 0.35) );

  stage -= 5.;
  for (int ii = 0; ii < 5; ii++) {
    float i = float(ii);
    col += drawFly( uv, vec2(0.7 - i * 0.1, 0.0), stage - i * 0.5, vec3(.1, .4, .6), vec2(0.1, .4) );
  }

  stage -= 4.;
  for (int ii = 0; ii < 5; ii++) {
    float i = float(ii);
    col += drawFly( uv, vec2(0.7 - i * 0.1, 0.0), stage - i * 0.5, vec3(.6, .2, .6), vec2(-0.1, .4) );
  }

  stage -= 4.;
  for (int ii = 0; ii < 5; ii++) {
    float i = float(ii);
    col += drawFly( uv, vec2(0.7 - i * 0.1, 0.0), stage - i * 0.5, vec3(.1, .4, .6), vec2(0.1, .4) );
    col += drawFly( uv, vec2(0.7 - i * 0.1, 0.0), stage - 2.0 + i * 0.5, vec3(.6, .2, .6), vec2(-0.1, 0.4) );
  }

  stage -= 4.;
  for (int ii = 0; ii < 5; ii++) {
    float i = float(ii);
    col += drawFly( uv, vec2(0.7 - i * 0.1, 0.0), stage - 2.0 + i * 0.5, vec3(.2, .4, .4), vec2(0.1, .4) );
    col += drawFly( uv, vec2(0.7 - i * 0.1, 0.0), stage - i * 0.5, vec3(.6, .2, .2), vec2(-0.1, 0.4) );
  }
  /*
   stage-=4.;
   for (float i=0.;i<5.;i++){
       col+=drawFly( uv,vec2(0.7-i*0.1,0.0),stage-i*0.5,vec3(.6,.4,.0), vec2(0.1,.4) );
       col+=drawFly( uv,vec2(0.7-i*0.1,0.0),stage-2.0+i*0.5,vec3(.6,.4,.0), vec2(-0.1,0.4) );
   }

   for (float i=0.;i<5.;i++){
       col+=drawFly( uv,vec2(0.7-i*0.1,0.0),stage-2.0+i*0.5,vec3(.6,.4,.0), vec2(0.1,.4) );
       col+=drawFly( uv,vec2(0.7-i*0.1,0.0),stage-i*0.5,vec3(.6,.4,.0), vec2(-0.1,0.4) );
   }
  */
  stage -= 4.;

  col += drawFlyHeart( uv, vec2(0.5, 0.0), stage, vec3(.7, .4, .6), vec2(0.0, 0.4) , 0.01);

  stage -= 6.;
  col += drawFlyCircle( uv, vec2(0.3, 0.0), stage, vec3(.1, .4, .6), vec2(0.0, 0.35) , 0.06);
  col += drawFlyCircle( uv, vec2(0.7, 0.0), stage, vec3(.1, .4, .6), vec2(0.0, 0.35) , 0.06);

  stage -= 2.;
  col += drawFlyFlower( uv, vec2(0.4, 0.0), stage, vec3(.7, .4, .1), vec2(0.0, 0.4) , 5);
  col += drawFlyFlower( uv, vec2(0.6, 0.0), stage, vec3(.7, .4, .1), vec2(0.0, 0.4) , 5);

  stage -= 2.;
  col += drawFlyCircle( uv, vec2(0.3, 0.0), stage, vec3(.6, .5, .6), vec2(0.0, 0.35) , 0.06);
  col += drawFlyCircle( uv, vec2(0.7, 0.0), stage, vec3(.6, .5, .6), vec2(0.0, 0.35) , 0.06);

  stage -= 2.;
  col += drawFlyFlower( uv, vec2(0.4, 0.0), stage, vec3(.1, .4, .7), vec2(0.0, 0.4) , 5);
  col += drawFlyFlower( uv, vec2(0.6, 0.0), stage, vec3(.1, .4, .7), vec2(0.0, 0.4) , 5);

  stage -= 4.;
  for (int ii = 0; ii < 4; ii++) {
    float i = float(ii);
    col += drawFlyCircle( uv, vec2(0.2 + i * 0.2, 0.0), stage - i, vec3(.6, .2, .0), vec2(0.0, .4), 0.06 );
  }

  stage -= .5;
  for (int ii = 0; ii < 3; ii++) {
    float i = float(ii);
    col += drawFlyCircle( uv, vec2(0.3 + i * 0.2, 0.0), stage - i, vec3(.2, .4, .6), vec2(0.0, 0.35), 0.06 );
  }

  stage -= 5.;
  for (int ii = 0; ii < 4; ii++) {
    float i = float(ii);
    col += drawFlyCircle( uv, vec2(0.2 + i * 0.2, 0.0), stage, vec3(.6, .1, .0), vec2(0.0, .4), 0.06 );
  }

  for (int ii = 0; ii < 3; ii++) {
    float i = float(ii);
    col += drawFlyCircle( uv, vec2(0.3 + i * 0.2, 0.0), stage, vec3(.2, .4, .6), vec2(0.0, 0.35), 0.06 );
  }

  //stage-=4.;
  //col+=randomFire(vec2(0.5,0.0),uv,stage,vec2(0.0,0.36) );

  stage -= 2.;
  col += drawFlyFlower( uv, vec2(0.2, 0.0), stage, vec3(.7, .4, .1), vec2(0.0, 0.35) , 4);
  col += drawFlyFlower( uv, vec2(0.8, 0.0), stage, vec3(.7, .4, .1), vec2(0.0, 0.35) , 4);


  stage -= 4.;
  /*
  for (float i=0.;i<5.;i++){
  col+=drawFlyHeart( uv,vec2(0.3,0.0),stage-i*5.0,vec3(.7,.4,.6), vec2(-0.05,0.38) ,-0.1);
  col+=drawFlyHeart( uv,vec2(0.7,0.0),stage-i*5.0,vec3(.7,.4,.6), vec2(0.05,0.38) ,0.1);
  }
    */

  for (int ii = 0; ii < 5; ii++) {
    float i = float(ii);
    col += drawFly( uv, vec2(0.6, 0.0), stage - i * 10.5, vec3(.7, .3, .0), vec2(0.07, 0.36) );
    col += drawFlyCircle(uv, vec2(0.6, 0.0), stage - i * 10.5 - 1.0, vec3(.6, .4, .0), vec2(-0.1, .3), 0.05 );
    col += drawFlyStar(uv, vec2(0.4, 0.0), stage - i * 10.5 - 2.5, vec3(.0, .4, .6), vec2(0.1, 0.4) );
    col += drawFlyFlower( uv, vec2(0.5, 0.0), stage - i * 10.5 - 4.5, vec3(.2, .6, .1), vec2(-.13, 0.28) , 5);
    col += drawFlyHeart( uv, vec2(0.5, 0.0), stage - i * 10.5 - 5.5, vec3(.7, .4, .6), vec2(0.0, 0.45) , -0.05);
  }

#else


  //col+=randomFire(vec2(0.5,0.0),uv,0.,vec2(0.0,0.36) );


  /*
    for (float i=0.0;i<10.;i++){
      col+=drawFly( uv,vec2(0.6,0.0),-i*10.5,vec3(.7,.3,.0), vec2(0.07,0.36) );
        col+=drawFlyCircle(uv,vec2(0.6,0.0),-i*10.5-1.0,vec3(.6,.4,.0), vec2(-0.1,.3), 0.05 );
        col+=drawFlyStar(uv,vec2(0.4,0.0),-i*10.5-2.5,vec3(.0,.4,.6), vec2(0.1,0.4) );
    col+=drawFlyFlower( uv,vec2(0.5,0.0),-i*10.5-4.5,vec3(.2,.6,.1), vec2(0.0,0.35) , 5);
      col+=drawFlyHeart( uv,vec2(0.5,0.0),-i*10.5-5.5,vec3(.7,.4,.6), vec2(-0.13,0.38) , -0.1);
    }
  */
  col += drawFly( uv, vec2(0.6, 0.0), 0.0, vec3(.7, .3, .0), vec2(0.07, 0.36) );
  col += drawFlyCircle(uv, vec2(0.6, 0.0), -1.0, vec3(.6, .4, .0), vec2(-0.1, .3), 0.05 );
  col += drawFlyStar(uv, vec2(0.4, 0.0), -2.5, vec3(.0, .4, .6), vec2(0.1, 0.4) );
  col += drawFlyFlower( uv, vec2(0.5, 0.0), -4.5, vec3(.2, .6, .1), vec2(0.0, 0.35) , 5);
  col += drawFlyHeart( uv, vec2(0.5, 0.0), -5.5, vec3(.7, .4, .6), vec2(-0.13, 0.38) , -0.1);


#endif

  //ground
  vec3 earthCol = vec3(0.1, 0.1, 0.1);
  float g = 0.02 * exp( (uv.x ) * 1.2);
  col = mix (earthCol, col, smoothstep(g, g + 0.015 , abs(uv.y + 0.02) )  );

  //grass

  //vec3 grassCol=vec3(.5,.7,.4);
#ifdef drawGrass
  float it = 0.;
  for (int i = 0; i < grassCount; i++) {
    it += 1.;
    float h = .04 + it * hash(it) * 0.0008;
    vec2 gp = uv - vec2(it * 1. / float(grassCount) + hash(it) * 0.02 + mix(0., 0.15, uv.y) * cos(iGlobalTime * (1. + 0.5 * sin(it) ) + it) , h + 0.0005 * it);
    float w = mix(.0015, 0., (uv.y + gp.y) / h );
    col = mix(earthCol, col, 1. - (1. - smoothstep(h, h + 0.001, abs(gp.y ) )  ) * (1. - smoothstep(w, w + 0.001, abs(gp.x - 0.04 * cos(12.*gp.y + it / 100.*pi) ) )  ) );
  }
#endif

  //float ll=0.1*hash(uv.x*1.);
  ////ll=1.0*noise( uv*40. ).x;
  //col=mix(vec3(1.),col,smoothstep(ll,ll+0.01, p.y) );
  fragColor = vec4(col, 0.  );

}

void main()
{
    mainImage(fragColor, fragCoord);
}


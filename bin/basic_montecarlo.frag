// Created by inigo quilez - iq/2016
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0

// Pathtrace the scene. One path per pixel. Samples the sun light and the
// sky dome light at each vertex of the path.

// More info here: http://iquilezles.org/www/articles/simplepathtracing/simplepathtracing.htm


//------------------------------------------------------------------
float iFrame = 0.0;
float hash(float seed)
{
    return fract(sin(seed)*43758.5453 );
}

vec3 cosineDirection( in float seed, in vec3 nor)
{

    // compute basis from normal
    // see http://orbit.dtu.dk/fedora/objects/orbit:113874/datastreams/file_75b66578-222e-4c7d-abdf-f7e255100209/content
    // (link provided by nimitz)
    vec3 tc = vec3( 1.0+nor.z-nor.xy*nor.xy, -nor.x*nor.y)/(1.0+nor.z);
    vec3 uu = vec3( tc.x, tc.z, -nor.x );
    vec3 vv = vec3( tc.z, tc.y, -nor.y );
    
    float u = hash( 78.233 + seed);
    float v = hash( 10.873 + seed);
    float a = 6.283185 * v;

    return  sqrt(u)*(cos(a)*uu + sin(a)*vv) + sqrt(1.0-u)*nor;
}

//------------------------------------------------------------------

float maxcomp(in vec3 p ) { return max(p.x,max(p.y,p.z));}

float sdBox( vec3 p, vec3 b )
{
  vec3  di = abs(p) - b;
  float mc = maxcomp(di);
  return min(mc,length(max(di,0.0)));
}

float map( vec3 p )
{
    vec3 w = p;
    vec3 q = p;

    q.xz = mod( q.xz+1.0, 2.0 ) -1.0;
    
    float d = sdBox(q,vec3(1.0));
    float s = 1.0;
    for( int m=0; m<6; m++ )
    {
        float h = float(m)/6.0;

        p =  q - 0.5*sin( abs(p.y) + float(m)*3.0+vec3(0.0,3.0,1.0));

        vec3 a = mod( p*s, 2.0 )-1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0*abs(a));

        float da = max(r.x,r.y);
        float db = max(r.y,r.z);
        float dc = max(r.z,r.x);
        float c = (min(da,min(db,dc))-1.0)/s;

        d = max( c, d );
   }

    
   float d1 = length(w-vec3(0.22,0.35,0.4)) - 0.09;
   d = min( d, d1 );

   float d2 = w.y + 0.22;
   d =  min( d,d2);

    
   return d;
}

//------------------------------------------------------------------

vec3 calcNormal( in vec3 pos )
{
    vec3 eps = vec3(0.0001,0.0,0.0);

    return normalize( vec3(
      map( pos+eps.xyy ) - map( pos-eps.xyy ),
      map( pos+eps.yxy ) - map( pos-eps.yxy ),
      map( pos+eps.yyx ) - map( pos-eps.yyx ) ) );
}


float intersect( in vec3 ro, in vec3 rd )
{
    float res = -1.0;
    float tmax = 16.0;
    float t = 0.01;
    for(int i=0; i<128; i++ )
    {
        float h = map(ro+rd*t);
        if( h<0.0001 || t>tmax ) break;
        t +=  h;
    }
    
    if( t<tmax ) res = t;

    return res;
}

float shadow( in vec3 ro, in vec3 rd )
{
    float res = 0.0;
    
    float tmax = 12.0;
    
    float t = 0.001;
    for(int i=0; i<80; i++ )
    {
        float h = map(ro+rd*t);
        if( h<0.0001 || t>tmax) break;
        t += h;
    }

    if( t>tmax ) res = 1.0;
    
    return res;
}


vec3 sunDir = normalize(vec3(-0.3,1.3,0.1));
vec3 sunCol =  6.0*vec3(1.0,0.8,0.6);
vec3 skyCol =  4.0*vec3(0.2,0.35,0.5);


vec3 calculateColor(vec3 ro, vec3 rd, float sa )
{
    const float epsilon = 0.0001;

    vec3 colorMask = vec3(1.0);
    vec3 accumulatedColor = vec3(0.0);

    float fdis = 0.0;
    for( int bounce = 0; bounce<3; bounce++ ) // bounces of GI
    {
        rd = normalize(rd);
       
        //-----------------------
        // trace
        //-----------------------
        float t = intersect( ro, rd );
        if( t < 0.0 )
        {
            if( bounce==0 ) return mix( 0.05*vec3(0.9,1.0,1.0), skyCol, smoothstep(0.1,0.25,rd.y) );
            break;
        }

        if( bounce==0 ) fdis = t;

        vec3 pos = ro + rd * t;
        vec3 nor = calcNormal( pos );
        vec3 surfaceColor = vec3(0.4)*vec3(1.2,1.1,1.0);

        //-----------------------
        // add direct lighitng
        //-----------------------
        colorMask *= surfaceColor;

        vec3 iColor = vec3(0.0);

        // light 1        
        float sunDif =  max(0.0, dot(sunDir, nor));
        float sunSha = 1.0; if( sunDif > 0.00001 ) sunSha = shadow( pos + nor*epsilon, sunDir);
        iColor += sunCol * sunDif * sunSha;
        // todo - add back direct specular

        // light 2
        vec3 skyPoint = cosineDirection( sa + 7.1*float(iFrame) + 5681.123 + float(bounce)*92.13, nor);
        float skySha = shadow( pos + nor*epsilon, skyPoint);
        iColor += skyCol * skySha;


        accumulatedColor += colorMask * iColor;

        //-----------------------
        // calculate new ray
        //-----------------------
        //float isDif = 0.8;
        //if( hash(sa + 1.123 + 7.7*float(bounce)) < isDif )
        {
           rd = cosineDirection(76.2 + 73.1*float(bounce) + sa + 17.7*float(iFrame), nor);
        }
        //else
        {
        //    float glossiness = 0.2;
        //    rd = normalize(reflect(rd, nor)) + uniformVector(sa + 111.123 + 65.2*float(bounce)) * glossiness;
        }

        ro = pos;
   }

   float ff = exp(-0.01*fdis*fdis);
   accumulatedColor *= ff; 
   accumulatedColor += (1.0-ff)*0.05*vec3(0.9,1.0,1.0);

   return accumulatedColor;
}

mat3 setCamera( in vec3 ro, in vec3 rt, in float cr )
{
    vec3 cw = normalize(rt-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, -cw );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    float sa = hash( dot( fragCoord, vec2(12.9898, 78.233) ) + 1113.1*float(iFrame) );
    
    vec2 of = -0.5 + vec2( hash(sa+13.271), hash(sa+63.216) );
    vec2 p = (-iResolution.xy + 2.0*(fragCoord+of)) / iResolution.y;

    vec3 ro = vec3(0.0,0.0,0.0);
    vec3 ta = vec3(1.5,0.7,1.5);

    mat3  ca = setCamera( ro, ta, 0.0 );
    vec3  rd = normalize( ca * vec3(p,-1.3) );

    vec3 col = texture2D( iChannel0, fragCoord/iResolution.xy ).xyz;
    if( iFrame==0 ) col = vec3(0.0);
    
    col += calculateColor( ro, rd, sa );

    fragColor = vec4( col, 1.0 );
}
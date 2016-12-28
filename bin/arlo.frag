// Created by inigo quilez - iq/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0

// More info: http://www.iquilezles.org/www/articles/filteringrm/filteringrm.htm

vec2 sphIntersect( in vec3 ro, in vec3 rd, in vec4 sph )
{
    vec3 oc = ro - sph.xyz;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - sph.w*sph.w;
    float h = b*b - c;
    if( h<0.0 ) return vec2(-1.0);
    h = sqrt( h );
    return vec2(-b - h, -b+h);
}

vec2 sdSegment( in vec3 p, vec3 a, vec3 b )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return vec2( length( pa - ba*h ), h );
}

float sdSphere( in vec3 p, in vec3 c, in float r )
{
    return length(p-c) - r;
}

float sdEllipsoid( in vec3 p, in vec3 c, in vec3 r )
{
    return (length( (p-c)/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

// http://research.microsoft.com/en-us/um/people/hoppe/ravg.pdf
float det( vec2 a, vec2 b ) { return a.x*b.y-b.x*a.y; }
vec3 getClosest( vec2 b0, vec2 b1, vec2 b2 ) 
{
    
  float a =     det(b0,b2);
  float b = 2.0*det(b1,b0);
  float d = 2.0*det(b2,b1);
  float f = b*d - a*a;
  vec2  d21 = b2-b1;
  vec2  d10 = b1-b0;
  vec2  d20 = b2-b0;
  vec2  gf = 2.0*(b*d21+d*d10+a*d20); gf = vec2(gf.y,-gf.x);
  vec2  pp = -f*gf/dot(gf,gf);
  vec2  d0p = b0-pp;
  float ap = det(d0p,d20);
  float bp = 2.0*det(d10,d0p);
  float t = clamp( (ap+bp)/(2.0*a+b+d), 0.0 ,1.0 );
  return vec3( mix(mix(b0,b1,t), mix(b1,b2,t),t), t );
}

vec2 sdBezier( vec3 a, vec3 b, vec3 c, vec3 p )
{
    vec3 w = normalize( cross( c-b, a-b ) );
    vec3 u = normalize( c-b );
    vec3 v = normalize( cross( w, u ) );

    vec2 a2 = vec2( dot(a-b,u), dot(a-b,v) );
    vec2 b2 = vec2( 0.0 );
    vec2 c2 = vec2( dot(c-b,u), dot(c-b,v) );
    vec3 p3 = vec3( dot(p-b,u), dot(p-b,v), dot(p-b,w) );

    vec3 cp = getClosest( a2-p3.xy, b2-p3.xy, c2-p3.xy );

    return vec2( sqrt(dot(cp.xy,cp.xy)+p3.z*p3.z), cp.z );
}

vec2 sdLine( vec3 p, vec3 a, vec3 b )
{
    vec3 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return vec2( length( pa - ba*h ), h );
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec2 smin( vec2 a, vec2 b, float k )
{
    float h = clamp( 0.5 + 0.5*(b.x-a.x)/k, 0.0, 1.0 );
    return vec2( mix( b.x, a.x, h ) - k*h*(1.0-h), mix( b.y, a.y, h ) );
}

float smax( float a, float b, float k )
{
    float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
    return mix( a, b, h ) + k*h*(1.0-h);
}

//---------------------------------------------------------------------------

vec4 texcube( sampler2D sam, in vec3 p, in vec3 n, in float k, in vec3 g1, in vec3 g2 )
{
    vec3 m = pow( abs( n ), vec3(k) );
    vec4 x = texture2DGradEXT( sam, p.yz, g1.yz, g2.yz );
    vec4 y = texture2DGradEXT( sam, p.zx, g1.zx, g2.zx );
    vec4 z = texture2DGradEXT( sam, p.xy, g1.xy, g2.xy );
    return (x*m.x + y*m.y + z*m.z) / (m.x + m.y + m.z);
}

// http://www.iquilezles.org/www/articles/texture/texture.htm
vec4 textureImproved( sampler2D tex, in vec2 res, in vec2 uv, in vec2 g1, in vec2 g2 )
{
    uv = uv*res + 0.5;
    vec2 iuv = floor( uv );
    vec2 fuv = fract( uv );
    uv = iuv + fuv*fuv*(3.0-2.0*fuv);
    uv = (uv - 0.5)/res;
    return texture2DGradEXT( tex, uv, g1, g2 );
}
//---------------------------------------------------------------------------

mat3 base( in vec3 ww )
{
    vec3  vv  = vec3(0.0,0.0,1.0);
    vec3  uu  = normalize( cross( vv, ww ) );
    return mat3(uu.x,ww.x,vv.x,
                uu.y,ww.y,vv.y,
                uu.z,ww.z,vv.z);
}

//---------------------------------------------------------------------------

vec2 leg( in vec3 p, in vec3 pa, in vec3 pb, in vec3 pc, float m, float h )
{
    float l = sign(pa.z);
    
    vec2 b = sdLine( p, pa, pb );

    float tr = 0.15;// - 0.2*b.y;
    float d3 = b.x - tr;

    b = sdLine( p, pb, pc );
    tr = 0.15;// - 0.2*b.y;
    d3 = smin( d3, b.x - tr, 0.1 );

    // knee
    float d4 = sdEllipsoid( p, pb+vec3(-0.02,0.05,0.0), vec3(0.14) );
    //d4 -= 0.01*abs(sin(50.0*p.y));
    d4 -= 0.015*abs(sin(40.0*p.y));
    d3 = smin( d3, d4, 0.05 );

    // paw        
    vec3 ww = normalize( mix( normalize(pc-pb), vec3(0.0,1.0,0.0), h) );
    mat3 pr = base( ww );
    vec3 fc = pr*((p-pc))-vec3(0.2,0.0,0.0)*(-1.0+2.0*h);
    d4 = sdEllipsoid( fc, vec3(0.0), vec3(0.4,0.25,0.4) );

    // nails
    float d6 = sdEllipsoid( fc, vec3(0.32,-0.06,0.0)*(-1.0+2.0*h), 0.95*vec3(0.1,0.2,0.15));
    d6 = min( d6, sdEllipsoid( vec3(fc.xy,abs(fc.z)), vec3(0.21*(-1.0+2.0*h),-0.08*(-1.0+2.0*h),0.26), 0.95*vec3(0.1,0.2,0.15)) );
    // space for nails
    d4 = smax( d4, -d6, 0.03 );

    // shape paw
    float d5 = sdEllipsoid( fc, vec3(0.0,1.85*(-1.0+2.0*h),0.0), vec3(2.0,2.0,2.0) );
    d4 = smax( d4, d5, 0.03 );
    d6 = smax( d6, d5, 0.03 );
    d5 = sdEllipsoid( fc, vec3(0.0,-0.75*(-1.0+2.0*h),0.0), vec3(1.0,1.0,1.0) );
    d4 = smax( d4, d5, 0.03 );
    d6 = smax( d6, d5, 0.03 );

    d3 = smin( d3, d4, 0.1 );
    

    // muslo
    d4 = sdEllipsoid( p, pa+vec3(0.0,0.2,-0.1*l), vec3(0.35)*m );
    d3 = smin( d3, d4, 0.1 );

    return vec2(d3,d6);
}

vec2 mapArlo( vec3 p )
{

    // body
    vec3 q = p;
    float co = cos(0.2);
    float si = sin(0.2);
    q.xy = mat2(co,si,-si,co)*q.xy;
    float d1 = sdEllipsoid( q, vec3(0.0,0.0,0.0), vec3(1.3,0.75,0.8) );
    float d2 = sdEllipsoid( q, vec3(0.05,0.45,0.0), vec3(0.8,0.6,0.5) );
    float d = smin( d1, d2, 0.4 );
    
    //neck wrinkles
    float r = length(p-vec3(-1.2,0.2,0.0));
    d -= 0.05*abs(sin(35.0*r))*exp(-7.0*abs(r)) * clamp(1.0-(p.y-0.3)*10.0,0.0,1.0);

    // tail
    {
    vec2 b = sdBezier( vec3(1.0,-0.4,0.0), vec3(2.0,-0.96,-0.5), vec3(3.0,-0.5,1.5), p );
    float tr = 0.3 - 0.25*b.y;
    float d3 = b.x - tr;
    d = smin( d, d3, 0.2 );
    }
    
    // neck
    {
    vec2 b = sdBezier( vec3(-0.9,0.3,0.0), vec3(-2.2,0.5,0.0), vec3(-2.6,1.7,0.0), p );
    float tr = 0.35 - 0.23*b.y;
    float d3 = b.x - tr;
    d = smin( d, d3, 0.15 );
    //d = min(d,d3);
    }


    float dn;
    // front-left leg
    {
    vec2 d3 = leg( p, vec3(-0.8,-0.1,0.5), vec3(-1.5,-0.5,0.65), vec3(-1.9,-1.1,0.65), 1.0, 0.0 );
    d = smin(d,d3.x,0.2);
    dn = d3.y;
    }
    // back-left leg
    {
    vec2 d3 = leg( p, vec3(0.5,-0.4,0.6), vec3(0.3,-1.05,0.6), vec3(0.8,-1.6,0.6), 0.5, 1.0 );
    d = smin(d,d3.x,0.2);
    dn = min(dn,d3.y);
    }
    // front-right leg
    {
    vec2 d3 = leg( p, vec3(-0.8,-0.2,-0.5), vec3(-1.0,-0.9,-0.65), vec3(-0.7,-1.6,-0.65), 1.0, 1.0 );
    d = smin(d,d3.x,0.2);
    dn = min(dn,d3.y);
    }
    // back-right leg
    {
    vec2 d3 = leg( p, vec3(0.5,-0.4,-0.6), vec3(0.8,-0.9,-0.6), vec3(1.6,-1.1,-0.7), 0.5, 0.0 );
    d = smin(d,d3.x,0.2);
    dn = min(dn,d3.y);
    }
    
    
    // head
    vec3 s = vec3(p.xy,abs(p.z));
    {
    vec2 l = sdLine( p, vec3(-2.7,2.36,0.0), vec3(-2.6,1.7,0.0) );
    float d3 = l.x - (0.22-0.1*smoothstep(0.1,1.0,l.y));
        
    // mouth
    //l = sdLine( p, vec3(-2.7,2.16,0.0), vec3(-3.35,2.12,0.0) );
    vec3 mp = p-vec3(-2.7,2.16,0.0);
    l = sdLine( mp*vec3(1.0,1.0,1.0-0.2*abs(mp.x)/0.65), vec3(0.0), vec3(-3.35,2.12,0.0)-vec3(-2.7,2.16,0.0) );
        
    float d4 = l.x - (0.12 + 0.04*smoothstep(0.0,1.0,l.y));      
    float d5 = sdEllipsoid( s, vec3(-3.4,2.5,0.0), vec3(0.8,0.5,2.0) );
    d4 = smax( d4, d5, 0.03 );
    
        
    d3 = smin( d3, d4, 0.1 );

        
    // mouth bottom
    {
    vec2 b = sdBezier( vec3(-2.6,1.75,0.0), vec3(-2.7,2.2,0.0), vec3(-3.25,2.12,0.0), p );
    float tr = 0.11 + 0.02*b.y;
    d4 = b.x - tr;
    d3 = smin( d3, d4, 0.001+0.06*(1.0-b.y*b.y) );
    }
        
    // brows    
    vec2 b = sdBezier( vec3(-2.84,2.50,0.04), vec3(-2.81,2.52,0.15), vec3(-2.76,2.4,0.18), s+vec3(0.0,-0.02,0.0) );
    float tr = 0.035 - 0.025*b.y;
    d4 = b.x - tr;
    d3 = smin( d3, d4, 0.025 );


    // eye wholes
    d4 = sdEllipsoid( s, vec3(-2.79,2.36,0.04), vec3(0.12,0.15,0.15) );
    d3 = smax( d3, -d4, 0.025 );    
        
    // nose holes    
    d4 = sdEllipsoid( s, vec3(-3.4,2.17,0.09), vec3(0.1,0.025,0.025) );
    d3 = smax( d3, -d4, 0.04 );    

        
    d = smin( d, d3, 0.01 );
    }
    vec2 res = vec2(d,0.0);
    
    
    // eyes
    float d4 = sdSphere( s, vec3(-2.755,2.36,0.045), 0.16 );
    if( d4<res.x ) res = vec2(d4,1.0);
    
    float te = texture2D( iChannel0, 3.0*p.xy ).x;
    float ve = normalize(p).y;
    res.x -= te*0.01*(1.0-smoothstep(0.6,1.5,length(p)))*(1.0-ve*ve);
    
    if( dn<res.x )  res = vec2(dn,3.0);

    return res;
}



vec2 legSimple( in vec3 p, in vec3 pa, in vec3 pb, in vec3 pc, float m, float h )
{
    float l = sign(pa.z);
    
    vec2 b = sdLine( p, pa, pb );

    float tr = 0.15;// - 0.2*b.y;
    float d3 = b.x - tr;

    b = sdLine( p, pb, pc );
    tr = 0.15;// - 0.2*b.y;
    d3 = smin( d3, b.x - tr, 0.1 );

    // paw        
    vec3 ww = normalize( mix( normalize(pc-pb), vec3(0.0,1.0,0.0), h) );
    mat3 pr = base( ww );
    vec3 fc = pr*((p-pc))-vec3(0.2,0.0,0.0)*(-1.0+2.0*h);
    float d4 = sdEllipsoid( fc, vec3(0.0), vec3(0.4,0.25,0.4) );

    // nails
    float d6 = sdEllipsoid( fc, vec3(0.32,-0.06,0.0)*(-1.0+2.0*h), 0.95*vec3(0.1,0.2,0.15));
    d6 = min( d6, sdEllipsoid( vec3(fc.xy,abs(fc.z)), vec3(0.21*(-1.0+2.0*h),-0.08*(-1.0+2.0*h),0.26), 0.95*vec3(0.1,0.2,0.15)) );
    // space for nails
    d4 = smax( d4, -d6, 0.03 );

    // shape paw
    float d5 = sdEllipsoid( fc, vec3(0.0,1.85*(-1.0+2.0*h),0.0), vec3(2.0,2.0,2.0) );
    d4 = smax( d4, d5, 0.03 );
    d6 = smax( d6, d5, 0.03 );
    d5 = sdEllipsoid( fc, vec3(0.0,-0.75*(-1.0+2.0*h),0.0), vec3(1.0,1.0,1.0) );
    d4 = smax( d4, d5, 0.03 );
    d6 = smax( d6, d5, 0.03 );

    d3 = smin( d3, d4, 0.1 );

    return vec2(d3,d6);
}

float mapArloSimple( vec3 p )
{

    // body
    vec3 q = p;
    float co = cos(0.2);
    float si = sin(0.2);
    q.xy = mat2(co,si,-si,co)*q.xy;
    float d1 = sdEllipsoid( q, vec3(0.0,0.0,0.0), vec3(1.3,0.75,0.8) );
    float d2 = sdEllipsoid( q, vec3(0.05,0.45,0.0), vec3(0.8,0.6,0.5) );
    float d = smin( d1, d2, 0.4 );
    
    // tail
    {
    vec2 b = sdBezier( vec3(1.0,-0.4,0.0), vec3(2.0,-0.96,-0.5), vec3(3.0,-0.5,1.5), p );
    float tr = 0.3 - 0.25*b.y;
    float d3 = b.x - tr;
    d = smin( d, d3, 0.2 );
    }
    
    // neck
    {
    vec2 b = sdBezier( vec3(-0.9,0.3,0.0), vec3(-2.2,0.5,0.0), vec3(-2.6,1.7,0.0), p );
    float tr = 0.35 - 0.23*b.y;
    float d3 = b.x - tr;
    d = smin( d, d3, 0.15 );
    //d = min(d,d3);
    }


    float dn;
    // front-left leg
    {
    vec2 d3 = legSimple( p, vec3(-0.8,-0.1,0.5), vec3(-1.5,-0.5,0.65), vec3(-1.9,-1.1,0.65), 1.0, 0.0 );
    d = smin(d,d3.x,0.2);
    dn = d3.y;
    }
    // back-left leg
    {
    vec2 d3 = legSimple( p, vec3(0.5,-0.4,0.6), vec3(0.3,-1.05,0.6), vec3(0.8,-1.6,0.6), 0.5, 1.0 );
    d = smin(d,d3.x,0.2);
    dn = min(dn,d3.y);
    }
    // front-right leg
    {
    vec2 d3 = legSimple( p, vec3(-0.8,-0.2,-0.5), vec3(-1.0,-0.9,-0.65), vec3(-0.7,-1.6,-0.65), 1.0, 1.0 );
    d = smin(d,d3.x,0.2);
    dn = min(dn,d3.y);
    }
    // back-right leg
    {
    vec2 d3 = legSimple( p, vec3(0.5,-0.4,-0.6), vec3(0.8,-0.9,-0.6), vec3(1.6,-1.1,-0.7), 0.5, 0.0 );
    d = smin(d,d3.x,0.2);
    dn = min(dn,d3.y);
    }
    
    
    // head
    vec3 s = vec3(p.xy,abs(p.z));
    {
    vec2 l = sdLine( p, vec3(-2.7,2.36,0.0), vec3(-2.6,1.7,0.0) );
    float d3 = l.x - (0.22-0.1*smoothstep(0.1,1.0,l.y));
        
    // mouth
    //l = sdLine( p, vec3(-2.7,2.16,0.0), vec3(-3.35,2.12,0.0) );
    vec3 mp = p-vec3(-2.7,2.16,0.0);
    l = sdLine( mp*vec3(1.0,1.0,1.0-0.2*abs(mp.x)/0.65), vec3(0.0), vec3(-3.35,2.12,0.0)-vec3(-2.7,2.16,0.0) );
        
    float d4 = l.x - (0.12 + 0.04*smoothstep(0.0,1.0,l.y));      
    float d5 = sdEllipsoid( s, vec3(-3.4,2.5,0.0), vec3(0.8,0.5,2.0) );
    d4 = smax( d4, d5, 0.03 );
    
        
    d3 = smin( d3, d4, 0.1 );

        
    // mouth bottom
    {
    vec2 b = sdBezier( vec3(-2.6,1.75,0.0), vec3(-2.7,2.2,0.0), vec3(-3.25,2.12,0.0), p );
    float tr = 0.11 + 0.02*b.y;
    d4 = b.x - tr;
    d3 = smin( d3, d4, 0.001+0.06*(1.0-b.y*b.y) );
    }
        
    // brows    
    vec2 b = sdBezier( vec3(-2.84,2.50,0.04), vec3(-2.81,2.52,0.15), vec3(-2.76,2.4,0.18), s+vec3(0.0,-0.02,0.0) );
    float tr = 0.035 - 0.025*b.y;
    d4 = b.x - tr;
    d3 = smin( d3, d4, 0.025 );

    d = smin( d, d3, 0.01 );
    }
    
    return min(d,dn);
}


vec3 drddx;
vec3 drddy;

vec2 mapTerrain( vec3 p, float t )
{
    float h = -2.0+0.03;

    h += 5.0*textureImproved( iChannel2, iChannelResolution[2].xy, 0.0004*p.xz, 0.0004*t*drddx.xz, 0.0004*t*drddy.xz ).x;
    
    float di = smoothstep(100.0,500.0,length(p.xz) );
    h += 2.0*di;
    h *= 1.0 + 3.0*di;


    if( (p.y-h)<0.5 && t<100.0 )
    {
        float at = 1.0-smoothstep( 50.0, 100.0, t );
        float gr = texture2DGradEXT( iChannel2, 0.004*p.xz, 0.004*t*drddx.xz, 0.004*t*drddy.xz ).x;
        float pi = texture2DGradEXT( iChannel0, 0.400*p.xz, 0.400*t*drddx.xz, 0.400*t*drddy.xz ).x;
            
        gr = smoothstep( 0.2, 0.3, gr-pi*0.3+0.15 );
        h += at*(1.0-gr)*0.15*pi;
        h += at*0.1*texture2DGradEXT( iChannel2, 0.04*p.xz, 0.04*t*drddx.xz, 0.04*t*drddy.xz ).x;
    }


    float d = 0.8*(p.y-h);
    
    return vec2(d,2.0);
}

float mapTotal( in vec3 pos )
{
    float d1 = mapArlo( pos ).x;
    float d2 = mapTerrain( pos, length(pos) ).x;
    return min(d1,d2);
}

vec3 calcNormal( in vec3 pos, in float eps )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*eps;
    return normalize( e.xyy*mapTotal( pos + e.xyy ) + 
                      e.yyx*mapTotal( pos + e.yyx ) + 
                      e.yxy*mapTotal( pos + e.yxy ) + 
                      e.xxx*mapTotal( pos + e.xxx ) );
}

float calcOcclusionArlo( in vec3 pos, in vec3 nor )
{
    float occ = 0.0;
    for( int i=0; i<8; i++ )
    {
        float h = 0.005 + 0.25*float(i)/7.0;
        vec3 dir = normalize( sin( float(i)*73.4 + vec3(0.0,2.1,4.2) ));
        dir = normalize( nor + dir );
        occ += (h-mapArlo( pos + h*dir ).x);
    }
    return clamp( 1.0 - 9.0*occ/8.0, 0.0, 1.0 );    
}

float calcOcclusionTerrain( in vec3 pos, in vec3 nor, float t )
{
    float occ = 0.0;
    for( int i=0; i<8; i++ )
    {
        float h = 0.005 + 0.25*float(i)/7.0;
        vec3 dir = normalize( sin( float(i)*73.4 + vec3(0.0,2.1,4.2) ));
        dir = normalize( nor + dir );
        occ += (h-mapTerrain( pos + h*dir, t ).x);
    }
    return clamp( 1.0 - 9.0*occ/8.0, 0.0, 1.0 );    
}


float calcShadowArlo( in vec3 ro, in vec3 rd, float k )
{
    float res = 1.0;
    
    // check bounding volume first
    vec2 bv = sphIntersect( ro, rd, vec4(-0.5,0.5,0.0,3.4) );
    if( bv.y>0.0 )
    {
        float t = 0.01;
        for( int i=0; i<32; i++ )
        {
            float h = mapArloSimple(ro + rd*t );
            res = min( res, smoothstep(0.0,1.0,k*h/t) );
            t += clamp( h, 0.04, 0.5 );
            if( res<0.01 ) break;
        }
    }
    return clamp(res,0.0,1.0);
}

float calcShadowTerrain( in vec3 ro, in vec3 rd, float k )
{
    float res = 1.0;

    float t = 0.1;
    for( int i=0; i<32; i++ )
    {
        vec3 pos = ro + rd*t;
        float h = mapTerrain(pos, length(pos)).x;
        res = min( res, smoothstep(0.0,1.0,8.0*h/t) );
        t += clamp( h, 0.05, 10.0 );
        if( res<0.01 ) break;
    }
    return clamp(res,0.0,1.0);
}

vec3 sunDir = normalize( vec3(0.1,0.05,0.2) );


// compute screen space derivatives of positions analytically without dPdx()
void calcDpDxy( in vec3 ro, in vec3 rd, in vec3 rdx, in vec3 rdy, in float t, in vec3 nor, out vec3 dpdx, out vec3 dpdy )
{
    dpdx = t*(rdx*dot(rd,nor)/dot(rdx,nor) - rd);
    dpdy = t*(rdy*dot(rd,nor)/dot(rdy,nor) - rd);
}

vec3 shade( in vec3 ro, in vec3 rd, in float t, in float m, in vec3 rdx, in vec3 rdy )
{
    float eps = 0.001;
    
    vec3 pos = ro + t*rd;
    vec3 nor = calcNormal( pos, eps*t );
    float kk;

    vec3 mateD = vec3(0.2,0.16,0.11);
    vec3 mateS = vec3(0.2,0.12,0.07);
    float mateK = 0.0;
    float focc = 1.0;
    
    // derivatives
    vec3 dposdx = t*drddx;
    vec3 dposdy = t*drddy;
    calcDpDxy( ro, rd, rdx, rdy, t, nor, dposdx, dposdy );

    
    if( m<0.5 ) // arlo
    {
        mateD = vec3(0.05,0.2,0.04)*0.7;
        mateS = vec3(2.0,1.0,1.0)*0.5;
    
        // back
        float pz = smoothstep(0.0,1.0,max(0.0,pos.y-0.0));
        float pp = smoothstep( 0.6, 1.6, sin(pos.x*18.0) + pz*1.5 );
        pp *= 1.0-smoothstep(0.1,1.5,length(pos-vec3(0.0,1.0,0.0)));
        mateD = mix( mateD, vec3(0.05,0.2,0.08)*0.54, pp );         
    
        // nose
        mateD = mix( mateD, vec3(0.13,0.21,0.04)*0.7,1.0-smoothstep(0.0,0.5,length(pos-vec3(-3.45,2.15,0.0))));

        // belly
        mateD = mix( mateD, vec3(0.16,0.22,0.10)*0.55,smoothstep(0.5,1.0,-nor.y)*(1.0-smoothstep(0.9,1.2,length(pos))));

        // neck
        vec2 b = sdSegment( pos, vec3(-0.9,-0.3,0.0), vec3(-2.6,1.7,0.0) );
        float tr = 0.3;// - 0.25*b.y;
        float d3 = b.x - tr;
        float bn = 1.0-smoothstep(0.05,0.15,d3);
        bn *= smoothstep(0.0,0.5,-nor.y);
        bn *= 1.0-smoothstep(0.7,1.0,b.y);
        mateD = mix( mateD, vec3(0.1,0.23,0.07)*0.7,bn);

        
        vec3 tc = texcube( iChannel1, 0.2*pos, nor, 4.0, 0.2*dposdx, 0.2*dposdy ).xyz;
        mateD *= 0.7+0.6*tc*tc;

        float te = texcube( iChannel0, 2.0*pos, nor, 4.0, 2.0*dposdx, 2.0*dposdy ).x;
        mateD *= 0.9 + 0.1*te;    
    
        mateK = 0.75*(0.5+0.5*tc.x*te);
        
        mateD.z += 0.05*(texcube( iChannel1, 0.025*pos, nor, 4.0, 0.025*dposdx, 0.025*dposdy ).x-0.5);
    }
    else if( m<1.5 ) // eyes
    {
        mateD = vec3(0.2,0.2,0.2)*0.7;
        mateK = 2.0;
        mateS = vec3(0.4);
        
        vec3 cen = vec3(-2.755,2.36,0.1*sign(pos.z));
        vec3 dir = normalize(pos-cen);
        vec3 view = vec3(-1.0,-0.1,0.1);//normalize( ro-(cen) );
        float d = dot( dir, view ); 
        
        float p = 1.0-smoothstep( 0.82, 0.83, d );
        mateD *= p;
        mateS *= p;
        float r  = pow(clamp( (d-0.83)/(1.0-0.83),0.0,1.0),2.0);
        
        float br = 3.5*pow(clamp(dot( nor, view ),0.0,1.0),32.0);
        mateD = mix( mateD, vec3(0.03,0.015,0.0)*2.5*(1.0+br), smoothstep(0.0,0.05,r) );
        mateD = mix( mateD, vec3(0.00,0.000,0.0), smoothstep(0.5,0.60,r) );
        
        float ff = smoothstep( 0.0, 0.1, -pos.x-2.75 );
        mateD *= ff;
        mateS *= ff;
        mateK *= ff;
    }
    else if( m<2.5 ) // terrain
    {
        mateD = vec3(0.1,0.05,0.02);
        mateD = pow( texture2DGradEXT( iChannel1, 0.3*pos.xz, 0.3*dposdx.xz, 0.3*dposdy.xz ).xyz, vec3(1.5))*0.3*vec3(1.1,1.0,0.9);
        mateK = 1.0;
        mateS = vec3(0.0,0.0,0.0);
        focc = texture2DGradEXT( iChannel0, 0.5*pos.xz, 0.5*dposdx.xz, 0.5*dposdy.xz ).x;
        
        // grass        
        float gr = texture2DGradEXT( iChannel2, 0.004*pos.xz, 0.004*dposdx.xz, 0.004*dposdy.xz ).x;
        float pi = texture2DGradEXT( iChannel0, 0.400*pos.xz, 0.400*dposdx.xz, 0.400*dposdy.xz ).x;
        gr = smoothstep( 0.2, 0.3, gr-pi*0.3+0.15 );
        float hi = smoothstep( 0.85, 1.0, nor.y )*gr;//iq
        mateD = mix( mateD, vec3(0.25,0.14,0.0)*0.4*(0.75+0.5*pi), hi );
        focc = mix( focc, 1.0, hi );
        mateK *= 1.0-hi;
        
        mateD *= 0.9;
    }
    else //if( m<3.5 ) // nails
    {
        mateD = vec3(0.12,0.12,0.05)*1.3;
        mateK = 0.0;
        mateS = vec3(0.0,0.0,0.0);
        float gr = texcube( iChannel2, 0.8*pos*vec3(1.0,0.2,1.0), nor, 4.0, 0.8*dposdx*vec3(1.0,0.2,1.0), 0.8*dposdy*vec3(1.0,0.2,1.0) ).x;
        mateD *= 0.6 + 0.8*gr;
    }    
    
    vec3 hal = normalize( sunDir-rd );
    float fre = clamp(1.0+dot(nor,rd), 0.0, 1.0 );
    float occ = min(calcOcclusionArlo(pos,nor),
                    calcOcclusionTerrain(pos,nor,t) )*focc;
        
    float dif1 = clamp( dot(nor,sunDir), 0.0, 1.0 );
    float bak = clamp( dot(nor,normalize(vec3(-sunDir.x,0.0,-sunDir.z))), 0.0, 1.0 );
    float sha = min( calcShadowArlo( pos, sunDir, 32.0 ),
                     calcShadowTerrain( pos, sunDir, 32.0 ) );
    dif1 *= sha;
    float spe1 = clamp( dot(nor,hal), 0.0, 1.0 );
    float bou = clamp( 0.5-0.5*nor.y, 0.0, 1.0 );

    // sun
    vec3 col = 4.0*vec3(1.1,0.7,0.3)*dif1;//*(0.5+0.5*occ);
    // sky
    col +=1.35*4.0*vec3(0.2,0.6,1.3)*occ*(0.5+0.5*nor.y);
    // ground
    col += 2.5*vec3(0.4,0.1,0.1)*bou*(0.5+0.5*occ);
    // back
    col += 1.0*vec3(0.8,0.5,0.4)*bak*occ;
    // sss
    col += 10.0*fre*(0.2+0.8*dif1*occ)*mateS;

    col *= mateD;

    // sun
    col += 0.5*vec3(1.0,0.9,0.8)*pow( spe1, 16.0 )*dif1*mateK;
    // sky
    col += 0.3*vec3(0.2,0.3,1.0)*occ*mateK*smoothstep( -0.3, 0.5, reflect( rd, nor ).y )*occ;

    // fog
    col = mix( col, vec3(0.4,0.5,0.8), 1.0-exp(-.0007*t));
    
    return col;        
}

vec2 intersect( in vec3 ro, in vec3 rd )
{
    vec2 resA = vec2(-1.0);
    vec2 resT = vec2(-1.0);
    float maxdist = 16.0;
    float t = 8.0;

    for( int i=0; i<128; i++ )
    {
        vec3 p = ro + t*rd;
        vec2 h = mapArlo( p );
        resA = vec2(t,h.y);
        if( h.x<(0.0001*t) ||  t>maxdist ) break;
        t += h.x*0.75;
    }

    vec2 res = vec2(-1.0);
    if( t<maxdist )
    {
        maxdist = t;//min(t,1500.0);
        res = resA;
    }
    else
    {
        maxdist = 1500.0;
    }

    //float h = (25.0-ro.y)/rd.y; if( h>0.0 ) maxdist =min(maxdist,h);
        
    t = 5.;
    for( int i=0; i<256; i++ )
    {

        vec3 p = ro + t*rd;
        vec2 h = mapTerrain( p, t );
        resT = vec2(t,h.y);
        if( h.x<(0.0001*t) ||  t>maxdist ) break;
        t += h.x*0.75;
    }

    if( t<maxdist )
    {
        res = resT;
    }

    return res;
}

vec3 render( in vec3 ro, in vec3 rd, in vec3 rdx, in vec3 rdy )
{
    // sky
    vec3 col = clamp(vec3(0.2,0.4,0.5)*1.3 - rd.y,0.0,1.0);
    // clouds
    float t = (1000.0-ro.y)/rd.y;
    if( t>0.0 )
    {
    vec2 uv = (ro+t*rd).xz;
    float cl = texture2D( iChannel2, .000013*uv ).x;
    cl = smoothstep(0.4,1.0,cl);
    col = mix( col, vec3(1.0), 0.4*cl );
    }
    // horizon
    col = mix( col, vec3(0.4,0.5,0.6), exp(-abs(15.0*rd.y)) ) ;

    vec2 tm = intersect( ro, rd );
    if( tm.y>-0.5  )
    {
        col = shade( ro, rd, tm.x, tm.y, rdx, rdy );
    }

    return pow( col, vec3(0.4545) );
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
    vec2 p = (-iResolution.xy+2.0*fragCoord.xy)/iResolution.y;

    // camera
    float an = 5.3 + 0.5 - 0.5*cos(0.1*(iGlobalTime-10.0));;
    vec3 ro = vec3(12.5*sin(an),0.45,12.5*cos(an));
    vec3 ta = vec3(0.0,0.6,0.0);

    // ray
    mat3 ca = setCamera( ro, ta, -0.05 );
    vec3 rd = normalize( ca * vec3(p,-4.5) );

    // ray differentials
    vec2 px = (-iResolution.xy+2.0*(fragCoord.xy+vec2(1.0,0.0)))/iResolution.y;
    vec2 py = (-iResolution.xy+2.0*(fragCoord.xy+vec2(0.0,1.0)))/iResolution.y;
    vec3 rdx = normalize( ca * vec3(px,-4.5) );
    vec3 rdy = normalize( ca * vec3(py,-4.5) );
    drddx = rdx - rd;
    drddy = rdy - rd;

    // render
    vec3 col = render( ro, rd, rdx, rdy);

    //float sun = clamp( 0.2 + 0.8*dot(rd,sunDir), 0.0, 1.0 );
    //col += vec3(0.4,0.3,0.2)*1.0*pow(sun,8.0);

    // grade
    col = col*0.6 + 0.4*col*col*(3.0-2.0*col);
        
    // vignete    
    vec2 q = fragCoord.xy/iResolution.xy;
    col *= 0.5 + 0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.1);

    fragColor = vec4( col, 1.0 );
}

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
// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


// Intersecting quadratic Bezier segments in 3D. Used Microsoft's paper as pointed out 
// by tayholliday in https://www.shadertoy.com/view/XsX3zf. Since 3D quadratic Bezier 
// segments are planar, the 2D version can be used to compute the distance to 3D curves.
	
//-----------------------------------------------------------------------------------
	
// undefine this for animation
//#define ANIMATE

// undefine to compare to linear segments
#define USELINEAR

#define METHOD 1

// method 0 : approximate http://research.microsoft.com/en-us/um/people/hoppe/ravg.pdf
// method 1 : exact       https://www.shadertoy.com/view/ltXSDB

//-----------------------------------------------------------------------------------

vec3  hash3( float n ) { return fract(sin(vec3(n,n+7.3,n+13.7))*1313.54531); }

vec3 noise3( in float x )
{
    float p = floor(x);
    float f = fract(x);
    f = f*f*(3.0-2.0*f);
    return mix( hash3(p+0.0), hash3(p+1.0), f );
}

//-----------------------------------------------------------------------------------
#if METHOD==0
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
#endif

#if METHOD==1
vec2 sdBezier(vec3 A, vec3 B, vec3 C, vec3 pos)
{    
    vec3 a = B - A;
    vec3 b = A - 2.0*B + C;
    vec3 c = a * 2.0;
    vec3 d = A - pos;

    float kk = 1.0 / dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      

    vec2 res;

    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
    float h = q*q + 4.0*p3;

    if(h >= 0.0) 
    { 
        h = sqrt(h);
        vec2 x = (vec2(h, -h) - q) / 2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = uv.x + uv.y - kx;
        t = clamp( t, 0.0, 1.0 );

        // 1 root
        vec3 qos = d + (c + b*t)*t;
        res = vec2( length(qos),t);
    }
    else
    {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
        t = clamp( t, 0.0, 1.0 );

        // 3 roots
        vec3 qos = d + (c + b*t.x)*t.x;
        float dis = dot(qos,qos);
        
        res = vec2(dis,t.x);

        qos = d + (c + b*t.y)*t.y;
        dis = dot(qos,qos);
        if( dis<res.x ) res = vec2(dis,t.y );

        qos = d + (c + b*t.z)*t.z;
        dis = dot(qos,qos);
        if( dis<res.x ) res = vec2(dis,t.z );

        res.x = sqrt( res.x );
    }
    
    return res;
}

#endif

vec2 sdSegment( vec3 a, vec3 b, vec3 p )
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float t = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return vec2( length( pa - ba*t ), t );
}

//-----------------------------------------------------------------------------------


vec2 map( vec3 p )
{
    float dm = 100.0;	

    vec3 a = vec3(0.0,-1.0,0.0);
    vec3 b = vec3(0.0, 0.0,0.0);
    vec3 c = vec3(0.0, 0.5,-0.5);
	float th = 0.0;
	float hm = 0.0;
	float id = 0.0;
    for( int i=0; i<8; i++ )
	{	
#ifndef USELINEAR
	    vec2 h = sdBezier( a, b, c, p );
#else
		vec2 h = sdSegment( a, c, p );
#endif			
		float kh = (th + h.y)/8.0;
		
		float ra = 0.3 - 0.28*kh + 0.3*exp(-15.0*kh);
		
	    float d = h.x - ra;
		
		//dm = min( dm, d );
		if( d<dm ) { dm=d; hm=kh; }
		
        vec3 na = c;
		vec3 nb = c + (c-b);
#ifndef ANIMATE
		vec3 dir = normalize(-1.0+2.0*hash3( id+13.0 ));
		vec3 nc = nb + 1.0*dir*sign(-dot(c-b,dir));
#else		
		vec3 nc = nb + 0.8*normalize(-1.0+2.0*noise3(id+0.5*iGlobalTime));
        nc.y = max( nc.y, -0.9 );
#endif		

		id += 3.71;
		a = na;
		b = nb;
		c = nc;
		th += 1.0;
	}

	return vec2( 0.5*dm, hm );
}

float map2( in vec3 pos )
{
    return min( pos.y+1.0, map(pos).x );
}


vec3 intersect( in vec3 ro, in vec3 rd )
{
    vec3 res = vec3( -1.0 );

    float maxd = 12.0;
    
    // plane
    float tp = (-1.0-ro.y)/rd.y;
    if( tp>0.0 )
    {
        vec3 pos = ro + rd*tp;
        res = vec3( tp, 0.025*length(pos.xz)*1.0 + 0.01*atan(pos.z,pos.x), 0.0 );
        maxd = tp;
    }

    // tentacle
	const float precis = 0.001;
    float t = 0.0;
	float l = 0.0;
    for( int i=0; i<80; i++ )
    {
	    vec2 h = map( ro+rd*t );
        if( h.x<precis || t>maxd ) break;
        t += h.x;
		l = h.y;
    }
    if( t<maxd ) res = vec3( t, l, 1.0 );

    return res;
}

vec3 calcNormal( in vec3 pos )
{
    vec3 eps = vec3(0.002,0.0,0.0);

	return normalize( vec3(
           map(pos+eps.xyy).x - map(pos-eps.xyy).x,
           map(pos+eps.yxy).x - map(pos-eps.yxy).x,
           map(pos+eps.yyx).x - map(pos-eps.yyx).x ) );
}

float softshadow( in vec3 ro, in vec3 rd, float mint, float k )
{
    float res = 1.0;
    float t = mint;
	float h = 1.0;
    for( int i=0; i<32; i++ )
    {
        h = map(ro + rd*t).x;
        res = min( res, k*h/t );
		t += clamp( h, 0.02, 2.0 );
        if( res<0.0001 ) break;
    }
    return clamp(res,0.0,1.0);
}

float calcAO( in vec3 pos, in vec3 nor )
{
    float ao = 0.0;
    for( int i=0; i<8; i++ )
    {
        float h = 0.02 + 0.5*float(i)/7.0;
        float d = map2( pos + h*nor );
        ao += -(d-h);
    }
    return clamp( 1.5 - ao*0.6, 0.0, 1.0 );
}


vec3 lig = normalize(vec3(-0.2,0.6,0.9));

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 q = fragCoord.xy / iResolution.xy;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= iResolution.x/iResolution.y;
    vec2 m = vec2(0.5);
	if( iMouse.z>0.0 ) m = iMouse.xy/iResolution.xy;


    //-----------------------------------------------------
    // animate
    //-----------------------------------------------------
	
	float ctime = iGlobalTime;

	
    //-----------------------------------------------------
    // camera
    //-----------------------------------------------------

	float an = 2.0 + 0.3*ctime - 12.0*(m.x-0.5);

	vec3 ro = vec3(7.0*sin(an),0.0,7.0*cos(an));
    vec3 ta = vec3(0.0,0.0,0.0);

    // camera matrix
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));

	// create view ray
	vec3 rd = normalize( p.x*uu + p.y*vv + 2.5*ww );

    //-----------------------------------------------------
	// render
    //-----------------------------------------------------

	vec3 col = clamp( vec3(0.95,0.95,1.0) - 0.75*rd.y, 0.0, 1.0 );
	float sun = pow( clamp( dot(rd,lig), 0.0, 1.0 ), 8.0 );
	col += 0.7*vec3(1.0,0.9,0.8)*pow(sun,4.0);
	vec3 bcol = col;
	
	// raymarch
    vec3 tmat = intersect(ro,rd);
    if( tmat.z>-0.5 )
    {
        // geometry
        vec3 pos = ro + tmat.x*rd;
        vec3 nor = calcNormal(pos);
        if( tmat.z<0.5 )
            nor = vec3(0.0,1.0,0.0);
		vec3 ref = reflect( rd, nor );

        // materials
		vec3 mate = vec3(0.5);
		mate *= smoothstep( -0.75, 0.75, cos( 200.0*tmat.y ) );
		
		float occ = calcAO( pos, nor );
		
		// lighting
        float sky = clamp(nor.y,0.0,1.0);
		float bou = clamp(-nor.y,0.0,1.0);
		float dif = max(dot(nor,lig),0.0);
        float bac = max(0.3 + 0.7*dot(nor,-lig),0.0);
		float sha = 0.0; if( dif>0.001 ) sha=softshadow( pos+0.01*nor, lig, 0.0005, 32.0 );
        float fre = pow( clamp( 1.0 + dot(nor,rd), 0.0, 1.0 ), 5.0 );
        float spe = max( 0.0, pow( clamp( dot(lig,reflect(rd,nor)), 0.0, 1.0), 8.0 ) );
		
		// lights
		vec3 brdf = vec3(0.0);
		brdf += 2.0*dif*vec3(1.20,1.0,0.60)*sha;
		brdf += 1.5*sky*vec3(0.10,0.15,0.35)*occ;
		brdf += 1.0*bou*vec3(0.30,0.30,0.30)*occ;
		brdf += 1.0*bac*vec3(0.30,0.25,0.20)*occ;
        brdf += 1.0*fre*vec3(1.00,1.00,1.00)*occ*dif;
		

		// surface-light interacion
		col = mate.xyz* brdf;
		col += (1.0-mate.xyz)*1.0*spe*vec3(1.0,0.95,0.9)*sha*2.0*(0.2+0.8*fre)*occ;

        // fog
		col = mix( col, bcol, smoothstep(10.0,20.0,tmat.x) );

        // col = vec3(occ);
    }

	col += 0.4*vec3(1.0,0.8,0.7)*sun;
	
    // gamma
	col = pow( clamp(col,0.0,1.0), vec3(0.45) );

	fragColor = vec4( col, 1.0 );
}

void main()
{
    mainImage( fragColor, fragCoord );
}

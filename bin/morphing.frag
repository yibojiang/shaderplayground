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
// Created by Sebastien Durand - 2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define U(a,b) (a.x*b.y-b.x*a.y)

vec2 P = vec2(1,.72), O = vec2(-1.16,.63);

vec2 A[15];
vec2 T1[5];
vec2 T2[5];

vec3 L = normalize(vec3(1,.72, 1)), Y = vec3(0,1,0), E = Y*.01;

float tMorph;
mat2 mat2Rot;

// Distance to Bezier
// inspired by [iq:https://www.shadertoy.com/view/ldj3Wh]
// calculate distance to 2D bezier curve on xy but without forgeting the z component of p
// total distance is corrected using pytagore just before return
vec2 B(vec2 m, vec2 n, vec2 o, vec3 p) {
	vec2 q = p.xy;
	m-= q; n-= q; o-= q;
	float x = U(m, o), y = 2. * U(n, m), z = 2. * U(o, n);
	vec2 i = o - m, j = o - n, k = n - m, 
		 s = 2. * (x * i + y * j + z * k), 
		 r = m + (y * z - x * x) * vec2(s.y, -s.x) / dot(s, s);
	float t = clamp((U(r, i) + 2. * U(k, r)) / (x + x + y + z), 0.,1.); // parametric position on curve
	r = m + t * (k + k + t * (j - k)); // distance on 2D xy space
	return vec2(sqrt(dot(r, r) + p.z * p.z), t); // distance on 3D space
}

            

float smin(float a, float b, float k){
    float h = clamp(.5+.5*(b-a)/k, 0., 1.);
    return mix(b,a,h)-k*h*(1.-h);
}

// Distance to scene
float M(vec3 p) {

// Distance to Teapot --------------------------------------------------- 
	// precalcul first part of teapot spout
	vec2 h = B(T1[2],T1[3],T1[4], p);
	float a = 99., 
    // distance to teapot handle (-.06 => make the thickness) 
		b = min(min(B(T2[0],T2[1],T2[2], p).x, B(T2[2],T2[3],T2[4], p).x) - .06, 
    // max p.y-.9 => cut the end of the spout 
                max(p.y - .9,
    // distance to second part of teapot spout (abs(dist,r1)-dr) => enable to make the spout hole 
                    min(abs(B(T1[0],T1[1],T1[2], p).x - .07) - .01, 
    // distance to first part of teapot spout (tickness incrase with pos on curve) 
                        h.x * (1. - .75 * h.y) - .08)));
	
    // distance to teapot body => use rotation symetry to simplify calculation to a distance to 2D bezier curve
    vec3 qq= vec3(sqrt(dot(p,p)-p.y*p.y), p.y, 0);
    // the substraction of .015 enable to generate a small thickness arround bezier to help convergance
    // the .8 factor help convergance  
	for(int i=0;i<13;i+=2) 
		a = min(a, (B(A[i], A[i + 1], A[i + 2], qq).x - .015) * .7); 
    // smooth minimum to improve quality at junction of handle and spout to the body
	float dTeapot = smin(a,b,.02);

// Distance to other shapes ---------------------------------------------
	float dShape;
	int idMorph = int(mod(floor(.5+(iGlobalTime)/(2.*3.141592658)),3.));
	
	if (idMorph == 1) {
		p.xz *= mat2Rot;
   	 	vec3 d = abs(p-vec3(.0,.5,0)) - vec3(.8,.7,.8);
   		dShape = min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
	} else if (idMorph == 2) { 
		p -= vec3(0,.55,0);
		vec3 d1 = abs(p) - vec3(.67,.67,.67*1.618);
		vec3 d3 = abs(p) - vec3(.67*1.618,.67,.67);
   		dShape = min(max(d1.x,max(d1.y,d1.z)),0.) + length(max(d1,0.));
   		dShape = min(dShape,min(max(d3.x,max(d3.y,d3.z)),0.) + length(max(d3,0.)));
	} else {
		dShape = length(p-vec3(0,.45,0))-1.1;
	}
	
	// !!! The morphing is here !!!
    return mix(dTeapot, dShape, abs(tMorph));
}

// HSV to RGB conversion 
// [iq: https://www.shadertoy.com/view/MsS3Wc]
vec3 hsv2rgb_smooth(float x, float y, float z) {
    vec3 rgb = clamp( abs(mod(x*6.+vec3(0.,4.,2.),6.)-3.)-1., 0., 1.);
	rgb = rgb*rgb*(3.-2.*rgb); // cubic smoothing	
	return z * mix( vec3(1), rgb, y);
}

vec3 normal(in vec3 p, in vec3 ray, in float t) {
	float pitch = .4 * t / iResolution.x;
	
    vec2 d = vec2(-1,1) * pitch;
    
	vec3 p0 = p+d.xxx; // tetrahedral offsets
	vec3 p1 = p+d.xyy;
	vec3 p2 = p+d.yxy;
	vec3 p3 = p+d.yyx;
	
	float f0 = M(p0);
	float f1 = M(p1);
	float f2 = M(p2);
	float f3 = M(p3);
	
	vec3 grad = p0*f0+p1*f1+p2*f2+p3*f3 - p*(f0+f1+f2+f3);
	//return normalize(grad);	// prevent normals pointing away from camera (caused by precision errors)
	return normalize(grad - max(.0,dot (grad,ray ))*ray);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	float aa=3.14159/4.;
	mat2Rot = mat2(cos(aa),sin(aa),-sin(aa),cos(aa));
	
	// Morphing step
	tMorph = cos(iGlobalTime*.5);
	tMorph*=tMorph*tMorph*tMorph*tMorph;
	
	// Teapot body profil (8 quadratic curves) 
	A[0]=vec2(0,0);A[1]=vec2(.64,0);A[2]=vec2(.64,.03);A[3]=vec2(.8,.12);A[4]=vec2(.8,.3);A[5]=vec2(.8,.48);A[6]=vec2(.64,.9);A[7]=vec2(.6,.93);
    A[8]=vec2(.56,.9);A[9]=vec2(.56,.96);A[10]=vec2(.12,1.02);A[11]=vec2(0,1.05);A[12]=vec2(.16,1.14);A[13]=vec2(.2,1.2);A[14]=vec2(0,1.2);
	// Teapot spout (2 quadratic curves)
	T1[0]=vec2(1.16, .96);T1[1]=vec2(1.04, .9);T1[2]=vec2(1,.72);T1[3]=vec2(.92, .48);T1[4]=vec2(.72, .42);
	// Teapot handle (2 quadratic curves)
	T2[0]=vec2(-.6, .78);T2[1]=vec2(-1.16, .84);T2[2]=vec2(-1.16,.63);T2[3]=vec2(-1.2, .42);;T2[4]=vec2(-.72, .24);

	// Configure camera
	vec2 r = iResolution.xy, m = iMouse.xy / r,
	     q = fragCoord.xy/r.xy, p =q+q-1.;
	p.x *= r.x/r.y;
	float j=.0, s=1., h = .1, t=5.+.2*iGlobalTime + 4.*m.x;
	vec3 o = 2.9*vec3(cos(t), .7- m.y,sin(t)),
	     w = normalize(Y * .4 - o), u = normalize(cross(w, Y)), v = cross(u, w),
         d = normalize(p.x * u + p.y * v + w+w), n, x;
			
	// Ray marching
	t=0.;
    for(int i=0;i<48;i++) { 
		if (h<.0001 || t>4.7) break;
        t += h = M(o + d*t);
    }
    
	// Background colour change as teapot complementaries colours (using HSV)
	vec3 c = mix(hsv2rgb_smooth( .5+iGlobalTime*.02,.35,.4), 
			 	 hsv2rgb_smooth(-.5+iGlobalTime*.02,.35,.7), q.y);
		
    // Calculate color on point
	if (h < .001) {
		x = o + t * d;
		n = normal(x,d,t);//normalize(vec3(M(x+E.yxx)-M(x-E.yxx),M(x+E)-M(x-E),M(x+E.xxy)-M(x-E.xxy)));
		// Calculate Shadows
		for(int i=0;i<20;i++){
			j += .02;
			s = min(s, M(x+L*j)/j);
		}
		// Teapot color rotation in HSV color space
		vec3 c1 = hsv2rgb_smooth(.9+iGlobalTime*.02, 1.,1.); 
		// Shading
	    c = mix(c,mix(sqrt((clamp(3.*s,0.,1.)+.3)*c1),
			          vec3(pow(max(dot(reflect(L,n),d),0.),99.)),.4),2.*dot(n,-d));
	} 

	c *= pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y), .16); // Vigneting
	fragColor=vec4(c,1);	
	
}

void main()
{
    mainImage( fragColor, fragCoord );
}
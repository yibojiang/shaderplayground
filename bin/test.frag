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

#define precis 0.001

float sphere(vec3 p, float r){
	return length(p)-r;
}

float plane(vec3 p){
	return p.y;
}

float scene(vec3 p){
	float plane = plane(p-vec3(0,-1,0));
	float s = sphere(p-vec3(0,0.1+0.3*abs(sin(iGlobalTime)),0), 0.1);
	return min(plane, s);
	// return plane;
	// return s;
}

float castShadow(vec3 ro, vec3 rd){
	float tmin = 0.02;
	float tmax = 100.0;
	float t = tmin;
	
	float res = 1.0;
	for (int i=0; i<16; i++){
		float dist = scene(ro + t*rd);
		// res = min(dist, 8.0*h/t)
		res = min(res, 8*dist/t);
		if (dist > tmax || dist < precis){
			break;
		}


		t += dist;
	}
	
	return clamp( res, 0.0, 1.0 );
	// return res;
}

float raymarch(vec3 ro, vec3 rd){
	float tmin = 0.0;
	float tmax = 1000.0;
	float t = tmin;
	

	for (int i=0; i<100; i++){
		float dist = scene(ro + t*rd);

		if (dist > tmax){
			// miss
			t = -1;
			break;
		}

		if (dist < precis){
			break;
		}

		t += dist;
	}
	return t;
}

mat3 setCamera(vec3 ro, vec3  ta, float cr){
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize(cross(cw,cp));
	vec3 cv = normalize(cross(cu,cw));
	return mat3(cu,cv,cw);
}

vec3 getNormal(vec3 p){
	vec3 n = vec3(0.0);
	vec2 e = vec2(0.01, 0.0);
	n = vec3(scene(p+e.xyy)-scene(p-e.xyy),
		scene(p+e.yxy)-scene(p-e.yxy),
		scene(p+e.yyx)-scene(p-e.yyx));
	return normalize(n);
}

float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
	float sca = 1.0;
	for( int i=0; i<5; i++ )
	{
	    float hr = 0.01 + 0.12*float(i)/4.0;
	    vec3 aopos =  nor * hr + pos;
	    float dd = scebe(aopos);
	    occ += -(dd-hr)*sca;
	    sca *= 0.95;
	}
	return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv *= normalize(iResolution).xy;

    float time = iGlobalTime;
    vec2 mo = iMouse.xy/iResolution.xy;
    vec3 ro = vec3( 1.5*cos(0.1*time + 6.0*mo.x), 1.0 + 2.0*mo.y, 1.5*sin(0.1*time + 6.0*mo.x) );
    vec3 ta = vec3( 0.0, 0.2, 0.0);
    mat3 ca = setCamera( ro, ta, 0.0 );
  	vec3 rd = ca * normalize( vec3(uv.xy,2.0) );

    float res = raymarch(ro, rd);
    vec3 pos = ro + rd*res;
    vec3 nor = getNormal(pos);
    vec3 color = vec3(0.0);
    color = mix(vec3(0.0, 0.1, 0.5), vec3(0.0), uv.y);
  	vec3  lig = normalize( vec3(-0.6, 0.7, -0.5) );
  	float sh = castShadow(pos, lig);

  	float sun= max(0.0, dot(rd, lig));
    if (res > 0.0){
    	// color = vec3(1.0);
    	// color = nor;
    	vec3 dif = dot(lig, nor) * vec3(1.0) * sh;
    	


    	color = dif;

    	
    }
    else{
    	// sun flare
    	color += pow(sun,1.0)*vec3(0.2);
    	color += pow(sun,5.0)*vec3(1.0);	
    }
    
    

    // float sun = sundir + pow(sundir, 2.0);

    
    fragColor = vec4(color, 1.0);
}

void main()
{
    mainImage( fragColor, fragCoord );
}
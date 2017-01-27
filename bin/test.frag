

#define precis 0.001
#define pi 3.1415926
float sphere(vec3 p, float r){
	return length(p)-r;
}

float plane(vec3 p){
	return p.y;
}

float scene(vec3 p){
	float plane = plane(p-vec3(0,-1,0));
	// float s = sphere(p-vec3(0,0.1+0.3*abs(sin(iGlobalTime)),0), 0.1);
    vec3 spos = vec3(0,0.0,0);
    float s = sphere(p-spos, 0.1);
    float s2 = sphere(p-spos, 0.085);


 //    s = max(s, -s2);
 //    s = max(s, p.y-0.1);
    
	// return min(plane, s);
	// return plane;
	return s;
}

float softshadow(vec3 ro, vec3 rd){
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
}

// float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
// {
//   float res = 1.0;
//   float t = mint;
//   for ( int i = 0; i < 16; i++ )
//   {
//     float h = scene( ro + rd * t );
//     res = min( res, 8.0 * h / t );
//     t += clamp( h, 0.02, 0.10 );
//     if ( h < 0.001 || t > tmax ) break;
//   }
//   return clamp( res, 0.0, 1.0 );

// }

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
    // vec3 cu = normalize(cross(cp,cw));
    // vec3 cv = normalize(cross(cw,cu));
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
	    float dd = scene(aopos);
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
    // vec3 ro = vec3( 1.0*cos(0.1*time + 6.0*mo.x), 1.0 + 2.0*mo.y, 1.0*sin(0.1*time + 6.0*mo.x) );
    vec3 ro = vec3( 0.0, 0.0, -2.0 );
    vec3 ta = vec3( 0.0, 0.0, 0.0);
    mat3 ca = setCamera( ro, ta, 0.0 );
    float fov = pi/4; // hotirzontal fov 60
    float near = 2.0/tan(fov/2);
  	vec3 rd = ca * normalize( vec3(uv.xy,near) );

    float res = raymarch(ro, rd);
    vec3 pos = ro + rd*res;
    vec3 nor = getNormal(pos);
    vec3 color = vec3(0.0);
    color = mix(vec3(0.0, 0.1, 0.5), vec3(0.0), uv.y);
  	vec3  lig = normalize( vec3(-0.6, 0.7, -0.5) );
  	// float sh = softshadow(pos, lig, 0.02, 2.5);
    float sh = softshadow(pos, lig);

    // float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );
    float amb = 0.1;
    
    
    

    vec3 env = textureCube( skybox2, rd ).rgb;
    color = env;
  	float sun= max(0.0, dot(rd, lig));
    if (res > 0.0){

        float occ = calcAO( pos, nor );
    	// color = vec3(1.0);
    	// color = nor;
        vec3 ref = reflect(rd, nor);
    	float dif = max(0.0, dot(lig, nor))*sh;
        float fre = pow(clamp(1.0 + dot(nor, rd), 0.0, 1.0), 2.0 );
        float spe = pow(max(0.0, dot(ref, lig)), 32.0 );


    	color = 0.0 * dif * vec3(1.0);
        color+= 1.0 * spe * vec3(1.0);
        color+= 0.4 * textureCube( skybox2, reflect( rd, nor)).rgb;
        color += 0.4 * fre * vec3(1.00, 1.00, 1.00) * occ;
        color+= vec3(1.0,0.9,0.8) * amb * occ;
        // color = nor;
        // color = pow(color, vec3(0.45));
        // color = vec3(1.0)*fre;
        color = vec3(1.0) * dif;
    	
    }
    else{
    	// sun flare
    	// color += pow(sun,1.0)*vec3(0.2);
    	// color += pow(sun,5.0)*vec3(1.0);	
    }
    


    // float sun = sundir + pow(sundir, 2.0);

    
    fragColor = vec4(color, 1.0);
}


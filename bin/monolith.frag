
#define PRECI 0.001
#define tmax 300.0
#define tmin 0.0
const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );

vec2 hash( vec2 p ) {
    p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
    vec2 i = floor(p + (p.x+p.y)*K1);   
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
    vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot(n, vec3(70.0));  
}

float fbm(vec2 n) {
    float total = 0.0, amplitude = 0.1;
    for (int i = 0; i < 7; i++) {
        total += noise(n) * amplitude;
        n = m * n;
        amplitude *= 0.4;
    }
    return total;
}

float map(vec3 p){
    return 
}

float raymarch(vec3 ro, vec3 rd){
    float t = tmin;
    for (int i = 0; i < 512; ++i){
    	float dist = map(ro + rd*t);
    	
    	if (dist <= PRECI){
    		break;
    	}
		
    	if (t>tmax){
    		break;
    	}
        
        t = t + dist;
    }
    
    return t;
}

vec3 getNormal(vec3 p){
    vec2 e = vec2(PRECI, 0.0);
    vec3 n = vec3(map(p+e.xyy) - map(p-e.xyy),
                 map(p+e.yxy) - map(p-e.yxy),
                 map(p+e.yyx) - map(p-e.yyx));
    return normalize(n);
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}



const vec3 sundir = normalize(vec3(0.0, 10.0, 2.9));


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
 	
	vec2 uv = (-iResolution.xy + 2.0*fragCoord.xy)/ iResolution.y;
	vec3 ro = vec3(0.0, 0.1, 0.0);
	//vec3 rd = vec3(uv.xy, 1.0) - ro;
    vec3 ta = vec3(0.0, 10.0, 1.0);
    //ta = vec3(0.0, 0.5, 1.0);
    mat3 ca = setCamera( ro, ta, 0.0 );
    
    // ray direction
	vec3 rd = ca * normalize( vec3(uv.xy, 2.0) );
    rd = normalize(rd);
    
    
    float sun = clamp( dot(sundir,rd), 0.0, 1.0 );
	
    
	float result = raymarch(ro, rd);
    
    float grad = smoothstep(0.0, 1.0, -uv.y );
	vec3 color = mix(vec3(84.0, 69, 56.0)/255.0, vec3(134.0, 106.0, 65.0)/255.0, grad);
    //vec3 color = mix(vec3(1.0), vec3(0.0), -uv.y);

    
    vec3 lig = vec3(1.0, -2.0, 1.0);
    lig = normalize(lig);
    vec3 hit = ro + result*rd;
    vec3 n = getNormal(hit);
	if (result > tmax){

		// shade moon
    	float moon = smoothstep(0.0, 0.01, 0.18 - length(uv- vec2(0.0,0.4)));
        vec2 moonpos = uv - vec2(0.0,0.43);
        float r = noise11(atan(moonpos.x, moonpos.y)*7.0 + 2.0) * 0.008;
        float moonshade = smoothstep(0.0, 0.01, 0.18 + r - length(moonpos));
        moon = moon - min(moon,moonshade);    
        color = mix(color, mix(vec3(0.0),vec3(1.0), 2.5*length(moonpos) ), moon );
        // sun
        color += 2.0*vec3(1.0,0.6,0.6)*pow( sun, 256.0 );	

        // shade sky
        
	
	}
    else{
        color = vec3(0.0);
    }
    
    
    color += 0.3*vec3(1.0,0.4,0.2)*pow( sun, 128.0 );
   	
    
	fragColor = vec4(color.xyz, 1.0);
}



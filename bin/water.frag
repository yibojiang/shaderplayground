

#version 330 core
in vec3 vertexColor;
in vec3 vertexPosition;
in vec2 fragCoord;

uniform sampler2D iChannel0;
uniform float iGlobalTime;
uniform vec2 iResolution;
uniform vec4 iDate;
uniform vec4 iMouse;
out vec4 fragColor;



// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 uv = fragCoord.xy;
//     fragColor = vec4(uv,0.5+0.5*sin(iGlobalTime),1.0);
// }

// #define rmouse (iMouse*iResolution)
float d = 1.0/length(vec2(1.0));

vec2 position(vec2 v) {
  return vec2(v.x, v.y);
}

void main() {
	vec2 mmouse = iMouse.xy/ iResolution.;
	vec2 pos = position(fragCoord.xy);
	vec2 dx  = position(vec2(1.0,0.0));
	vec2 dy  = position(vec2(0.0,1.0));
	
	float dist = length(iMouse.xy-fragCoord.xy);
	float i = 1.0 - smoothstep(0.0 ,15.0, dist);
	
	vec4 me = texture(iChannel0,fragCoord);
	float a = texture(iChannel0,pos+dx).r+texture(iChannel0,pos+dx+dy).r*d
	+ texture(iChannel0,pos-dx).r+texture(iChannel0,pos-dx+dy).r*d
	+ texture(iChannel0,pos+dy).r+texture(iChannel0,pos+dx-dy).r*d
	+ texture(iChannel0,pos-dy).r+texture(iChannel0,pos-dx-dy).r*d;
	a *= 0.146;
	
	me.g+=a-me.r;
	me.g*=0.999;
	me.g -=0.0009;
	me.r+=me.g-log(1.+(a*a)*0.0009);
	me.b =log(3.*(me.r+me.g)+1.);


	fragColor = vec4(vec3(me)+vec3(i,0,0),1.);
	// fragColor = vec4(1.0);
}



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

const int MAX_RAY_STEPS = 24;
const float RAY_STOP_TRESHOLD = 0.0001;
const int MENGER_ITERATIONS = 5;
const float PI = 3.14159265359;

float maxcomp(vec2 v) { return max(v.x, v.y); }

vec2 rot2D(vec2 v, float angle) {
	float sinA = sin(angle);
	float cosA = cos(angle);
	return vec2(v.x * cosA - v.y * sinA, v.y * cosA + v.x * sinA);
}

float sdCross(vec3 p, float w) {
	p = abs(p);
	vec3 d = vec3(max(p.x, p.y),
				  max(p.y, p.z),
				  max(p.z, p.x));
	return min(d.x, min(d.y, d.z)) - w;
}

float sdCrossRep(vec3 p, float w) {
	vec3 q = mod(p + 1.0, 2.0) - 1.0;
	return sdCross(q, w);
}

float sdCrossRepScale(vec3 p, float s, float w) {
	return sdCrossRep(p * s, w) / s;	
}

float scene(vec3 p, float t) {
	float scale = 1.0;
	float dist = 0.0;
	for (int i = 0; i < MENGER_ITERATIONS; i++) {
		dist = max(dist, -sdCrossRepScale(p, scale, 1.0 / 3.0));
		scale *= 3.0;
	}
	dist = max(dist, -sdCrossRepScale(p, scale, pow(t, 0.2) / 3.0));
	return dist;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(float c) {
	float hue = mix(0.6, 1.15, min(c * 1.2 - 0.05, 1.0));
	float sat = 1.0 - pow(c, 4.0);
	float lum = c;
	vec3 hsv = vec3(hue, sat, lum);
	vec3 rgb = hsv2rgb(hsv);
	return vec4(rgb, 1.0);	
}

vec3 cameraPath(float t) {
	t *= PI / 2.0;
	return 2.0 / 3.0 * vec3(0.0, 1.0 - cos(t), sin(t));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 screenPos = fragCoord.xy / iResolution.xy * 2.0 - 1.0;
	vec2 mousePos = iMouse.xy / iResolution.xy * 2.0 - 1.0;
	float s = mod(iGlobalTime * 0.25, 1.0);
	float t = 0.5 * (3.0 * s - s * s);

	vec3 cameraPos1 = vec3(0.0, 0.0, 0.0);
	vec3 cameraPos2 = vec3(0.0, 2.0 / 3.0, 2.0 / 3.0);
	
	float mixAmount = sin(iGlobalTime) * 0.5 + 0.5;
	

	vec3 cameraPos = cameraPath(t);
	//cameraPos = vec3(0.0);
	
	vec3 cameraDir = vec3(0.0, 0.0, 1.0);
	vec3 cameraPlaneU = vec3(1.0, 0.0, 0.0);
	vec3 cameraPlaneV = vec3(0.0, 1.0, 0.0) * (iResolution.y / iResolution.x);

	vec3 rayPos = cameraPos;
	vec3 rayDir = cameraDir + screenPos.x * cameraPlaneU + screenPos.y * cameraPlaneV;
	rayDir.yz = rot2D(rayDir.yz, (-PI / 2.0) * s - PI / 12.0);
	
	rayDir = normalize(rayDir);
	
	float rayStopTreshold = RAY_STOP_TRESHOLD * pow(3.0, -t);
	rayStopTreshold = mix(RAY_STOP_TRESHOLD, RAY_STOP_TRESHOLD / 3.0, t);
	
	float dist = scene(rayPos, t);
	int stepsTaken;
	for (int i = 0; i < MAX_RAY_STEPS; i++) {
		if (dist < rayStopTreshold) {
			continue;
		}
		rayPos += rayDir * dist * 0.9;
		dist = scene(rayPos, t);
		stepsTaken = i;
	}
	
	float fractSteps = 0.0;
	
	vec4 color = colorize(pow((float(stepsTaken) + fractSteps) / float(MAX_RAY_STEPS), 0.9));
		
	fragColor = color;
}

void main()
{
    mainImage(fragColor, fragCoord);
}
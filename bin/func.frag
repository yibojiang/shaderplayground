
float e = 2.0 / iResolution.y;

float pingPong(float x){
	float n = ceil(x);
    x = mod(x, 2.0);
    float d = floor(x);
    return mix(x ,2.0 - x, mod(d,2.0));
}

#define pi 3.1415926

float func(vec2 p){
    vec2 uv = (p * iResolution.y/iResolution.x + 1.0) * 0.5;
    float wave = texture( iChannel0, vec2(uv.x, 0.75) ).x;
	float fft = texture( iChannel0, vec2(uv.x, 0.25) ).x;
    float wave2 = texture( iChannel0, vec2( pingPong(iGlobalTime + atan(p.x, p.y) / (1.0 * pi) ), 0.75) ).x;

    float fft2 = texture( iChannel0, vec2( pingPong( atan(p.x, p.y) / (1.0 * pi) ), 0.25) ).x;
    
    float func_line = p.y - 0.5*wave;
    
    float func_sin = (p.y - 0.3 * 2.0 * wave * sin(p.x*3.0 + iGlobalTime) ) ;
    float func_leave = length(p) - (0.6 + 0.4 * fft2 *sin(3.0*atan(p.x, p.y) + 2.0*iGlobalTime ) );
    float func_exp = p.y - exp(p.x) - 0.5*wave;
    float func_log = p.y - log(max(e, p.x)) - 0.5*wave;
    float func_circle = length(p) -  wave2;
    // float func_circle = length(p - vec2(0.2+sin(0.0*2.0)*0.5, 0.0)) -  0.5;
    float func_circle1 = length(p- vec2(-0.2, 0.0)) -  0.4;
    // float func_circle_fft = length(p) -  fft2;
    
    //float func_pingPong = p.y - pingPong(p.x);
    
    
    vec2 hearto = p - vec2(0.0, 0.3); 
    float v = atan(hearto.y, hearto.x);
    float heart = 0.1*(2.-2.*sin(v)+sin(v)*sqrt( abs(cos(v) ) )/(sin(v)+1.4) );
	float func_heart = length(hearto) - 2.0 * (0.9 +  0.5 * fft2 + 0.0*abs(sin(10.0*iGlobalTime))) * heart;   
    
    float op_add = func_line + func_sin;
    float op_min = min(func_line, func_sin);
    float op_max = max(func_line, func_sin);
    float op_mut = func_line * func_sin * func_leave * func_exp * func_log * func_circle;
    
    float lerp = iMouse.x * 0.001;
    lerp = clamp( lerp, 0.0, 1.0 );
    
    
    //float func_0 = func_circle;
    float func_1 = func_heart;
    float func_2 = func_leave;
    int tf = int(floor(iGlobalTime));
    float tt = mod(iGlobalTime, 1.0);
    tt = smoothstep(0.0,1.0,pingPong(iGlobalTime));

    float amp = 0.3* max((1-log(p.x*2.)),0 );
    float freq = 25.0* max((p.x),0 );
    float func_t = p.y - (amp  * abs(sin(p.x*freq)));
    // return func_t;
    //return func_1*tt + func_2*(1.0 - tt);
    return func_circle;
    return func_heart;
    // return func_circle * lerp + func_circle1 * (1.0 - lerp);
    // return max(func_circle , func_circle1 );
    
    // return (func_heart * lerp + func_circle * (1.0 - lerp));

    //return op_add;
    //return op_min;
    //return op_max;


    return op_mut;
}

vec2 gradient(vec2 p){
    vec2 h = vec2(e, 0.0);
	return vec2(func(p.xy+h.xy) - func(p.xy-h.xy), 
               func(p.xy+h.yx) - func(p.xy-h.yx))/(2.0*e);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (2.0 * fragCoord.xy - iResolution.xy ) / iResolution.y ;
    
    vec3 col = vec3(0.0);
    float map = smoothstep(e, 2.0*e, abs(func(uv))/min(50.0, length(gradient(uv))) );
    col = mix(vec3(1.0), col, map);
	fragColor = vec4(col, 1.0);
}




vec4 backColor = vec4(227./256.,206./256.,178./256.,0.);

float circle(vec2 pos, vec2 center, float radius){
    //float d = length(pos - center) - radius;
    float d = ((pos.x - center.x) * (pos.x - center.x) +
              (pos.y - center.y) * (pos.y - center.y) -
               radius * radius)/(radius * radius);
    
    return d;
}

//æ¤­åœ†éšå‡½æ•°
float ellipse(vec2 center, float a, float b, vec2 coord){
    float a2 = a * a;
    float b2 = b * b;
    return (b2 * (coord.x - center.x) * (coord.x - center.x) +
            a2 * (coord.y - center.y) * (coord.y - center.y) -
            a2 * b2)/(a2 * b2);
}

//æ­£æ–¹å½¢
float rect(vec2 pos, vec2 center, float len){
    vec2 dis = abs(pos - center);
    float d = (max(dis.x,dis.y)-len)/len;
    return d; 
}


//ä¸‰è§’å½¢
float cross2d(vec2 A, vec2 B,vec2 P){
    return (B.x - A.x)*(P.y - A.y) - (B.y - A.y)*(P.x - A.x);
}

float triangle(vec2 A,vec2 B, vec2 C, vec2 pot){
    float d = 1.0;
    float scale = 1.;
    float d1 = scale*cross2d(A, B ,pot);
    d = min(d1,d);
    float d2 = scale*cross2d(B, C ,pot);
    d = min(d2,d);
    float d3 = scale*cross2d(C, A ,pot);
    d = min(d3,d);
    
    d = (-1.)*d;
    
    return d;
}
//union
float sdunion(float a, float b){
    return min(a, b);
}

//intersection
float sdintersection(float a, float b){
    return max(a, b);
}

//difference
float sddifference(float a, float b){
    return max(a, (-1.)*b);
}

//åšæ—‹è½¬
vec2 rotation(vec2 vec,float angle){
    mat2 rot_matrix;
    rot_matrix[0] = vec2(cos(angle),sin(angle));
    rot_matrix[1] = vec2(-sin(angle),cos(angle));
    return vec*rot_matrix;
}

vec2 transform(vec2 vec, vec2 offset){
    vec = vec - offset;
    return vec;
}


vec4 tail(vec2 originalPos,vec2 offset, float angle, vec2 scale)
{
    vec2 vec = originalPos;

    vec = transform(vec,offset);
    vec = rotation(vec,angle);
    vec = vec/scale;
    vec2 ct = vec2(0.,0.1);

    float d1 = 2.*circle(vec,ct,.2);
    
    vec2 ep = vec2(0.,0.);
   // ep = transform(ep,offset);
    float d2 = smoothstep(-1.2,1.6,ellipse(ep,.18,.1,vec));
    
    float d = smoothstep(0.,1.,sdintersection(d1,d2));
    //d =d2;
    vec4 bcol = vec4(.6,.1,.2,d);
    return bcol;
}


vec4 eye(vec2 originalPos,vec2 offset, float angle, vec2 scale){
    vec2 vec = originalPos;
    vec = transform(vec,offset);
    vec = rotation(vec,angle);
    vec = vec/scale;
    
    vec2 ep1 = vec2(0.,.06);
    float d1 = ellipse(ep1,.14,.1,vec);
    
    vec2 ep2 = vec2(0.04,-.04);
    float d2 = ellipse(ep2,.14,.1,vec);
    
    vec2 rc = vec2(0.,-.0006);
    vec.x = vec.x*.1;
    vec.y = vec.y*.3;
    float d3 = rect(vec,rc,0.02);
    
    float d = smoothstep(0.,1.,sdintersection(sdintersection(d1,d2),d3));
    
    
    vec4 bcol = vec4(.9,.4,.2,d);
    return bcol;
}

vec4 nose(vec2 A, vec2 B, vec2 C,vec2 originalPos,vec2 offset, float rot, vec2 scale){
    vec2 vec = originalPos;
    vec = transform(vec, offset);
    vec = rotation(vec, rot);
    vec = vec/scale;
    float d = triangle(A,B,C,vec);
    
    d = smoothstep(-1.,1.,120.*d);
    //vec4 bcol = vec4(.9,.1,.2,d);
    vec4 bcol = vec4(.6,.4,.4,d);
    //vec4 bcol = vec4(.8,.7,.2,d);
    return bcol;
}

vec4 quad(vec2 A, vec2 B, vec2 C, vec2 originalPos, vec2 offset, float rot, vec2 scale, vec3 col){   
    vec2 vec = originalPos;
    vec = transform(vec, offset);
    vec = rotation(vec, rot);
    vec = vec/scale;
    float d = triangle(A,B,C,vec);
    
    d = smoothstep(-1.,1.,100.*d);
    vec4 bcol = vec4(col,d);
    return bcol;
}

vec4 lips(vec2 originalPos){
    vec2 vec = originalPos;
    vec2 scale = vec2(1.5,1.3);
    vec = vec/scale;
    vec = transform(vec,vec2(0.,-.15));
    float pi = 3.1415926;
    vec = rotation(vec, pi/12.);
    
    float d1 = rect(vec,vec2(0.,0.),0.1);
    float d2 = ellipse(vec2(0.03,-.08),.04,.03,vec);
    float d3 = ellipse(vec2(-.03,-.08),.04,.03,vec);
    
    float d = sdintersection(d1,d2);
    d3 = sdintersection(d1,d3);
    d = sdunion(d,d3);
    d = smoothstep(-1.,1.,4.*d);
    vec4 bcol = vec4(0.7,0.4,0.2,d);
    return bcol;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 originalPos = (2.0 * fragCoord - iResolution.xy)/iResolution.yy;
    float pi = 3.1415926;
    
    //èƒŒæ™¯
    vec3 col = backColor.rgb* (1. - .2*length(originalPos));
    //tail1
    float off = 0.1;
    float off_y = .1;
    vec4 bcol = tail(originalPos,vec2(.6+off,.2+off_y),pi/6.,vec2(3.0,.6));
    col = mix(bcol.rgb,col,bcol.a);
    //tail2
    bcol = tail(originalPos,vec2(.65+off,.05+off_y),pi/12.,vec2(3.2,.6));
    col = mix(bcol.rgb,col,bcol.a);
    //tail3
    bcol = tail(originalPos,vec2(.66+off,-.125+off_y),0.,vec2(3.1,.5));
    col = mix(bcol.rgb,col,bcol.a);
    
    //eye
    bcol = eye(originalPos,vec2(-.2,.2),pi/12.,vec2(.9,.95));
    col = mix(bcol.rgb,col,bcol.a);
    
    //nose
    bcol = nose(vec2(-.06,.0),vec2(.1,-.06),vec2(.06,.26),originalPos,
                vec2(-.42,-.2),pi*.05,vec2(1.,1.));
    col = mix(bcol.rgb,col,bcol.a);
    //lips
    bcol = lips(originalPos);
    col = mix(bcol.rgb,col,bcol.a);
    //hair
    off = .08;
    off_y = -.07;
    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(-.4+off,0.6+off_y),pi/6.,vec2(1.,1.),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);
    
    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(-.1+off,0.67+off_y),.0,vec2(1.,1.),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);
    
    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(0.16+off,0.61+off_y),pi/(-6.),vec2(1.,1.),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);
    
    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(0.20+off,0.61+off_y),pi/(-3.),vec2(.5,.5),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);

    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(0.04+off,0.65+off_y),pi/(-12.),vec2(.8,.5),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);
    
    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(-.24+off,0.65+off_y),pi/(12.),vec2(.8,.7),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);
    
    bcol = quad(vec2(-.15,-.1),vec2(.14,-.1),vec2(0.,.45),originalPos,
                vec2(-.55+off,0.4+off_y),pi/(3.),vec2(.8,.5),vec3(.8,.6,.2));
    col = mix(bcol.rgb,col,bcol.a);
    
    //è¡£é¢†
    bcol = quad(vec2(-.15,0),vec2(.27,-.0),vec2(0.,.5),originalPos,
                vec2(0.26,-.6),pi/-2.4,vec2(1.8,1.6),vec3(.9,.4,.3));
    col = mix(bcol.rgb,col,bcol.a);
    fragColor = vec4(col,1.0);
}


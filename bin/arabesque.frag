

#define REALLY_SMALL_NUMBER 0.0001
#define BIG_NUMBER 1000000.
#define PI 3.14159
#define TWO_PI 6.28318

float g_time = 0.;
    
// Reference: http://geomalgorithms.com/a05-_intersect-1.html. Does an
// intersection test against a plane that is assumed to be double sided and
// passes through the plane_origin and has the specified normal.

// Returns a vec2 where:
//   result.x = 1. or 0. if there is a hit
//   result.y = t such that ray_origin + t*ray_direction = intersection point
vec2 intersect_plane(vec3 ray_origin,
                     vec3 ray_direction,
                     vec3 plane_origin,                     
                     vec3 plane_normal)
{
    float ray_direction_dot_normal = dot(ray_direction, plane_normal);

    float denominator = ray_direction_dot_normal;
    
    float intersected = 0.;
    float t = BIG_NUMBER;
    if (abs(denominator) > REALLY_SMALL_NUMBER) {
        t = -dot(plane_normal, (ray_origin - plane_origin)) / denominator;    
        if (t > REALLY_SMALL_NUMBER) {
            intersected = 1.;
        }
    }
    return vec2(intersected, t);

}

float grayscale(vec3 c)
{
    return dot(c, vec3(.21, .72, .07));
}

void mirror_test(vec3 o, vec3 r, vec3 po, vec3 pn,
                 inout vec3 rn,
                 inout float t)
{
    
    vec2 hr = intersect_plane(o, r, po, pn);
    if (hr.x > .5 && t > hr.y)
    {
        rn = pn;
        t = hr.y;
    }
}

float dist_to_line(vec2 p, vec2 a, vec2 b)
{
    vec2 l = normalize(b-a);
    return length((a-p) - dot((a - p), l) * l);    
}

vec3 shade_end(vec3 hp, float reflect_depth)
{

    float sr = .02 * mod(reflect_depth - 160. * g_time, 50.);

    // float sm = texture(iChannel0, vec2(.0, .5)).r;
    
    //vec3 c = mix(vec3(1.2, .8, .1), vec3(1., .0, .0), sr);
    //vec3 c = mix(vec3(.8), vec3(0.05), sr);
    vec3 c = mix(vec3(1.2, .8, .1), vec3(1., -.1, .0), sr);
    
    c += .5 * pow((1. - sr), 4.);
    float sp = BIG_NUMBER;
    
    vec2 p1 = vec2(0., sin(10. * g_time));
    vec2 p2 = vec2(-.866, -.5 * sin(5. * g_time));
    vec2 p3 = vec2(.866, -.5 * sin(10. * g_time + 3.14));
    
    sp = min(dist_to_line(hp.xz, p1, p2), sp);
    sp = min(dist_to_line(hp.xz, p2, p3), sp);
    sp = min(dist_to_line(hp.xz, p3, p1), sp);    

    c = (.4 + .6 * smoothstep(0., .6, sp)) * (.5 + .5 * smoothstep(0., .08, sp)) * c;

    float sb = BIG_NUMBER;
    vec2 b1 = vec2(0., 1.732);
    vec2 b2 = vec2(-1.6, -1.);
    vec2 b3 = vec2(1.732, -1.);
    
    sb = min(dist_to_line(hp.xz, b1, b2), sb);
    sb = min(dist_to_line(hp.xz, b2, b3), sb);
    sb = min(dist_to_line(hp.xz, b3, b1), sb);    

    
    c = (.8 + .2 * smoothstep(0., .5, sb)) * (.2 + .8 * smoothstep(0., .08, sb)) * c;
    
    return c;
}

vec3 trace_arabesque(vec3 rd, 
                     vec3 ro)
{
 
    vec3 r = rd;
    vec3 o = ro;  
    vec3 c = vec3(0.);
    for (float i = 0.; i < 35.; i += 1.)
    {
        float t = BIG_NUMBER;
        vec3 hn = vec3(0.);

        // Test intersection with the mirrors of the arabesque
        mirror_test(o, r, vec3(.5, 0., .866),  vec3(.866, 0., .5),  hn, t);
        mirror_test(o, r, vec3(0., 0., -1.),   vec3(0., 0., 1.),    hn, t);
        mirror_test(o, r, vec3(-.5, 0., .866), vec3(-.866, 0., .5), hn, t);        

        // Now test the shaded plane at the bottom of the arabesque
        vec2 pt = intersect_plane(o, r, vec3(0., -10., 0.), vec3(0., 1., 0.));
        if (pt.x > .5 && t > pt.y)
        {
            t = pt.y;
            vec3 hp = o + r * t;
            c += shade_end(hp, i);
            break;
        }

        // If loop isn't broken, reflect the mirrors of the arabesque 
        // and repeat
        o = o + r * t;
        r = reflect(r, hn);

    }
    
    return c;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    g_time = .1 * iGlobalTime;
    
    // aspect ratio
    float invar = iResolution.y / iResolution.x;
    vec2 uv = fragCoord / iResolution.xy - .5;
    uv.y *= invar;
    
    vec3 iz = vec3(0., -1., 0.);
    vec3 ix = vec3(cos(1. * g_time), 0., sin(1. * g_time));
    vec3 iy = normalize(cross(ix, iz));
    
    vec3 o = vec3(0., 5. * sin(2. * g_time + PI * iMouse.x/iResolution.x) + 8., 0.);
    vec3 r = normalize(ix * uv.x + iy * uv.y + .3 * iz);
        
    vec3 c = trace_arabesque(r, o);
    
    // gamma correct
    c = pow(c, vec3(.45));
    
    fragColor = vec4(c, 1.);
}


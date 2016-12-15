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

// tested on Macbook Pro 15"
// tested on Windows OS 8.1 - 980 TITAN

// **************************************************************************
// CONSTANTS

#define PI 3.14159
#define TWO_PI 6.28318
#define PI_OVER_TWO 1.570796

#define REALLY_SMALL_NUMBER 0.0001
#define REALLY_BIG_NUMBER 1000000.

#define BRIDGE_SURFACE_ID 1.
#define ISLAND_SURFACE_ID 2.
#define SKY_SURFACE_ID 3.
#define WATER_SURFACE_ID 4.
#define SUSPENSION_STRUTS_SURFACE_ID 5.
#define BRIDGE_LIGHT_SURFACE_ID 6.
#define MOON_SURFACE_ID 7.

#define MOON_COLOR vec3(.91, .93, 1.)

#define DIST_MARCH_STEPS 50
#define DIST_MARCH_MAXDIST 44.

// **************************************************************************
// INLINE MACROS

#define MATCHES_SURFACE_ID(id1, id2) (id1 > (id2 - .5)) && (id1 < (id2 + .5))

// **************************************************************************
// DEFINES

// Increase to 8 to anti-alias (and to warm up your GPU)
#define NUM_AA_SAMPLES 5.

// **************************************************************************
// GLOBALS

vec4  g_debugcolor  = vec4(0.);
float g_time        = 0.;
float g_exposure    = 1.;
float g_focus       = .9;
vec3  g_moonpos     = vec3(0.);

vec3  g_camorigin   = vec3(0.);
vec3  g_campointsat = vec3(0.);

// **************************************************************************
// MATH UTILITIES

float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
    vec2 rg = texture ( iChannel0, (uv+ 0.5)/256.0, -100. ).yx;
    return mix( rg.x, rg.y, f.z );
}

// Approximating a dialectric fresnel effect by using the schlick approximation
// http://en.wikipedia.org/wiki/Schlick's_approximation. Returns a vec3 in case
// I want to approximate a different index of reflection for each channel to
// get a chromatic effect.
vec3 fresnel(vec3 R, vec3 N, float eta)
{
    // assume that the surrounding environment is air on both sides of the 
    // dialectric
    float ro = (1. - eta) / (1. + eta);
    ro *= ro;
    
    float fterm = pow(max(0., 1. - dot(R, N)), 5.);  
    return vec3(ro + ( 1. - ro ) * fterm); 
}

// Rotate the input point around the x-axis by the angle given as a cos(angle)
// and sin(angle) argument.  There are many times where  I want to reuse the
// same angle on different points, so why do the  heavy trig twice. Range of
// outputs := ([-1.,-1.,-1.] -> [1.,1.,1.])
vec3 rotate_xaxis( vec3 point, float cosa, float sina )
{
    return vec3(point.x,
                point.y * cosa - point.z * sina,
                point.y * sina + point.z * cosa);
}

// Rotate the input point around the y-axis by the angle given as a cos(angle)
// and sin(angle) argument.  There are many times where I want to reuse the
// same angle on different points, so why do the heavy trig twice. Range of
// outputs := ([-1.,-1.,-1.] -> [1.,1.,1.])
vec3 rotate_yaxis( vec3 point, float cosa, float sina )
{
    return vec3(point.x * cosa  + point.z * sina,
                point.y,
                point.x * -sina + point.z * cosa);
}


// Reference: http://geomalgorithms.com/a05-_intersect-1.html. Does an
// intersection test against a plane that is assumed to be double sided and
// passes through the plane_origin and has the specified normal. *Overkill* 
// for intersecting with the x-z plane.

// Returns a vec2 where:
//   result.x = 1. or 0. if there is a hit
//   result.y = t such that ray_origin + t*ray_direction = intersection point
vec2 intersect_plane(vec3 ro,
                     vec3 rd,
                     vec3 pn,
                     vec3 po)
{
    float rddn = dot(rd, pn);
    float intersected = 0.;

    float t = REALLY_BIG_NUMBER;
    // If the denominator is not a really small number (positive or negative)
    // then an intersection took place.  If it is really small, then the ray
    // is close to parallel to the given plane.
    if (abs(rddn) > REALLY_SMALL_NUMBER) {
        t = -dot(pn, (ro - po)) / rddn;    
        if (t > REALLY_SMALL_NUMBER) {
            intersected = 1.;
        } else {
            t = REALLY_BIG_NUMBER;
        }

    }
    return vec2(intersected, t);
}

// intersection for a sphere with a ray. If the ray origin is inside the
// sphere - no intersection takes place.  So there is gauranteed to be a tmin
// and tmax return value.
// Returns a vec3 where:
//  result.x = 1. or 0. to indicate if a hit took place
//  result.y = tmin
//  result.z = tmax
vec3 intersect_sphere(vec3 ro,                 
                      vec3 rd, 
                      float sphr,
                      vec3 sphc)
{

    vec3 oro = ro - sphc;

    float a = dot(rd, rd);
    float b = dot(oro, rd);
    float c = dot(oro, oro) - sphr*sphr;
    float discr = b*b - a*c; 
    
    float tmin = 0.0;
    float tmax = 0.0;

    float sdisc = sqrt(discr);
    tmin = (-b - sdisc)/a;
    tmax = (-b + sdisc)/a; 

    float hit = step(0., tmin);

    float outside = step(sphr*sphr, dot(oro, oro));
    return outside * vec3(hit, tmin, tmax);
}

// intersection for a sphere with a ray. Assumes intersecting from within the sphere
// and tmax return value.
// Returns a vec3 where:
//  result.x = 1. or 0. to indicate if a hit took place
//  result.y = tmin
//  result.z = tmax
vec3 intersect_isphere(vec3 ro,                 
                      vec3 rd, 
                      float sphr,
                      vec3 sphc)
{

    vec3 oro = ro - sphc;

    float a = dot(rd, rd);
    float b = dot(oro, rd);
    float c = dot(oro, oro) - sphr*sphr;
    float discr = b*b - a*c; 
    
    float tmin = 0.0;
    float tmax = 0.0;

    float sdisc = sqrt(discr);
    tmin = (-b - sdisc)/a;
    tmax = (-b + sdisc)/a; 

    float hit = step(0., tmax);

    return vec3(hit, tmin, tmax);
}

float flow_noise( in vec3 p )
{
    vec3 q = p - vec3(0., .5 * g_time, 0.);
    float f;
    f  = 0.50000*noise( q ); q = q*3.02 -vec3(0., .5 * g_time, 0.);
    f += 0.35000*noise( q ); q = q*3.03;
    f += 0.15000*noise( q ); q = q*3.01;
    return f;
}

float map4( in vec3 p )
{
    vec3 q = p;
    float f;
    
    f  = 0.50000*noise( q ); q = q*2.02;
    f += 0.25000*noise( q ); q = q*2.03;
    f += 0.12500*noise( q ); q = q*2.01;
    f += 0.06250*noise( q );
    return f;
}

// overlay ca on top of ci and return ci
void composite(inout vec4 ci, vec4 ca)
{
    // assume pre-multiplied alpha    
    ci += ca * (1. - ci.a);
}

vec3 nearest_point_on_line( vec3 a, vec3 b, vec3 p)
{
    
    vec3 ba = b - a;    
    float t = dot(ba, (p - a)) / dot(ba, ba);
    return a + t * ba;
}


// Given the float values, mix between them such that 
//  result=v1 at mod(x,4)=0,3
//  result=v2 at mod(x,4)=1
//  result=v3 at mod(x,4)=2

float periodicmix(float v1, 
                 float v2, 
                 float v3, 
                 float x)
{
    float modx = mod(x, 3.);
    return mix(v1, 
                mix(v2, 
                    mix(v3, 
                        v1,
                        smoothstep(.5, .6, modx - 2.)), 
                    smoothstep(.5, .6, modx - 1.)), 
                smoothstep(.5, .6, modx));
}

// **************************************************************************
// DISTANCE FUNC MATH

float sphere_df( vec3 p, float r ) { return length( p ) - r; }
float roundbox_df ( vec3 p, vec3 b, float r ) {return length(max(abs(p-vec3(0., .5*b.y, 0.))-.5*b,0.0))-r; }

// **************************************************************************
// INFORMATION HOLDERS (aka DATA STRUCTURES)

struct CameraInfo
{
    vec3 camera_origin;
    vec3 ray_look_direction;
    mat3 camera_transform;
    vec2 image_plane_uv;
};

#define INIT_CAMERA_INFO() CameraInfo(vec3(0.) /* camera_origin */, vec3(0.) /* ray_look_direction */, mat3(1.) /* camera_transform */, vec2(0.) /* image_plane_uv */)

struct SurfaceInfo
{
    float surface_id;
    vec3 view_origin;
    vec3 view_dir;
    vec3 surface_point;
    vec3 surface_normal;
    vec2 surface_uv;
    float surface_depth;
    float shade_in_reflection;
};
#define INIT_SURFACE_INFO(view_origin, view_dir) SurfaceInfo(-1. /* surface_id */, view_origin, view_dir, vec3(0.) /* surface_point */, vec3(0.) /* surface_normal */, vec2(0.) /* surface_uv */, 0. /* surface_depth */, 0. /* shade_in_reflection */)

struct MaterialInfo
{
    vec3 bump_normal;
    vec3 diffuse_color;
    vec3 specular_color; 
    float specular_exponent; 
    float reflection_intensity;
    vec3 emissive_color;
};
#define INIT_MATERIAL_INFO(surface_normal) MaterialInfo(surface_normal /* bump_normal */, vec3(0.) /* diffuse_color */, vec3(0.) /* specular_color */, 1. /* specular_exponent */, 1. /* reflection_intensity */, vec3(0.) /* emissive_color */)

// **************************************************************************
// SETUP WORLD
    
void setup_globals()
{
    // Way to globally control playback rate.
    g_time = 1. * iGlobalTime;
    //g_time = .2 * iMouse.x;
    
    g_exposure = 1.;    

    // remap the mouse click ([-1, 1], [-1/AspectRatio, 1/AspectRatio])
    vec2 click = iMouse.xy / iResolution.xx;  
    click = 2.0 * click - 1.0;  
    
    g_camorigin = vec3(0.0, .1, 7.0);
    
    //float rotxang    = .4 * PI * click.y;
    float rotxang    = .4 * PI * -0.0;
    rotxang += -.02 * cos(.02 * g_time) - .03;
    float cosrotxang = cos(rotxang);
    float sinrotxang = sin(rotxang);
    g_camorigin = rotate_xaxis(g_camorigin, cosrotxang, sinrotxang);
    
    //float rotyang    = PI * click.x;
    float rotyang    = PI * .28;
    rotyang += .05 * sin(.2 * g_time);
    //float rotyang    = .1 * sin(.1 * g_time + PI_OVER_TWO) + TWO_PI * .71;
    float cosrotyang = cos(rotyang);
    float sinrotyang = sin(rotyang);    
    g_camorigin = rotate_yaxis(g_camorigin, cosrotyang, sinrotyang);

    g_campointsat = vec3(0., .55, 1.5);

    // XXX: DUPLICATED from setup_camera
    // would be nice to consolidate work, but laziness won.

    // calculate the ray origin and ray direction that represents mapping the
    // image plane towards the scene.  Assume the camera is facing y-up (0., 1.,
    // 0.).
    vec3 iu = vec3(0., 1., 0.);

    vec3 iz = normalize( g_campointsat - g_camorigin );
    vec3 ix = normalize( cross(iz, iu) );
    vec3 iy = cross(ix, iz);

    // project the camera ray through the current pixel being shaded using the
    // pin-hole camera model.

    float inv_aspect_ratio = iResolution.y / iResolution.x;
    vec2 click_uv = iMouse.xy / iResolution.xy - .5;
    click_uv.y *= inv_aspect_ratio;

    vec3 ray_click_dir = normalize( click_uv.x * ix + click_uv.y * iy + g_focus * iz );

    vec3 result = intersect_isphere(g_camorigin, ray_click_dir, 40., g_camorigin);

    if (iMouse.x + iMouse.y > 1.)
    {
      g_moonpos = g_camorigin + result.z * ray_click_dir;
    }
    else
    {
        g_moonpos = vec3(-28., 8., 3.);
    }

}


CameraInfo setup_camera(vec2 aaoffset)
{

    float inv_aspect_ratio = iResolution.y / iResolution.x;
    vec2 image_plane_uv = (gl_FragCoord.xy + aaoffset) / iResolution.xy - .5;
    image_plane_uv.y *= inv_aspect_ratio;

    // calculate the ray origin and ray direction that represents mapping the
    // image plane towards the scene.  Assume the camera is facing y-up (0., 1.,
    // 0.).
    vec3 iu = vec3(0., 1., 0.);

    vec3 iz = normalize( g_campointsat - g_camorigin );
    vec3 ix = normalize( cross(iz, iu) );
    vec3 iy = cross(ix, iz);

    // project the camera ray through the current pixel being shaded using the
    // pin-hole camera model.
    vec3 ray_look_direction = normalize( image_plane_uv.x * ix + image_plane_uv.y * iy + g_focus * iz );

    return CameraInfo(g_camorigin, ray_look_direction, mat3(ix, iy, iz), image_plane_uv);

}

// **************************************************************************
// MARCH WORLD

vec2 mergeobjs(vec2 a, vec2 b) { return mix(b, a, step(a.x, b.x)); }

float uniondf(float a, float b) { return min(a, b); }
float intersdf(float a, float b) { return max(a, b); }
float diffdf(float a, float b) { return max(a, -b); }

vec2 scene_df( vec3 p )
{
    
    // ground    
    vec3 gp = p * vec3(.2, 1., .2) + vec3(0., 10., 0.) * (.5*map4(.2 * p)-.5) + vec3(7.2, 3.3, -2.);
    vec2 ground_obj = vec2(sphere_df(gp, 2.9), ISLAND_SURFACE_ID);    

    // moon
    vec3 mp = p - g_moonpos;
    float mdf = sphere_df(mp, 1.2);
    
    // bridge towers
    vec3 bb = p;    
    bb.x = mod(bb.x + 4., 8.); // repeat bridge struts
    bb.x -= 4.;
    
    bb.z = abs(bb.z); // symmetric along the xy plane
    bb.z -= .15; // separation of sides
    
    float bdf = roundbox_df( bb, vec3(.1, 2.5, .03), .01); // sides    
    bdf = uniondf(bdf, roundbox_df( bb, vec3(.35, .12, .15), .01)); // bottom
    bdf = uniondf(bdf, roundbox_df( bb - vec3(0., 2.45, -0.1), vec3(.11, .1, .3), .01)); // top    
    bdf = uniondf(bdf, roundbox_df( bb - vec3(0., .92, -0.1), vec3(8., .02, .2), .01)); // bottom bridge
    bdf = uniondf(bdf, roundbox_df( bb - vec3(0., 1.05, -0.1), vec3(8., .02, .2), .01)); // top bridge
                 
    // struts
    vec3 cb = bb;
    cb.y = mod(cb.y + .19, .38);
    cb.y = abs(cb.y - .19);
    
    // mask out certain struts by moving them so far away, they
    // would never be the closest object
    float m = step(2.5, bb.y) + step(.95, bb.y) * step(bb.y, 1.3); 
    cb.y -= .15 + REALLY_BIG_NUMBER * m;
    cb.yz *= mat2(-.707, -.707, .707, -.707); 
    bdf = uniondf(bdf, roundbox_df( cb, vec3(.03, 1., .03), .01)); // struts

    // suspension cables
    vec3 sp = p;    
    sp.x = mod(sp.x, 8.); 
    sp.x -= 4.;
    sp.z = abs(sp.z);
    sp.z -= .15;
    sp.y -= .09 * sp.x*sp.x;
    bdf = uniondf(bdf, roundbox_df( sp - vec3(0., 1.1, 0.), vec3(8., .01, .01), .01)); // bridge
        
    // suspension hanging struts
    vec3 tp = p;
    tp.x = mod(tp.x + .05, .1);
    tp.x -= .05;
    tp.z -= .13;
    float sdf = roundbox_df(tp - vec3(0., 1.06, 0.), vec3(.0, .089 * sp.x*sp.x + .02, .0), .005);
    
    // bridge warning light
    float wldf = sphere_df(bb - vec3(0.0, 2.64, -.15), .03);
        
    vec2 bridge_obj = vec2(bdf, BRIDGE_SURFACE_ID); 
    vec2 suspension_obj = vec2(sdf, SUSPENSION_STRUTS_SURFACE_ID);        
    vec2 light_obj = vec2(wldf, BRIDGE_LIGHT_SURFACE_ID); 
    vec2 moon_obj = vec2(mdf, MOON_SURFACE_ID);
    
    vec2 obj = ground_obj;
    obj = mergeobjs(obj, bridge_obj);
    obj = mergeobjs(obj, suspension_obj);
    obj = mergeobjs(obj, light_obj);
    obj = mergeobjs(obj, moon_obj);
    return obj;
}

vec3 calc_normal( vec3 p )
{
    vec3 epsilon = vec3( 0.01, 0.0, 0.0 );
    vec3 n = vec3(
        scene_df(p + epsilon.xyy).x - scene_df(p - epsilon.xyy).x,
        scene_df(p + epsilon.yxy).x - scene_df(p - epsilon.yxy).x,
        scene_df(p + epsilon.yyx).x - scene_df(p - epsilon.yyx).x );
    return normalize( n );
}

vec2 intersect_water(vec3 ro, vec3 rd)
{
    return intersect_plane(ro, rd, vec3(0., 1., 0.), vec3(0., 0., 0.));
}

SurfaceInfo march_scene(vec3 ray_origin,
                        vec3 ray_direction,
                        float consider_water )
{

    SurfaceInfo surface = INIT_SURFACE_INFO(ray_origin, ray_direction);

    vec2 water = consider_water * intersect_water(ray_origin, ray_direction);
    
    float epsilon = 0.001;
    float dist = 10. * epsilon;
    float total_t = 0.;
    float curr_t = 0.;
    
    vec3 ro = ray_origin;
    vec3 rd = ray_direction;
    
    for (int i=0; i < DIST_MARCH_STEPS; i++) 
    {
        if ( abs(dist) < epsilon || curr_t + total_t > DIST_MARCH_MAXDIST ) 
        {
            break;
        }        

        vec3 p = ro + curr_t * rd;        
        vec2 dfresult = scene_df( p );
        
        // calculate sky on it's own since it shifts with ray_origin
        // and we don't want to consider it with calc_normal
        vec2 sky_obj = vec2(-sphere_df(p, 35.), SKY_SURFACE_ID);
        dfresult = mergeobjs(sky_obj, dfresult);

        dist = dfresult.x;        
        curr_t += dist;
        surface.surface_id = dfresult.y;
   
        if ( water.x > .5 && curr_t > water.y )
        {
            surface.surface_id = WATER_SURFACE_ID;
            curr_t = water.y;
            break;
        }   

                                          
    }
    
    surface.surface_point = ro + curr_t * rd;
    total_t += curr_t;
    
    if (MATCHES_SURFACE_ID(surface.surface_id, WATER_SURFACE_ID))
    {
        vec3 n = vec3(0., 1., 0.);
        vec3 u = normalize(-vec3(1., 0., 1.) * ray_origin);
        vec3 v = cross(n, u);
        surface.surface_uv = vec2(100., 10.) * vec2( dot(surface.surface_point, u), 
                                                    dot(surface.surface_point, v) );

        n += u * (.2 * flow_noise(surface.surface_uv.xxy) - .1);
        surface.surface_normal = normalize(n);
       
    }    
    else if (MATCHES_SURFACE_ID(surface.surface_id, SKY_SURFACE_ID))
    {
        surface.surface_normal = -rd;
        surface.surface_uv = surface.surface_point.xz;
    }
    else 
    {        
        surface.surface_normal = calc_normal( surface.surface_point );
        surface.surface_uv = surface.surface_point.xz;
    }
    
            
    surface.surface_depth = total_t;

    return surface;
}

// **************************************************************************
// SHADE WORLD

vec3 light_from_point_light(SurfaceInfo  surface,
                            MaterialInfo material,
                            vec3 light_position,
                            vec3 light_color,
                           float falloff_with_distance,
                           float specular_sharpen)
{
    vec3 light_direction = normalize(light_position - surface.surface_point);
    vec3 light_reflection_direction = reflect(light_direction, material.bump_normal);
    
    // Phong reflection model
    vec3 reflective_shading = material.specular_color * pow(max(0., dot(light_reflection_direction, surface.view_dir)), 
        material.specular_exponent * specular_sharpen);
    
    float ldist = length(surface.surface_point - light_position);
    float dist_atten = 1./ldist;
    vec3 diffuse_shading = material.diffuse_color * max(0., dot(light_direction, material.bump_normal)) * mix(1., dist_atten, falloff_with_distance);    
    vec3 scene_color = light_color * (diffuse_shading + reflective_shading);
 
    return scene_color;

}


vec4 shade_clouds(vec3 ro, vec3 rd, float depth)
{
    vec4 cloud_rgba = vec4(0.);
    vec3 cn = normalize(ro);
    float num_clouds = 0.;
    
    for (float i = 0.; i < 3.; i += 1.)
    {
        vec3 ch = intersect_isphere(ro, rd, 3.1 * i + 4.5, ro);
        if (ch.x > .5 && ch.z < depth )
        {
            vec3 hp = ro + rd * ch.z;
            vec3 hpo = nearest_point_on_line(ro, g_moonpos, hp);
            vec3 uvhp = hp - vec3(-28., 9., 9.);
            
            uvhp *= 2.;
            float height_s = smoothstep(1., 5., hp.y);
            
            float cloud_alpha = (.06 + .02 * i) * (.2 + .8 * smoothstep(.1, .9 - .25 * height_s, map4(vec3(1., .8, 0.) * uvhp.yxz + vec3(3. * i, 5. * i , .05 * g_time))));
            cloud_alpha *= smoothstep(0.5, 1.5, hp.y) * smoothstep(2. + 1.8 * i, .0, hp.y);
            vec3 cloud_color = 2. * vec3(.6,.8,1.+.1*i);
            
            vec3 halod = hp - hpo;
            vec3 halo_color = .8 * MOON_COLOR * max(0., 4. - length(2. * halod));
            cloud_color += .6 * pow(halo_color, vec3(2.));
            composite(cloud_rgba, vec4(cloud_color * cloud_alpha, cloud_alpha));            
            num_clouds += 1.;
        }
        else
        {
            break;
        }
    }

    //g_debugcolor.rgb = vec3(num_clouds * .25);
    //g_debugcolor.a = 1.;
    return cloud_rgba;
    //return vec4(0.);
}

vec3 shade_reflected_world(SurfaceInfo surface)
{
    vec4 scene_color = vec4(0.);
    
    MaterialInfo material = INIT_MATERIAL_INFO(surface.surface_normal);
    if (MATCHES_SURFACE_ID(surface.surface_id, BRIDGE_SURFACE_ID))
    {

        material.diffuse_color = .02 * vec3(.65, .62, .68);
        material.specular_color = .5 * vec3(0.5, 0.6, 0.7);
        material.specular_exponent = 30.;

        material.emissive_color = vec3(.04, .03, .035);
    } 
    else if (MATCHES_SURFACE_ID(surface.surface_id, BRIDGE_LIGHT_SURFACE_ID))
    {
        material.diffuse_color = vec3(0.);
        material.specular_color = vec3(0.);
        float i = abs(sin(g_time));
        material.emissive_color = i*i * vec3(2., .05, .05);
        material.reflection_intensity = 10.;
        
    }
    else if (MATCHES_SURFACE_ID(surface.surface_id, SUSPENSION_STRUTS_SURFACE_ID))
    {

        material.diffuse_color = vec3(0.);
        material.specular_color = vec3(0.);
        material.specular_exponent = 1.;

        vec3 dp = surface.surface_point.xyz;
        dp.x = mod(dp.x + 4., 8.);
        dp.x -= 4.;
        
        // pattern 1
        float s = (.5 * cos(6. * dp.y * pow(abs(dp.x), .5) - 4. * g_time ) + .5);
        float c1 = smoothstep(.3, 1., s);

        // pattern 2
        s = (.5 * cos(4. * dp.y * dp.x + mix(-1., 1., step(0., dp.x))* 5. * g_time ) + .5);
        float c2 = smoothstep(.2, .8, s);
           
        // pattern 3
        dp = surface.surface_point.xyz;
        s = .5 * cos(2. * dp.x - 2.* g_time + 5. * 1. * sin(3. * dp.y + 1. * g_time)) + .5;
        float c3 = smoothstep(.2, .9, s);
        
        float c = periodicmix(c1, c2, c3, .2 * g_time + .3 * dp.y);

        // discrete lights
        float l = mod(20. * dp.y, 1.);
        c *= smoothstep(0.2, .5, l) * smoothstep(.8, .5, l);
        
        material.emissive_color = 2. * c * vec3(.9, .9, 1.);
        material.reflection_intensity = 8.;

    } 
    
    else if (MATCHES_SURFACE_ID(surface.surface_id, ISLAND_SURFACE_ID))
    {
        vec3 surface_color = .05 * vec3(1., .5, .7);        

        material.diffuse_color = surface_color;

        material.emissive_color = .1 * surface_color;
        material.specular_color = .1 * surface_color;
        material.specular_exponent = 1.;

    }
    
    else if (MATCHES_SURFACE_ID(surface.surface_id, SKY_SURFACE_ID))
    {
        vec3 sky_color = .6 * vec3(0.15, 0.12, .12) * smoothstep(3., 0., surface.surface_point.y);        
        float l = smoothstep(2., 0., surface.surface_point.y);
        sky_color += .5 * vec3(0.2, 0.14, .12) * l * l;
    vec3 cn = surface.surface_point;
        cn.z = floor(20. * cn.z) * .05;
        float city_noise = noise(8. * cn.xzz);
        sky_color += 2. * vec3(1., .8, .7) * smoothstep(.25 * city_noise - .05, -.06, surface.surface_point.y);
        material.emissive_color = sky_color;
    }
    
    else if (MATCHES_SURFACE_ID(surface.surface_id, MOON_SURFACE_ID))
    {
        material.diffuse_color = vec3(0.);
        material.specular_color = vec3(0.);
        
        mat3 om = mat3( 0.00,  0.80,  0.60,
                       -0.80,  0.36, -0.48,
                       -0.60, -0.48,  0.64 );

        vec3 mp = 1.3 * om * (surface.surface_point - g_moonpos);

        float moon = .1;
        moon += .6 * smoothstep( 0.2,  .8, noise( .6 * (mp - vec3(1., 0., 0.)) ));
        mp = 1.2 * om * mp; 
        moon += .5 * smoothstep( 0.2,  1., noise( .8 * (mp - vec3(1., 0., 0.))));
        mp = 2.8 * om * mp; 
        moon += 0.300 * smoothstep( 0.1,  1.3, pow(noise( mp ), 3.0));    

        moon *= .8 + .2 * smoothstep( 0.5,  0.7, noise( 1.7 * mp ));
        moon *= .6 + .4 * noise( 30.5 * mp); 
        moon += 0.35 * pow(noise( 15.5 * mp), 6.);

        material.emissive_color = moon * .6 * MOON_COLOR;
        material.reflection_intensity = 4.;
    }
      
    vec4 scene_rgba = vec4(0.05, .05, .08, 0.1);
    vec3 em = material.emissive_color * mix(1., material.reflection_intensity, step(0.5, surface.shade_in_reflection));  
    scene_rgba.rgb += em;
    vec4 clouds_rgba = shade_clouds(surface.view_origin, surface.view_dir, surface.surface_depth);

    vec3 lit_color = light_from_point_light(surface, 
                                            material, 
                                            g_moonpos, 
                                            MOON_COLOR, 
                                            0., 
                                            1.);


    lit_color *= g_exposure;
    clouds_rgba.rgb *= g_exposure;
 
    composite(scene_rgba, clouds_rgba);
    composite(scene_rgba, vec4(lit_color, 1.));
        
    return scene_rgba.rgb;
}


vec3 shade_world(SurfaceInfo surface)
{

    vec4 scene_color = vec4(0.);
    
    if (MATCHES_SURFACE_ID(surface.surface_id, WATER_SURFACE_ID))
    {
        MaterialInfo material = INIT_MATERIAL_INFO(surface.surface_normal);
        
        vec3 surface_color = vec3(.07,.08,.1) + mix(vec3(.18, .22, .35),
                                 vec3(.21, .25, .38), 
                                 flow_noise(surface.surface_uv.xxy));

        material.diffuse_color = .6 * surface_color;
        material.emissive_color = .15 * surface_color;
        material.specular_color = .5 * MOON_COLOR;
        material.specular_exponent = 200.;
        
        SurfaceInfo refl_surface = march_scene( surface.surface_point, 
                                                reflect(surface.view_dir, 
                                                        surface.surface_normal), 
                                                0. );
        
        refl_surface.shade_in_reflection = 1.;
        vec3 refl_color = shade_reflected_world( refl_surface );
        
        // fresnel like falloff to reflection
        refl_color *= (.5 + .5 * smoothstep(0.3, 2.5, surface.surface_depth));

        // loss of reflection with wave occlusion in the distance
        refl_color *= (.5 + .5 * smoothstep(3., 1., surface.surface_depth));
            

        vec4 scene_rgba = vec4(0.);
        
        vec3 lit_color = light_from_point_light(surface, 
                                                material, 
                                                g_moonpos, 
                                                MOON_COLOR, 
                                                0., 1.);
        
        lit_color += .2 * refl_color;        
        lit_color *= g_exposure;              
        
        scene_color = scene_rgba; 
        composite(scene_color, vec4(lit_color, 1.));

    }
    else
    {
        
        scene_color.rgb = shade_reflected_world(surface);
    }

    return scene_color.rgb;
}

// **************************************************************************
// MAIN

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{   
    
    // ----------------------------------
    // SETUP GLOBALS

    setup_globals();

    // ----------------------------------
    // SETUP CAMERA

    float denom = TWO_PI/max(1., NUM_AA_SAMPLES-1.);
    vec3 scene_color = vec3(0.);

    for (float aa = 0.; aa < NUM_AA_SAMPLES; aa += 1.) 
    {

        vec2 aaoffset = step(.5, aa) * .5 * vec2( cos((aa-1.) * denom ),
                                                  sin((aa-1.) * denom ) );

        CameraInfo camera = setup_camera( aaoffset );
        
        // ----------------------------------
        // SCENE MARCHING

        SurfaceInfo surface = march_scene( camera.camera_origin,
         camera.ray_look_direction, 1. );
        
        // ----------------------------------
        // SHADING
        
        scene_color += shade_world( surface );
        

    }

    scene_color /= NUM_AA_SAMPLES;

    // ----------------------------------
    // POST PROCESSING
    
    // Brighten
    scene_color *= 1.2;
  
    // Gamma correct
    scene_color = pow(max(vec3(0.), scene_color), vec3(.8));

    // Contrast adjust - cute trick learned from iq
    scene_color = mix( scene_color, vec3(dot(scene_color,vec3(0.333))), -.3 );

    // Color tint
    scene_color *= .5 + .5 * vec3(.9, 1., 1.);
      
    // Horizontal vignette - inspired by iq
    vec2 uv = fragCoord.xy / iResolution.xy;
    scene_color *= 0.2 + 0.8*pow( 8.0*uv.x*(1.0-uv.x), 0.1 );
    
    // Debug color - great debugging tool.  
    if (g_debugcolor.a > 0.) 
    {
        fragColor.rgb = g_debugcolor.rgb;
    } else {
        fragColor.rgb = scene_color;
    }

    fragColor.a = 1.;
}

void main()
{
  mainImage(fragColor, fragCoord);
}

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
/*

  Endless Passageway
  ------------------
  
    Combining techniques like normal-based edging, bump mapping and bump-based edging to produce 
  a detailed looking surface without the high cost. I'm using concepts from my "Twisted Geometry"
  example, but applying them to a less abstract setting... Although, an endless corridor with 
  dubious lighting and shadows is hardly realistic. :)

  I'd orginally started with a nice, ornate, carved-timber scene, then for some inexplicable reason 
  decided that a grungey, slightly mystical, pseudo-metallic-marble Islamic look was the order of 
  the day. I put it in the weird, but interesting category. :)

  The distance function is very basic. It's possible to create a much more interesting setting,
  but I wanted to keep the base geometry simple in order to achieve decent frame rates. 

  Anyway, it's just a simple artsy example. Not to be taken seriously. I'll put up something more
  interesting later.

  
  // Related example.

  // A room with columns example using much nicer distance function geometry and atmosphere.
  Catacombs - IQ
  https://www.shadertoy.com/view/lsf3zr

  // Gorgeous example.
    Castle Tunnel - Hamneggs
  https://www.shadertoy.com/view/Xs3Xzn


*/

// Maximum ray distance.
#define FAR 50.

// Comment this out to omit the detailing. Basically, the bump mapping won't be included.
#define SHOW_DETAILS

// The edges give it subtle detail. Not entirely necessary, but adds just a little more depth.
#define SHOW_EDGES

float objID; // Structure object ID.
float bObjID; // Bump map detail ID.

// 2D rotation. Always handy. Angle vector, courtesy of Fabrice.
mat2 rot( float th ){ vec2 a = sin(vec2(1.5707963, 0) - th); return mat2(a, -a.y, a.x); }

// Camera path. Arranged to coincide with the frequency of the lattice.
vec3 camPath(float t){
  
    //return vec3(0, 0, t); // Straight path.
    
    // Curvy path. Weaving around the columns.
    float a = sin(t * 3.14159265/24. + 1.5707963);
    float b = cos(t * 3.14159265/32.);
    
    return vec3(a*4.35, b*a, t);    
}


// Smooth minimum. Courtesy of IQ.
float sminP( float a, float b, float smoothing ){

    float h = clamp((b-a)/smoothing*.5 + .5, 0., 1.);
    return mix(b, a, h) - smoothing*h*(1. - h);
}



// Standard lattice variation, of which there are infinitely many. This is only called by the 
// bump mapping function to add some detail to the structure. You could certainly incorporate it
// into the distance function, but it would slow it down considerably.
float lattice(vec3 p){
 

    // Repeat field entity one, which is just some square tubes repeated in all directions every 
    // two units, then combined with a minimum function. Otherwise known as a lattice.
    p = abs(mod(p, 2.) - 1.);
  float x1 = min(max(p.x, p.y), min(max(p.y, p.z), max(p.x, p.z))) - .32;//.5 + p.y*.1;// - .32;
    

    // Repeat field entity two, which is just an abstract object repeated every half unit. 
    p = abs(mod(p,  .5) - .25);
    float x2 = min(p.x, min(p.y, p.z));
    
    bObjID = step(x2, x1);
    
    

    // Combining the two entities above.
    return max(x1, x2) - .08;    
    
}

// Standard lattice variation, of which there are infinitely many.
float columns(vec3 p){
    
    // Repeat field entity one, which is just some square tubes repeated in all directions every 
    // four units.
    p = abs(mod(p, 4.) - 2.);
  
    float x1 = max(p.x, p.z)- .32; //Columns.
  //float x1 = min(max(p.x, p.y), min(max(p.y, p.z), max(p.x, p.z))) - .32; // Lattice, for comparison.
    
    float bl = max(max(p.x - .5, p.z - .5), p.y + .1); // Column header and footer. Boxes.
    
    
    x1 = min(x1, bl); // Column with header and footer.
    

    // Repeat field entity two, which is just an abstract object repeated every half unit. 
    p = abs(mod(p,  .5) - .25);
    float x2 = min(p.x, min(p.y, p.z)); // Carving out the columns with a repeat object.
    
    objID = step(x1, x2-.05); // ID, to give the column two different materials.

    // Combining the two entities above.
    return max(x1, x2) - .05;   
    
    
}

// Nothing more than some columns enclosed with a floor, ceiling and walls. Pretty simple.
float map(vec3 p){
    
    
    float d =  columns(p); // Repeat columns.
    
    float fl = p.y + 2.5; // Floor.

    p = abs(p);
    
    d = sminP(d, -(p.y - 2.5 - d*.75), 1.5); // Add a smooth ceiling.
    
    d = min(d, -(p.x - 5.85)); // Add the Walls.
    
    d = sminP(d, fl, .25); // Smoothly combine the floor.
     
    return d*.75;
}

// Raymarching. Pretty standard. Nothing fancy.
float trace(vec3 ro, vec3 rd){

    float t = 0., d;
    for (int i=0; i<80; i++){

        d = map(ro + rd*t);
        if(abs(d)<.001*(t*.125 + 1.) || t>FAR) break;
        t += d;
    }
    
    return min(t, FAR);
}

// Tri-Planar blending function. Based on an old Nvidia writeup:
// GPU Gems 3 - Ryan Geiss: http://http.developer.nvidia.com/GPUGems3/gpugems3_ch01.html
vec3 tex3D(sampler2D channel, vec3 p, vec3 n){

    
    n = max(abs(n) - .2, 0.001);
    n /= dot(n, vec3(1));
  vec3 tx = texture(channel, p.yz).xyz;
    vec3 ty = texture(channel, p.xz).xyz;
    vec3 tz = texture(channel, p.xy).xyz;
    
    // Textures are stored in sRGB (I think), so you have to convert them to linear space 
    // (squaring is a rough approximation) prior to working with them... or something like that. :)
    // Once the final color value is gamma corrected, you see should correct looking colors.
    return tx*tx*n.x + ty*ty*n.y + tz*tz*n.z;
}

// The bump mapping function.
float bumpFunction(in vec3 p){
    
   
    // A reproduction of the lattice at higher frequency. Obviously, you could put
    // anything here. Noise, Voronoi, other geometrical formulas, etc.
    //return min(abs(columns(p*4.)*.34 + lattice(p*4.)*.66)*1.6, 1.);
    float c = 0.;
    
    // The logic is simple, but a little messy.
    if(p.y>2.15) c = min(abs(lattice(p*3.))*1.6, 1.); // Ceiling.
    else if(p.y>-2.15) c = min(abs(lattice(p*4.))*1.6, 1.); // Columns.
    else c = min(abs(lattice(p*2.))*1.6, 1.); // Floor.
    
    return c;  
   
}

// Standard function-based bump mapping function with some edging thrown into the mix.
vec3 doBumpMap(in vec3 p, in vec3 n, float bumpfactor, inout float edge){
    
    // Resolution independent sample distance... Basically, I want the lines to be about
    // the same pixel with, regardless of resolution... Coding is annoying sometimes. :)
    vec2 e = vec2(3./iResolution.y, 0); 
    
    float f = bumpFunction(p); // Hit point function sample.
    
    float fx = bumpFunction(p - e.xyy); // Nearby sample in the X-direction.
    float fy = bumpFunction(p - e.yxy); // Nearby sample in the Y-direction.
    float fz = bumpFunction(p - e.yyx); // Nearby sample in the Y-direction.
    
    float fx2 = bumpFunction(p + e.xyy); // Sample in the opposite X-direction.
    float fy2 = bumpFunction(p + e.yxy); // Sample in the opposite Y-direction.
    float fz2 = bumpFunction(p+ e.yyx);  // Sample in the opposite Z-direction.
    
     
    // The gradient vector. Making use of the extra samples to obtain a more locally
    // accurate value. It has a bit of a smoothing effect, which is a bonus.
    vec3 grad = vec3(fx - fx2, fy - fy2, fz - fz2)/(e.x*2.);  
    //vec3 grad = (vec3(fx, fy, fz ) - f)/e.x;  // Without the extra samples.


    // Using the above samples to obtain an edge value. In essence, you're taking some
    // surrounding samples and determining how much they differ from the hit point
    // sample. It's really no different in concept to 2D edging.
    edge = abs(fx + fy + fz + fx2 + fy2 + fz2 - 6.*f);
    edge = smoothstep(0., 1., edge/e.x);
    
    // Some kind of gradient correction. I'm getting so old that I've forgotten why you
    // do this. It's a simple reason, and a necessary one. I remember that much. :D
    grad -= n*dot(n, grad);          
                      
    return normalize(n + grad*bumpfactor); // Bump the normal with the gradient vector.
  
}

// The normal function with some edge detection rolled into it. Sometimes, it's possible to get away
// with six taps, but we need a bit of epsilon value variance here, so there's an extra six.
vec3 nr(vec3 p, inout float edge, float t){ 
  
    vec2 e = vec2(3./iResolution.y, 0); // Larger epsilon for greater sample spread, thus thicker edges.

    // Take some distance function measurements from either side of the hit point on all three axes.
  float d1 = map(p + e.xyy), d2 = map(p - e.xyy);
  float d3 = map(p + e.yxy), d4 = map(p - e.yxy);
  float d5 = map(p + e.yyx), d6 = map(p - e.yyx);
  float d = map(p)*2.;  // The hit point itself - Doubled to cut down on calculations. See below.
     
    // Edges - Take a geometry measurement from either side of the hit point. Average them, then see how
    // much the value differs from the hit point itself. Do this for X, Y and Z directions. Here, the sum
    // is used for the overall difference, but there are other ways. Note that it's mainly sharp surface 
    // curves that register a discernible difference.
    edge = abs(d1 + d2 - d) + abs(d3 + d4 - d) + abs(d5 + d6 - d);
    //edge = max(max(abs(d1 + d2 - d), abs(d3 + d4 - d)), abs(d5 + d6 - d)); // Etc.
    
    // Once you have an edge value, it needs to normalized, and smoothed if possible. How you 
    // do that is up to you. This is what I came up with for now, but I might tweak it later.
    edge = smoothstep(0., 1., sqrt(edge/e.x*2.));
  
    // Redoing the calculations for the normal with a more precise epsilon value.
    e = vec2(.005*min(1. + t, 5.), 0);
  d1 = map(p + e.xyy), d2 = map(p - e.xyy);
  d3 = map(p + e.yxy), d4 = map(p - e.yxy);
  d5 = map(p + e.yyx), d6 = map(p - e.yyx); 
    
    // Return the normal.
    // Standard, normalized gradient mearsurement.
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

// I keep a collection of occlusion routines... OK, that sounded really nerdy. :)
// Anyway, I like this one. I'm assuming it's based on IQ's original.
float cao(in vec3 p, in vec3 n){
  
    float sca = 1., occ = 0.;
    for(float i=0.; i<5.; i++){
    
        float hr = .01 + i*.5/4.;        
        float dd = map(n * hr + p);
        occ += (hr - dd)*sca;
        sca *= 0.7;
    }
    return clamp(1.0 - occ, 0., 1.);    
}


// Cheap shadows are hard. In fact, I'd almost say, shadowing particular scenes with limited 
// iterations is impossible... However, I'd be very grateful if someone could prove me wrong. :)
float softShadow(vec3 ro, vec3 lp, float k){

    // More would be nicer. More is always nicer, but not really affordable... Not on my slow test machine, anyway.
    const int maxIterationsShad = 20; 
    
    vec3 rd = (lp-ro); // Unnormalized direction ray.

    float shade = 1.0;
    float dist = 0.05;    
    float end = max(length(rd), 0.001);
    //float stepDist = end/float(maxIterationsShad);
    
    rd /= end;

    // Max shadow iterations - More iterations make nicer shadows, but slow things down. Obviously, the lowest 
    // number to give a decent shadow is the best one to choose. 
    for (int i=0; i<maxIterationsShad; i++){

        float h = map(ro + rd*dist);
        //shade = min(shade, k*h/dist);
        shade = min(shade, smoothstep(0.0, 1.0, k*h/dist)); // Subtle difference. Thanks to IQ for this tidbit.
        //dist += min( h, stepDist ); // So many options here: dist += clamp( h, 0.0005, 0.2 ), etc.
        dist += clamp(h, 0.01, 0.2);
        
        // Early exits from accumulative distance function calls tend to be a good thing.
        if (h<0.001 || dist > end) break; 
    }

    // I've added 0.5 to the final shade value, which lightens the shadow a bit. It's a preference thing.
    return min(max(shade, 0.) + 0.2, 1.0); 
}


void mainImage(out vec4 fragColor, in vec2 fragCoord){

    
    // Screen coordinates.
  vec2 u = (fragCoord - iResolution.xy*0.5)/iResolution.y;
  
  // Camera Setup.
    float speed = 3.;
    vec3 ro = camPath(iGlobalTime*speed); // Camera position, doubling as the ray origin.
    vec3 lk = camPath(iGlobalTime*speed + .1);  // "Look At" position.
    //vec3 lp = camPath(iGlobalTime*speed + 4.); // Light position, somewhere near the moving camera.
  vec3 lp = vec3(0, 0, iGlobalTime*speed) + vec3(0, .5, 3.5);//


    // Using the above to produce the unit ray-direction vector.
    float FOV = 3.14159/3.; ///3. FOV - Field of view.
    vec3 fwd = normalize(lk-ro);
    vec3 rgt = normalize(vec3(fwd.z, 0., -fwd.x )); 
    vec3 up = cross(fwd, rgt);

    // Unit direction ray.
    //vec3 rd = normalize(fwd + FOV*(u.x*rgt + u.y*up));
    
    // Mild lens distortion. The sheer straight edged geometry is was getting to me. :) 
    vec3 rd = fwd + FOV*(u.x*rgt + u.y*up);
    rd = normalize(vec3(rd.xy, (rd.z - length(rd.xy)*.125)*.75));
    
    // Swiveling the camera from left to right when turning corners.
    rd.xy = rot(-camPath(lk.z).x/32. )*rd.xy;
    
    
    // Raymarch.
    float t = trace(ro, rd);
    float svObjID = objID;
    
    // Surface hit point.
    vec3 sp = ro + rd*t;
    
    // Normal with edge component.
    float edge;
    vec3 sn = nr(sp, edge, t);
    
    //float svObjID = objID;
    
    // Shadows and ambient self shadowing.
    float sh = softShadow(sp, lp, 16.); // Soft shadows.
    float ao = cao(sp, sn); // Ambient occlusion.
    
    // Light direction vector setup and light to surface distance.
    lp -= sp;
    float lDist = max(length(lp), .0001);
    lp /= lDist;
    
    // Attenuation.
    float atten = 1. / (1.0 + lDist*lDist*.15);
    
    
    // More fake lighting. This was just a bit of trial-and-error to produce some repetitive,
    // slightly overhead, spotlights throughout the space. Cylinder in XY, sine repeat
    // in the Z direction over three rows... Something like that.
    vec3 spl = sp;
    spl.x = mod(spl.x, 2.) - 1.;
    float spot = max(4. - length(spl.xy - vec2(0, 2.)), 0.)*(sin((spl.z + 1.)*3.14159/2.)*.5+.5);
    spot = smoothstep(0.25, 1., spot); 
        

   
    // Heavy bump. We do this after texture lookup, so as not to disturb the normal too much.
    float edge2 = 0.;
    float svBObjID = 0.;
    #ifdef SHOW_DETAILS
    sn = doBumpMap(sp, sn, .15/(1. + t/FAR), edge2); 
    svBObjID = bObjID;
    #endif    
    
    
    // Diffuse, specular and Fresnel.
    float dif = max(dot(lp, sn), 0.);
    //dif = pow(dif, 4.)*0.66 + pow(dif, 8.)*0.34; // Ramping up the diffuse to make it shinier.
    float spe = pow(max(dot(reflect(rd, sn), lp), 0.), 6.);
    float fre = pow(clamp(dot(rd, sn) + 1., 0., 1.), 4.);
    
    
    
    // Texturing the object. I'm not a fan of this messy logic, epspecially the nesting, but it 
    // doesn't have a great impact on the speed, plus it's easy enough to follow.
    vec3 tx;
    if(sp.y>2.25) { // && sp.y<2.25
        tx = tex3D(iChannel0, sp/2., sn)*1.; //Ceiling.
    }
    else if((sp.y)>1.88) {
        tx = tex3D(iChannel1, sp/1., sn); // Top column footers.
        tx = smoothstep(0.025, .7, tx);

    }
    else if(sp.y>-1.88) {
        
        // Columns.        
        if(svObjID>.5) { 
          tx = tex3D(iChannel1, sp/1., sn);
          tx = smoothstep(0.025, .7, tx);
        }
        else tx = tex3D(iChannel0, sp/4. + .5, sn)*1.; 

    }
    else if((sp.y)>-2.25) {
        tx = tex3D(iChannel1, sp/1., sn); // Bottom column footers.
        tx = smoothstep(0.025, .7, tx);

    }
    else {
        tx = tex3D(iChannel0, sp/4. + .5, sn)*1.25; // Floor.
        if (svBObjID>.5) tx *= 2./1.25; // Slighty lighten part of the bumped pattern.
    }

    
    
    #ifdef SHOW_EDGES
    // Applying the normal-based and bump mapped edges.
    tx *= (1.-edge*.7)*(1.-edge2*.7);
    #endif
    
    
    
    // Combining the terms above to produce the final color.
    vec3 fc = tx *(dif + .25 + vec3(.5, .7, 1)*fre*4.) + vec3(1, .7, .3)*spe*3. + spot*tx*3.;
    fc *= atten*sh*ao;
    
    // Mixing in some blueish fog.
    vec3 bg = mix(vec3(1, .5, .3), vec3(1, .9, .5), rd.y*.5+.5);
    fc = mix(fc, bg*1.25, smoothstep(0., .9, t/FAR));//1./(1. + t*t*.002)
   
    // Post processing.
    fc = fc*.65 + vec3(1.2, 1.05, .9)*pow(max(fc, 0.), vec3(1, 1.2, 1.5))*.35; // Contrast, coloring.
    

    // Vignette.
    u = fragCoord/iResolution.xy;
    fc = min(fc, 1.)*pow( 16.0*u.x*u.y*(1.0-u.x)*(1.0-u.y) , .125);    
 

    //fc = vec3(ao); // Uncomment this to see the AO and the scene without the bump detailing.
    
    // Approximate gamma correction.
  fragColor = vec4(sqrt(clamp(fc, 0., 1.)), 1.0);
}

void main()
{
  mainImage(fragColor, fragCoord);
}
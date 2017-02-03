
vec2 hash2(vec2 p){
	vec2 v = vec2(dot(p, vec2(332.3,331.2)),
				dot(p, vec2(533.3,294.2)) );
	return fract(sin(v)*72253.23);
}

vec2 vnoise(vec2 p, out vec2 ma, out vec2 mb){
	vec2 n = floor(p);
	vec2 f = fract(p);

	vec2 md = vec2(8.0);
	// vec2 ma = vec2(0.0);
	// vec2 mb = vec2(0.0);
	for (int i = -1; i<=1; i++){
		for (int j = -1; j <=1; j++){
			vec2 g = vec2( float(i), float(j) );
			vec2 o = hash2(n + g);
			o = vec2(0.5) + 0.5 * sin( iGlobalTime + 5.32 * o );
			vec2 r = -f + g + o;
			float dist = length(r);
			
			if (md.x > dist){
				md.y = md.x;
				md.x = dist;
				ma = r;
			}
			else if (md.y > dist){
				md.y = dist;
				mb = r;
			}
		}
	}



	return md;
}

float vnoise2(vec2 p){
	vec2 n = floor(p);
	vec2 f = fract(p);


	// vec2 md = vec2(8.0);
	float md = 8.0;
	vec2 mg, mr;
	
	// vec2 ma = vec2(0.0);
	// vec2 mb = vec2(0.0);
	for (int i = -1; i<=1; i++){
		for (int j = -1; j <=1; j++){
			vec2 g = vec2( float(i), float(j) );
			vec2 o = hash2(n + g);
			o = vec2(0.5) + 0.5 * sin( iGlobalTime + 5.32 * o );
			vec2 r = -f + g + o;
			float dist = dot(r,r);
			
			if (md > dist){
				md = dist;
				mr = r;
				mg = g;
			}
		}
	}

	float res = 16.0;
	for (int i = -2; i<= 2; i++){
		for (int j = -2; j <= 2; j++){
			vec2 g = mg + vec2( float(i), float(j) );
			vec2 o = hash2(n + g);
			o = vec2(0.5) + 0.5 * sin( iGlobalTime + 5.32 * o );
			vec2 r = -f + g + o;
			float border;
			if ( dot(mr - r, mr - r) > 0.00001 ){
				border = dot( 0.5 * (mr + r), normalize(r - mr) );	
			}
			
			res = min(res, border);
		}
	}

	return res;
}

vec3 voronoi3( in vec2 x )
{
  vec2 n = floor(x);
  vec2 f = fract(x);

  //----------------------------------
  // first pass: regular voronoi
  //----------------------------------
  vec2 mg, mr;

  float md = 8.0;
  for ( int j = -1; j <= 1; j++ )
    for ( int i = -1; i <= 1; i++ )
    {
      vec2 g = vec2(float(i), float(j));

      // Retrieve the value from the 4 corners.
      vec2 o = hash2( n + g );
      o = vec2(0.5) + 0.5 * sin( iGlobalTime + 5.32 * o );
      // Get distance
      vec2 r = g + o - f;
      float d = dot(r, r);
      // d = length(r);
      if ( d < md )
      {
        md = d;
        mr = r;
        mg = g;
      }
    }

  //----------------------------------
  // second pass: distance to borders
  //----------------------------------
  md = 8.0;
  for ( int j = -2; j <= 2; j++ )
    for ( int i = -2; i <= 2; i++ )
    {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 o = hash2( n + g );
      o = vec2(0.5) + 0.5 * sin( iGlobalTime + 5.32 * o );
      vec2 r = g + o - f;

      if ( dot(mr - r, mr - r) > 0.00001 )
        md = min( md, dot( 0.5 * (mr + r), normalize(r - mr) ) );
    }

  return vec3( md, mr );
}


float getBorder(vec2 p){
	vec2 a, b;
	vnoise(p, a, b);
	float dist = dot( (a+b) * 0.5, normalize(b-a));
	return dist;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){

	vec2 uv = (-iResolution.xy + 2.0*fragCoord.xy)/ iResolution.y;
	// vec2 uv = (fragCoord.xy/iResolution.xy);
	// uv.y*= iResolution.y/ iResolution.x;
	vec3 color = vec3(1.0);
	
	
	// vec2 p = (uv- vec2(-0.9, 0.5) ) * 80.0 * (0.5 + 0.5 * sin(iGlobalTime * 0.1 ) );
	vec2 p = uv * 4;
	// color = vec3(vnoise(p * 80.0));
	// float border = getBorder(p);
	float border = vnoise2(p);
	// float border = voronoi3(p).x;
	color = vec3(1.0) * (1.0 - smoothstep(0.0, 0.05, border));
	fragColor = vec4(color.xyz, 1.0);
}


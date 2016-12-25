void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    fragColor = texture2D(iChannel0, uv) * vec4(1.0);
}
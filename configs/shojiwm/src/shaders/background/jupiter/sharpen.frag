uniform float aspect;
uniform sampler2D state;

vec4 shader_main(EffectContext effect) {
    vec2 uv = effect.texture_uv;
    vec2 px = vec2(1.0 / 1920.0, 1.0 / 1080.0);

    vec3 center = texture2D(state, uv).rgb;
    vec3 north  = texture2D(state, uv + vec2(0.0, px.y)).rgb;
    vec3 south  = texture2D(state, uv + vec2(0.0, -px.y)).rgb;
    vec3 east   = texture2D(state, uv + vec2(px.x, 0.0)).rgb;
    vec3 west   = texture2D(state, uv + vec2(-px.x, 0.0)).rgb;

    vec3 sharpen = (4.0 * center - north - south - east - west) * 5.0;
    sharpen = clamp(sharpen, vec3(-0.02), vec3(0.02));

    vec3 sharpened = clamp(center + sharpen, 0.0, 1.0);
    return vec4(sharpened, 1.0);
}

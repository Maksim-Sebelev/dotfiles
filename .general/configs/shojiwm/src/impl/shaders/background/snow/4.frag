// "Just snow" — adapted for ShojiWM.
// Original by Andrew Baldwin (twitter: baldand, www: http://thndl.com)
// License: Attribution-NonCommercial-ShareAlike
// (http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US)
//
// ShojiWM contract:
//   input:  tex — backdrop (already blurred by the pipeline)
//           effect.texture_uv
//           uniform float time, aspect, speed, snow_amount, angle_deg
//   output: vec4 RGBA

// LIGHT_SNOW: 50 layers, sparse flakes. Comment out for blizzard (200 layers).
#define LIGHT_SNOW

#ifdef LIGHT_SNOW
    #define LAYERS 50
    #define DEPTH .5
    #define WIDTH .3
    #define SPEED .6
#else // BLIZZARD
    #define LAYERS 200
    #define DEPTH .1
    #define WIDTH .8
    #define SPEED 1.5
#endif

uniform float time;
uniform float aspect;       // width / height
uniform float speed;        // multiplier for time (1.0 = original)
uniform float snow_amount;  // 0..1 — brightness/density of snow
uniform float angle_deg;    // 0 = vertical, +30 = tilt right, -30 = tilt left

void mainImage(out vec4 fragColor, in vec2 fragCoord, float iTime, vec2 iResolution) {
    const mat3 p = mat3(
        13.323122, 23.5112,  21.71123,
        21.1212,   28.7312,  11.9312,
        21.8112,   14.7212,  61.3934
    );
    vec2 uv = vec2(1., iResolution.y / iResolution.x) * fragCoord.xy / iResolution.xy;
    vec3 acc = vec3(0.0);
    float dof = 5. * sin(iTime * .1);
    for (int i = 0; i < LAYERS; i++) {
        float fi = float(i);
        vec2 q = uv * (1. + fi * DEPTH);
        q += vec2(
            q.y * (WIDTH * mod(fi * 7.238917, 1.) - WIDTH * .5),
            SPEED * iTime / (1. + fi * DEPTH * .03)
        );
        vec3 n = vec3(floor(q), 31.189 + fi);
        vec3 m = floor(n) * .00001 + fract(n);
        vec3 mp = (31415.9 + m) / fract(p * m);
        vec3 r = fract(mp);
        vec2 s = abs(mod(q, 1.) - .5 + .9 * r.xy - .45);
        s += .01 * abs(2. * fract(10. * q.yx) - 1.);
        float d = .6 * max(s.x - s.y, s.x + s.y) + max(s.x, s.y) - .01;
        float edge = .005 + .05 * min(.5 * abs(fi - 5. - dof), 1.);
        acc += vec3(smoothstep(edge, -edge, d) * (r.x / (1. + .02 * fi * DEPTH)));
    }
    fragColor = vec4(vec3(acc) * snow_amount, 1.0);
}

vec4 shader_main(EffectContext effect) {
    // Resolution in logical pixels; we only need the aspect ratio for the
    // original formula, so derive a plausible height from `aspect`.
    float h = 1000.0;
    vec2 iResolution = vec2(aspect * h, h);

    // fragCoord in the same space as the original (pixels, origin bottom-left).
    vec2 fragCoord = vec2(
        effect.texture_uv.x * iResolution.x,
        (1.0 - effect.texture_uv.y) * iResolution.y
    );

    // Apply the fall angle by rotating the sample position around the centre.
    // Positive angle_deg tilts the fall direction to the right.
    float a = radians(-angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rot = mat2(ca, -sa, sa, ca);
    vec2 center = iResolution * 0.5;
    vec2 rotated = rot * (fragCoord - center) + center;

    vec4 snow;
    mainImage(snow, rotated, time * speed, iResolution);

    // Read the backdrop and add the snow on top.
    vec3 col = texture2D(tex, effect.texture_uv).rgb;
    col += snow.rgb;

    return vec4(col, 1.0);
}

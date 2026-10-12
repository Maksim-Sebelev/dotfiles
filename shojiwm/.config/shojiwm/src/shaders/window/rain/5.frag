// Window-rain derived from Heartfelt © Martijn Steinrucken aka BigWings, 2017.
// https://www.shadertoy.com/view/ltffzl
// License: CC BY-NC-SA 3.0
//
// Переделка под ShojiWM:
//   - iChannel0 → tex (backdropSource)
//   - iResolution → aspect + effect.texture_uv
//   - Gaussian blur 32×8 → blur_local (BLUR_TAPS тапов)
//   - iTime → time * speed
//   - iMouse → убрано, rainAmount = rain_amount
//   - добавлены регулировки brightness / contrast / gamma
//   - добавлен параметр trail_color (цвет следов капель)
//   - добавлен параметр bg_blur (сила размытия фона)
//
// Контракт (см. rain.ts):
//   вход:  tex — backdropSource
//          effect.texture_uv
//          uniform float time, speed, rain_amount, aspect, angle_deg
//          uniform float streak_length, splashes, brightness
//          uniform float bg_blur, trail_strength
//          uniform vec3  trail_color
//   выход: vec4 RGBA

uniform float time;
uniform float speed;
uniform float rain_amount;
uniform float aspect;
uniform float angle_deg;
uniform float streak_length;
uniform float splashes;
uniform float brightness;        // 1.0 = без изменений
uniform float bg_blur;           // 1.0 = норма, 2.0 = вдвое сильнее, 0.0 = резко
uniform float trail_strength;    // сила акцента на каплях (в оригинале ~0.6)
uniform vec3  trail_color;       // цвет следов капель

#define S(a, b, t) smoothstep(a, b, t)
#define DROP_SIZE 0.2
#define BLUR_TAPS 12

// ---- helpers ----------------------------------------------------------------

vec3 N13(float p) {
    vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec3((p3.x + p3.y) * p3.z,
                      (p3.x + p3.z) * p3.y,
                      (p3.y + p3.z) * p3.x));
}

float N(float t) {
    return fract(sin(t * 12345.564) * 7658.76);
}

float Saw(float b, float t) {
    return S(0., b, t) * S(1., b, t);
}

// ---- Drops ------------------------------------------------------------------

vec2 Drops(vec2 uv, float t) {
    vec2 UV = uv;

    uv.y += t * 0.8;
    vec2 a = vec2(6., 1.);
    vec2 grid = a * 2.;
    vec2 id = floor(uv * grid);

    float colShift = N(id.x);
    uv.y += colShift;

    id = floor(uv * grid);
    vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
    vec2 st = fract(uv * grid) - vec2(.5, 0);

    float x = n.x - .5;

    float y = UV.y * 20.;
    float distort = sin(y + sin(y));
    x += distort * (.5 - abs(x)) * (n.z - .5);
    x *= .7;
    float ti = fract(t + n.z);
    y = (Saw(.85, ti) - .5) * .9 + .5;
    vec2 p = vec2(x, y);

    float d = length((st - p) * a.yx);

    float dSize = DROP_SIZE;
    float Drop = S(dSize, .0, d);

    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x - x);

    float trail = S((dSize * .5 + .03) * r, (dSize * .5 - .05) * r, cd);
    float trailFront = S(-.02, .02, st.y - y);
    trail *= trailFront;

    y = UV.y;
    y += N(id.x);
    float trail2 = S(dSize * r, .0, cd);
    float droplets = max(0., (sin(y * (1. - y) * 120.) - st.y))
                   * trail2 * trailFront * n.z;
    y = fract(y * 10.) + (st.y - .5);
    float dd = length(st - vec2(x, y));
    droplets = S(dSize * N(id.x), 0., dd);
    float m = Drop + droplets * r * trailFront;

    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
    uv *= 30.;

    vec2 id = floor(uv);
    uv = fract(uv) - .5;
    vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
    vec2 p = (n.xy - .5) * 0.5;
    float d = length(uv - p);

    float fade = Saw(.025, fract(t + n.z));
    float c = S(DROP_SIZE, 0., d) * fract(n.z * 10.) * fade;

    return c;
}

vec2 Rain(vec2 uv, float t) {
    float s = StaticDrops(uv, t);
    vec2 r1 = Drops(uv, t);
    vec2 r2 = Drops(uv * 1.8, t);

    float c = s + r1.x + r2.x;
    c = S(.3, 1., c);

    return vec2(c, max(r1.y, r2.y));
}

// ---- локальный blur ---------------------------------------------------------
// Кольцо из BLUR_TAPS точек. Радиус теперь масштабируется bg_blur.
// Если в pipeline уже есть dualKawaseBlur — bg_blur можно оставить 1.0,
// чтобы не размывать дважды.
vec3 blur_local(vec2 uv, float blur_amt, float bg_scale) {
    float radius = blur_amt * 0.04 * bg_scale;

    vec3 acc = texture2D(tex, uv).rgb;
    float total = 1.0;

    for (int i = 1; i <= BLUR_TAPS; i++) {
        float a = 6.2831853 * float(i) / float(BLUR_TAPS);
        vec2 off = vec2(cos(a), sin(a)) * radius;
        acc += texture2D(tex, uv + off).rgb;
        total += 1.0;
    }

    return acc / total;
}

// ---- main -------------------------------------------------------------------

vec4 shader_main(EffectContext effect) {
    vec2 UV = effect.texture_uv;
    vec2 uv = effect.texture_uv - 0.5;
    uv.x *= aspect;

    float a = radians(angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rotM = mat2(ca, -sa, sa, ca);
    vec2 rot_uv = rotM * uv;

    float T = time * speed;
    float t = T * 0.2;

    float rainAmount = rain_amount;

    float maxBlur = mix(3., 6., rainAmount);
    float minBlur = 2.;

    float staticDrops = S(-.5, 1., rainAmount) * 2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);

    vec2 c = Rain(rot_uv, t);

    vec2 e = vec2(.001, 0.);
    float cx = Rain(rot_uv + e, t).x;
    float cy = Rain(rot_uv + e.yx, t).x;
    vec2 n = vec2(cx - c.x, cy - c.x);

    n = rotM * n;

    float focus_level = mix(maxBlur - c.y, minBlur, S(.1, .2, c.x));
    float blur_amt = clamp((focus_level - minBlur) / (maxBlur - minBlur), 0.0, 1.0);
    blur_amt = 1.0 - blur_amt;

    // Смещение UV от нормалей + локальный blur.
    // bg_blur — глобальный множитель размытия. 1.0 = «как было»,
    // 2.0 = вдвое сильнее, 0.0 = без локального размытия.
    vec2 sampleUV = UV + n * 0.1;
    vec3 col = blur_local(sampleUV, blur_amt * rain_amount, bg_blur);

    // ---- следы капель ----
    // В оригинале: col -= c.y; col += c.y*(tex + 0.6);
    // Здесь trail_color — это замена .6 (цвет). trail_strength — замена 1.0.
    float trail = clamp(c.y, 0.0, 1.0);
    vec3 sharp = texture2D(tex, UV + n).rgb;
    col -= trail * trail_strength;
    col += trail * trail_strength * (sharp + trail_color);

    // ---- яркость / контраст / гамма ----
    const float CONTRAST = 1.10;
    const float GAMMA    = 0.92;

    col = pow(max(col, 0.0), vec3(GAMMA));
    col *= brightness;
    col = (col - 0.5) * CONTRAST + 0.5;
    col = clamp(col, 0.0, 1.0);

    // Мягкая виньетка.
    col *= 1.0 - dot(UV - .5, UV - .5) * 0.5;

    return vec4(col, 1.0);
}

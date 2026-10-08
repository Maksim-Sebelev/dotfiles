// Window-rain derived from Heartfelt © Martijn Steinrucken aka BigWings, 2017.
// https://www.shadertoy.com/view/ltffzl
// License: CC BY-NC-SA 3.0
//
// Переделка под ShojiWM:
//   - iChannel0 → tex
//   - iResolution → aspect + effect.texture_uv
//   - textureLod(..., focus) → локальный blur вручную (см. blur_local)
//   - iTime → time * speed
//   - iMouse → убрано, rainAmount = rain_amount
//
// Контракт (см. rain.ts):
//   вход:  tex — то, что за окном (backdropSource)
//          effect.texture_uv
//          uniform float time, speed, rain_amount, aspect, angle_deg
//          uniform float streak_length, splashes
//   выход: vec4 RGBA

uniform float time;
uniform float speed;
uniform float rain_amount;
uniform float aspect;
uniform float angle_deg;
uniform float streak_length;
uniform float splashes;

#define S(a, b, t) smoothstep(a, b, t)

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

vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;

    uv.y += t * 0.75;
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
    float wiggle = sin(y + sin(y));
    x += wiggle * (.5 - abs(x)) * (n.z - .5);
    x *= .7;
    float ti = fract(t + n.z);
    y = (Saw(.85, ti) - .5) * .9 + .5;
    vec2 p = vec2(x, y);

    float d = length((st - p) * a.yx);

    float mainDrop = S(.4, .0, d);

    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x - x);
    float trail = S(.23 * r, .15 * r * r, cd);
    float trailFront = S(-.02, .02, st.y - y);
    trail *= trailFront * r * r;

    y = UV.y;
    float trail2 = S(.2 * r, .0, cd);
    float droplets = max(0., (sin(y * (1. - y) * 120.) - st.y))
                   * trail2 * trailFront * n.z;
    y = fract(y * 10.) + (st.y - .5);
    float dd = length(st - vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop + droplets * r * trailFront;

    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
    uv *= 40.;

    vec2 id = floor(uv);
    uv = fract(uv) - .5;
    vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
    vec2 p = (n.xy - .5) * .7;
    float d = length(uv - p);

    float fade = Saw(.025, fract(t + n.z));
    float c = S(.3, 0., d) * fract(n.z * 10.) * fade;
    return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
    float s = StaticDrops(uv, t) * l0;
    vec2 m1 = DropLayer2(uv, t) * l1;
    vec2 m2 = DropLayer2(uv * 1.85, t) * l2;

    float c = s + m1.x + m2.x;
    c = S(.3, 1., c);

    return vec2(c, max(m1.y * l0, m2.y * l1));
}

// ---- локальный blur ---------------------------------------------------------
// Замена textureLod(tex, uv, focus). Идём по кольцу из BLUR_TAPS точек
// с радиусом, зависящим от blur_amt (0..1). Чем больше blur_amt, тем
// шире разброс семплов и тем «мутнее» результат.
//
// 8 семплов — компромисс между качеством и скоростью. Если нужно
// глаже — увеличь BLUR_TAPS и/или сделай два кольца.

#define BLUR_TAPS 8

vec3 blur_local(vec2 uv, float blur_amt) {
    // Радиус в UV-единицах. В оригинале focus ходил от 2.0 до 6.0
    // в мип-уровнях, что примерно соответствует радиусу 0.0..0.04 UV.
    float radius = blur_amt * 0.04;

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
    vec2 uv = (effect.texture_uv - 0.5);
    uv.x *= aspect;

    // Наклон.
    float a = radians(-angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rotM = mat2(ca, -sa, sa, ca);
    vec2 rot_uv = rotM * uv;

    float T = - time * speed;
    float t = T * 0.2;

    float rainAmount = rain_amount;

    float maxBlur = mix(3., 6., rainAmount);
    float minBlur = 2.;

    float staticDrops = S(-.5, 1., rainAmount) * 2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);

    vec2 c = Drops(rot_uv, t, staticDrops, layer1, layer2);

    // Дорогие нормали — как в оригинале, 3 вызова Drops на пиксель.
    vec2 e = vec2(.001, 0.);
    float cx = Drops(rot_uv + e, t, staticDrops, layer1, layer2).x;
    float cy = Drops(rot_uv + e.yx, t, staticDrops, layer1, layer2).x;
    vec2 n = vec2(cx - c.x, cy - c.x);

    // Поворачиваем нормаль обратно в исходную систему координат.
    n = rotM * n;

    // focus из оригинала: 0..1, где 0 = резко, 1 = мутно.
    // В оригинале focus = mix(maxBlur - c.y, minBlur, S(.1, .2, c.x)) —
    // это мип-уровень. Приведём к 0..1: чем больше trail (c.y),
    // тем меньше blur; чем больше mask (c.x), тем ближе к minBlur.
    float focus_level = mix(maxBlur - c.y, minBlur, S(.1, .2, c.x));
    // maxBlur = 6, minBlur = 2 → нормируем.
    float blur_amt = clamp((focus_level - minBlur) / (maxBlur - minBlur), 0.0, 1.0);
    // Хотим: чем ближе к minBlur, тем меньше blur. Инвертируем.
    blur_amt = 1.0 - blur_amt;

    // Смещение UV от нормалей капель + локальный blur.
    vec2 sampleUV = UV + n * 0.1;
    vec3 col = blur_local(sampleUV, blur_amt * rain_amount);
    // vec3 col = blur_local(sampleUV, rain_amount);

    // Пост-обработка: фиолетовый оттенок + виньетка (как в оригинале).
    // col *= 1.0 - dot(UV - .5, UV - .5) * 0.5;

    return vec4(col, 1);
}

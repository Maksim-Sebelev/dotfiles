// Rain sheets over wallpaper, adapted for ShojiWM.
//
// Идея слоистого дождя взята из "Rainy London" © David Hoskins.
// https://www.shadertoy.com/view/XlffRz
//
// Оставлена только часть rain sheets — 12 плоскостей на разной глубине.
// 3D-сцена, raymarching, отражения и 11 источников света удалены.
// Шум — процедурный (hash-based). Цвет полос — холодный, чуть варьируется
// по глубине. Яркость регулируется uniform'ом brightness.
//
// Контракт (см. rain.ts):
//   вход:  tex — обои слоя
//          effect.texture_uv
//          uniform float time, speed, rain_amount, aspect, angle_deg
//          uniform float streak_length, splashes, brightness
//   выход: vec4 RGBA

uniform float time;
uniform float speed;
uniform float rain_amount;    // 0..1
uniform float aspect;         // width / height
uniform float angle_deg;      // 0 = вертикально, +30 = вправо
uniform float streak_length;  // 1.0 = норма
uniform float splashes;       // 0 = выкл, 1 = вкл
uniform float brightness;     // 1.0 = без изменений

// ---- helpers ---------------------------------------------------------------

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// Двухканальный шум, аналог texture(iChannel3, st).xy.
vec2 rain_noise(vec2 st) {
    float n1 = hash21(st * 1.0);
    float n2 = hash21(st * 2.284 + vec2(13.7, 7.3));
    return vec2(n1, n2);
}

// ---- splash (брызги у низа экрана) -----------------------------------------

float splash_layer(vec2 uv, float ground_y, float t, float density) {
    float below = 1.0 - smoothstep(ground_y - 0.02, ground_y + 0.02, uv.y);
    if (below < 0.001) return 0.0;

    vec2 grid = vec2(40.0 * aspect, 1.0);
    vec2 g = uv * grid;
    vec2 id = floor(g);
    vec2 f  = fract(g) - vec2(0.5, 0.0);

    float present = step(1.0 - density * 0.5, hash21(id + 9.1));
    if (present < 0.5) return 0.0;

    float rnd = hash21(id + 17.3);
    float phase = fract(t * (0.5 + rnd * 0.5) + rnd);
    float radius = phase * 0.35;
    float thick = 0.02 + 0.03 * (1.0 - phase);

    float d = length(vec2(f.x, f.y * 0.5));
    float ring = smoothstep(radius + thick, radius, d)
               * smoothstep(radius - thick, radius, d);

    float fade = 1.0 - phase;

    return present * ring * fade * below;
}

// ---- main ------------------------------------------------------------------

vec4 shader_main(EffectContext effect) {
    vec2 q = effect.texture_uv;

    // Наклон дождя: поворачиваем UV один раз, работаем в повёрнутой системе.
    float a = radians(-angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rot = mat2(ca, -sa, sa, ca);

    vec2 uv = q - 0.5;
    uv.x *= aspect;
    vec2 rot_uv = rot * uv;

    float t = - time * speed;

    // ---- rain sheets ----------------------------------------------------
    // 12 плоскостей на разной глубине. Каждая даёт свой вклад в яркость
    // на основе процедурного шума.
    float rain = 0.0;
    float dis = 1.0;

    for (int i = 0; i < 12; i++) {
        // «Плоскость» в условном 3D — сдвиг UV на dis.
        vec2 plane = rot_uv + vec2(dis * 0.15, 0.0);

        float f = pow(dis, 0.45) + 0.25;

        // st — координаты для шума. Растяжение (1.5, 0.05) даёт
        // вертикальные полосы.
        vec2 st = f * (plane * vec2(1.5, 0.05)
                     + vec2(-t * 0.1 + plane.y * 0.5, t * 0.12));

        // Процедурный шум вместо texture(iChannel3, st).
        vec2 n = rain_noise(st * 0.5);
        float n2 = rain_noise(st * 0.284).x;
        float s = n.x + n2;

        // Резкий порог: оставляем только яркие полосы.
        // Верхняя граница зависит от q.y (внизу экрана ярче) — как в оригинале.
        float sheet = clamp(
            pow(abs(s) * 0.5, 29.0) * 140.0,
            0.0,
            q.y * 0.4 + 0.05
        );

        // Затухание с глубиной: дальние слои слабее.
        float depthFade = 1.0 / (1.0 + dis * 0.05);

        rain += sheet * depthFade;

        dis += 3.5;
    }

    // rain_amount — общая интенсивность, streak_length — растяжение.
    rain *= rain_amount * 0.35 * streak_length;
    rain = clamp(rain, 0.0, 1.0);

    // ---- splash ---------------------------------------------------------
    float ground = -0.5 + 0.02;
    float splash = 0.0;
    if (splashes > 0.5) {
        vec2 splash_uv = q - 0.5;
        splash_uv.x *= aspect;
        splash = splash_layer(splash_uv, ground, t, rain_amount);
    }

    // ---- композиция с обоями -------------------------------------------
    vec3 col = texture2D(tex, q).rgb;

    // Дождь — холодный светлый оттенок.
    vec3 rain_color = vec3(0.75, 0.85, 1.0);
    col += rain * rain_color * 0.6;

    // Splash — белее.
    col += splash * vec3(0.9, 0.95, 1.0) * 0.7;

    // Лёгкое затемнение в плотном дожде — «шторм».
    col *= 1.0 - rain * 0.1;

    // Виньетка.
    vec2 v = q - 0.5;
    col *= 1.0 - dot(v, v) * 0.25;

    // ---- яркость --------------------------------------------------------
    // brightness из uniform, если не передан — GLSL по умолчанию 0,
    // поэтому всегда передавай его из rain.ts (или замени на константу).
    // col *= brightness;
    col = clamp(col, 0.0, 1.0);

    return vec4(col, 0.5);
}

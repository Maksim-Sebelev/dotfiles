// Bubbles background, adapted for ShojiWM.
//
// Оригинал: Inigo Quilez, 2013 — https://iquilezles.org/
// Портировано под ShojiWM: shader_main(EffectContext), effect.texture_uv,
// time, aspect. Фон сделан прозрачным (альфа = 0), пузыри сохраняют
// видимость через собственную альфу.
//
// Контракт:
//   вход:  effect.texture_uv
//          uniform float time, aspect
//   выход: vec4 RGBA (прозрачный фон)

uniform float time;
uniform float aspect;

vec4 shader_main(EffectContext effect) {
    // UV в экранных пропорциях, центрированные по Y.
    // В оригинале: uv = (2*fragCoord - iResolution.xy) / iResolution.y.
    // x-диапазон = [-aspect, aspect], y-диапазон = [-1, 1].
    vec2 uv = effect.texture_uv * 2.0 - 1.0;
    uv.x *= aspect;
    uv.y = -uv.y;

    // Фон: прозрачный. В оригинале был серый градиент, но по заданию
    // фон должен быть прозрачным, чтобы сквозь него были видны обои.
    vec3 color = vec3(0.0);
    float alpha = 0.0;

    // Пузыри.
    for (int i = 0; i < 40; i++) {
        float fi = float(i);
        // seed для фазы, размера, позиции
        float pha = sin(fi * 546.13 + 1.0) * 0.5 + 0.5;
        float siz = pow(sin(fi * 651.74 + 5.0) * 0.5 + 0.5, 4.0);
        float pox = sin(fi * 321.55 + 4.1) * aspect;

        // размер, позиция, цвет пузыря
        float rad = 0.1 + 0.5 * siz;
        vec2 pos = vec2(
            pox,
            -1.0 - rad + (2.0 + 2.0 * rad) * mod(pha + 0.1 * time * (0.2 + 0.8 * siz), 1.0)
        );
        float dis = length(uv - pos);
        vec3 col = mix(
            vec3(0.94, 0.3, 0.0),
            vec3(0.1, 0.4, 0.8),
            0.5 + 0.5 * sin(fi * 1.2 + 1.9)
        );

        // форма пузыря: f = sqrt(1 - (d/r)^2)
        float f = length(uv - pos) / rad;
        f = sqrt(clamp(1.0 - f * f, 0.0, 1.0));

        // видимость: 1 внутри круга, 0 снаружи, с мягким краем
        float bubble = 1.0 - smoothstep(rad * 0.95, rad, dis);
        float bubble_vis = bubble * f;

        // Цвет пузыря складывается с прозрачным фоном.
        // В оригинале было `color -= col.zyx * bubble * f` — потому что
        // фон был светлым, и пузыри затемняли. На прозрачном фоне
        // используем `+=` для «светящихся» пузырей. Если хочешь
        // затемняющие (как в оригинале) — замени на `-=` и добавь
        // базовую альфу под ними.
        color += col.zyx * bubble_vis;

        // Альфа пузыря: чем ближе к центру — тем плотнее.
        alpha = max(alpha, bubble_vis);
    }

    // Виньетка: в оригинале она применялась к цвету фона. На прозрачном
    // фоне она бессмысленна (затемняет то, чего нет). Убираем.
    // color *= sqrt(1.5 - 0.5 * length(uv));

    // Фон прозрачный: alpha = 0 везде, кроме пузырей.
    // Цвет пузырей сохраняем, чтобы они были видны.
    return vec4(color * alpha, alpha);
}

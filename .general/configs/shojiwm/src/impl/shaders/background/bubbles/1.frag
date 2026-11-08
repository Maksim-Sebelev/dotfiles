// Bubbles background, adapted for ShojiWM.
//
// Оригинал: Inigo Quilez, 2013 — https://iquilezles.org/
// Портировано под ShojiWM: shader_main(EffectContext), effect.texture_uv,
// time, aspect. Фон сделан прозрачным (альфа = 0).
//
// Контракт:
//   вход:  effect.texture_uv
//          uniform float time, aspect, speed, angle_deg, opacity
//          uniform vec3  bubble_color1, bubble_color2
//   выход: vec4 RGBA (прозрачный фон)

uniform float time;
uniform float aspect;
uniform float speed;          // 1.0 = норма, 0.0 = статика, 2.0 = быстрее
uniform float angle_deg;      // 0 = вверх, +90 = вправо, -90 = влево
uniform float opacity;        // 1.0 = норма, 0.0 = невидимые
uniform vec3  bubble_color1;  // цвет 1 (например, оранжевый)
uniform vec3  bubble_color2;  // цвет 2 (например, синий)

vec4 shader_main(EffectContext effect) {
    // UV в экранных пропорциях, центрированные по Y.
    vec2 uv = effect.texture_uv * 2.0 - 1.0;
    uv.x *= aspect;
    uv.y = -uv.y; // ShojiWM инверсия Y

    // Наклон движения (поворот UV)
    float a = radians(angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rot = mat2(ca, -sa, sa, ca);
    
    vec2 rot_uv = rot * uv;

    vec3 color = vec3(0.0);
    float alpha = 0.0;

    float t = time * speed;

    for (int i = 0; i < 40; i++) {
        float fi = float(i);
        float pha = sin(fi * 546.13 + 1.0) * 0.5 + 0.5;
        float siz = pow(sin(fi * 651.74 + 5.0) * 0.5 + 0.5, 4.0);
        float pox = sin(fi * 321.55 + 4.1) * aspect;

        float rad = 0.1 + 0.5 * siz;
        
        // Фаза движения
        float cycle = pha + 0.1 * t * (0.2 + 0.8 * siz);
        float progress = fract(cycle); // 0.0 -> 1.0 (бесконечный цикл)
        
        // Позиция пузыря
        vec2 pos = vec2(
            pox,
            -1.0 - rad + (2.0 + 2.0 * rad) * progress
        );
        
        // Считаем расстояние
        float dis = length(rot_uv - pos);
        
        vec3 col = mix(
            bubble_color1,
            bubble_color2,
            0.5 + 0.5 * sin(fi * 1.2 + 1.9)
        );

        float f = length(rot_uv - pos) / rad;
        f = sqrt(clamp(1.0 - f * f, 0.0, 1.0));

        float bubble = 1.0 - smoothstep(rad * 0.95, rad, dis);
        float bubble_vis = bubble * f;

        // МЯГКОЕ ПОЯВЛЕНИЕ/ИСЧЕЗНОВЕНИЕ
        // fade_in: пузырь плавно появляется в первые 15% пути
        // fade_out: пузырь плавно исчезает в последние 15% пути
        float fade_in = smoothstep(0.0, 0.15, progress);
        float fade_out = 1.0 - smoothstep(0.85, 1.0, progress);
        
        // Также добавим затухание, если пузырь выходит за края экрана по Y
        // Верхний край: y = 1.0, нижний край: y = -1.0
        float screen_fade = smoothstep(1.2, 0.8, pos.y) * smoothstep(-1.2, -0.8, pos.y);

        bubble_vis *= fade_in * fade_out * screen_fade;

        color += col.zyx * bubble_vis * opacity;
        alpha = max(alpha, bubble_vis * opacity);
    }

    return vec4(color, alpha);
}

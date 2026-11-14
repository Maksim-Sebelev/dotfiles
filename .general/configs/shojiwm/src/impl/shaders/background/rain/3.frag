// Screen-space rain for ShojiWM wallpaper.
//
// Чисто фрагментный «дождь в воздухе»: падающие струи в трёх слоях
// глубины, наклон через angle_deg, лёгкие splash-кольца у низа экрана.
// Не симуляция — только hash-математика, никаких state-текстур.
//
// Контракт (см. rain.ts):
//   вход:  tex — обои слоя (уже размытые pipeline'ом)
//          effect.texture_uv
//          uniform float time, speed, rain_amount, aspect, angle_deg
//          uniform float streak_length, splashes
//          uniform float rain_opacity, splash_opacity
//   выход: vec4 RGBA
//
// Лицензия: делай что хочешь.

uniform float time;
uniform float speed;
uniform float rain_amount;    // 0..1
uniform float aspect;         // width / height
uniform float angle_deg;      // 0 = вертикально, +30 = наклон вправо
uniform float streak_length;  // 1.0 = норма
uniform float splashes;       // 0 = выкл, 1 = вкл
uniform float rain_opacity;   // 0..1+ - прозрачность/яркость струй
uniform float splash_opacity; // 0..1+ - прозрачность/яркость брызг

// ---- helpers ---------------------------------------------------------------

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

// ---- streaks (падающие струи) ----------------------------------------------

float rain_layer(vec2 uv, float cell_size, float depth, float t,
                 float streak_len, float density)
{
    vec2 grid = vec2(cell_size * aspect, cell_size);
    vec2 g = uv * grid;
    vec2 id = floor(g);
    vec2 f  = fract(g) - vec2(0.5, 0.0);

    float present = step(1.0 - density, hash21(id + 3.7));
    if (present < 0.5) return 0.0;

    float rnd_phase = hash21(id + depth * 71.13);
    float rnd_cyc   = hash21(id + depth * 251.11);

    float period = mix(1.2, 2.5, rnd_cyc);
    float cycle = floor(t / period + rnd_phase);
    float phase = fract(t / period + rnd_phase);

    vec2 cyc_seed = vec2(id.x * 17.31 + cycle * 131.7,
                         id.y * 71.13 + cycle * 419.3);

    float rnd_col   = hash21(cyc_seed + depth * 113.71);
    float rnd_speed = hash21(cyc_seed + depth * 217.19);
    float rnd_drift = hash21(cyc_seed + depth * 313.53);

    float y_start = mix(-0.6, -0.4, rnd_speed);
    float y_end   = mix(1.1, 1.3, rnd_speed);
    float y_head = mix(y_start, y_end, phase);

    float drift = (rnd_drift - 0.5) * 0.3;
    float x_center = (rnd_col - 0.5) * 0.6 + drift * phase;

    float y = f.y - y_head;
    float x = f.x - x_center;

    float r   = mix(0.35, 0.12, depth) / cell_size * streak_len;
    float len = r * mix(4.0, 2.5, depth);

    float t01 = clamp((y + len) / len, 0.0, 1.0);

    float w_tail = t01 * r;
    float w_head = r;

    float dx_tail = abs(x) / max(w_tail, 0.001);
    float dx_head = abs(x) / w_head;

    float mask_tail = (1.0 - smoothstep(0.6, 1.0, dx_tail))
                    * (1.0 - smoothstep(0.0, 0.02, y));
    float mask_head = (1.0 - smoothstep(0.6, 1.0, dx_head))
                    * (1.0 - smoothstep(0.0, r, y));

    float d_head = length(vec2(x, y)) / r;
    float circle_head = 1.0 - smoothstep(0.7, 1.0, d_head);

    float intensity = max(mask_tail, circle_head);
    intensity *= 1.0 - smoothstep(r * 0.9, r * 1.1, y);

    float fade_in  = smoothstep(0.0, 0.1, phase);
    float fade_out = 1.0 - smoothstep(0.85, 1.0, phase);

    return present * intensity * fade_in * fade_out;
}

// ---- splashes (брызги у земли) ---------------------------------------------

float splash_layer(vec2 uv, float ground_y, float t, float density)
{
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
    // UV в «экранных» пропорциях, центрированные.
    vec2 uv = effect.texture_uv - 0.5;
    uv.x *= aspect;

    // Наклон дождя. Поворачиваем систему один раз.
    float a = radians(-angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rot = mat2(ca, -sa, sa, ca);
    mat2 inv_rot = mat2(ca, sa, -sa, ca);

    vec2 rot_uv = rot * uv;

    // Время дождя.
    float t = time * speed;

    // Плотность слоёв зависит от rain_amount. При 0 — дождя нет вообще.
    float density_far  = clamp(rain_amount * 0.7, 0.0, 1.0);
    float density_mid  = clamp(rain_amount * 0.5, 0.0, 1.0);
    float density_near = clamp(rain_amount * 0.35, 0.0, 1.0);

    float r_far  = rain_layer(rot_uv, 90.0, 0.85, t,        streak_length, density_far);
    float r_mid  = rain_layer(rot_uv, 55.0, 0.55, t * 1.15, streak_length, density_mid);
    float r_near = rain_layer(rot_uv, 32.0, 0.15, t * 1.30, streak_length, density_near);

    // Композиция струй: яркость растёт с близостью.
    float rain = r_far * 0.25 + r_mid * 0.5 + r_near * 0.9;
    rain = clamp(rain, 0.0, 1.0);

    // Splash-кольца у низа экрана.
    float splash = 0.0;
    if (splashes > 0.5) {
        splash = splash_layer(uv, -0.48, t, rain_amount);
    }

    // Лёгкое искажение фона под струями — эффект «линзы».
    // Пока множитель 0 — искажения нет. Хочешь — поставь 0.5..1.0.
    vec2 distort = vec2(0.0);
    vec2 sampleUV = effect.texture_uv + (inv_rot * distort) * rain;

    vec3 col = texture2D(tex, sampleUV).rgb;

    // Цвет дождя: холодный, полупрозрачный.
    vec3 rain_color = vec3(0.75, 0.85, 1.0);
    col += rain * rain_color * 0.55 * rain_opacity;

    // Splash — чуть ярче и белее.
    col += splash * vec3(0.9, 0.95, 1.0) * 0.7 * splash_opacity;

    // Лёгкое затемнение в местах плотного дождя — «шторм».
    col *= 1.0 - rain * 0.08;

    // Виньетка.
    vec2 v = effect.texture_uv - 0.5;
    col *= 1.0 - dot(v, v) * 0.25;

    return vec4(col, 1.0);
}

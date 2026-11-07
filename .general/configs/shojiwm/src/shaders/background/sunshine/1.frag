// ==============================================================================================================
// Dynamic Solar Lens Flare — adapted for ShojiWM wallpaper.
//
// Оригинал: https://www.shadertoy.com/view/slVXDW
// Оставлены только блики. Добавлена динамика (мерцание, пульсация),
// при этом точка света (light_position) остается неподвижной.
//
// Контракт:
//   вход:  tex — обои слоя
//          effect.texture_uv
//          uniform float time, aspect, flare_intensity, speed, flicker_intensity
//          uniform vec2  light_position — позиция блика в UV (0..1)
//   выход: vec4 RGBA

uniform float time;
uniform float aspect;
uniform vec2  light_position;     // (0.5, 0.5) = центр экрана
uniform float flare_intensity;    // 1.0 = норма, 0.0 = выкл
uniform float speed;              // 0.0 = статика, 1.0 = норма, 2.0 = быстрее
uniform float flicker_intensity;  // 0.0 = без мерцания, 1.0 = норма

const float PI = 3.1415925358;

float saturate(float x) { return clamp(x, 0.0, 1.0); }
vec3  saturate(vec3 x)  { return clamp(x, 0.0, 1.0); }

vec2 rotate(vec2 p, float r) {
    float s = sin(r);
    float c = cos(r);
    return mat2(c, -s, s, c) * p;
}

// --- noise ----------------------------------------------------------------
float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float noise(vec2 x, float t) {
    vec4 seed = vec4(12.3456, 2.3456, 3.4567, 45.6789);
    vec2 t2 = mod(vec2(t) * vec2(0.05, 30.0), 2.0 * PI);
    t2.x = sin(t2.x);
    float n0 = noise(x + seed.xy - t2.x);
    float n1 = noise(x + seed.zw + t2.x);
    float w  = sin(noise(x) * 2.0 * PI + t2.y) * 0.5 + 0.5;
    float n  = mix(n0, n1, w);
    return saturate(pow(n, 1.5) * 1.2);
}

// --- SDF формы -------------------------------------------------------------
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdHexagon(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
}

// --- блики и гало ----------------------------------------------------------
float halo(vec2 p, vec2 center, float r, float offset, float t_speed) {
    float c0 = 0.5;
    float c1 = 32.0;
    float c2 = 12.0;
    float c3 = 2.0;
    float c4 = 1.0;
    float c5 = 4.0;
    float c6 = 1.2;
    float c7 = 0.5;
    float c8 = 1.5;
    float c9 = 0.25;

    // ДИНАМИКА: шум со временем
    float t  = dot(center, vec2(c9)) + t_speed * 0.5; 
    
    float l  = length(p);
    float l1 = abs(l - r);
    float l2 = pow(l, c0);
    
    // Вращаем шум, чтобы лучи двигались
    float angle = atan(p.y, p.x) + t_speed * 0.2; 
    
    float n0 = noise(vec2(angle * c1, l2) * c2, t);
    float n1 = noise(vec2(-angle * c1, l2) * c2, t);
    
    float n  = mix(pow(max(n0, n1), c3), 1.0, c4) * pow(saturate(1.0 - l1 * c5), c6);
    return n * 0.2 * saturate(pow(saturate(pow(length(center), c7)), (length(p - center) / r) * c8));
}

vec3 ghost3(vec2 p, vec2 center, float focus, float r, float offset, float t_speed, float flicker) {
    float shape_factor = 0.7;
    
    // ДИНАМИКА: призраки немного "дышат" и меняют фокус
    float pulse = sin(t_speed * 1.5 + offset * 10.0) * 0.05 * flicker;
    r *= (1.0 + pulse);
    focus = saturate(focus + pulse);

    p -= center * offset;
    
    // ДИНАМИКА: легкое вращение призраков
    vec2 p2 = rotate(p, 0.25 + t_speed * 0.05);
    
    float d0 = mix(sdCircle(p2 * 0.85, r), sdHexagon(p2 * 0.85, r), shape_factor);
    float d1 = mix(sdCircle(p2, r), sdHexagon(p2, r), shape_factor);
    float d2 = mix(sdCircle(p2 * 1.15, r), sdHexagon(p2 * 1.15, r), shape_factor);
    return mix(
        vec3(
            halo(p * 1.05, center, r, offset, t_speed),
            halo(p * 1.0,  center, r, offset, t_speed),
            halo(p * 0.95, center, r, offset, t_speed)
        ) * vec3(2.0, 1.5, 1.0) * 2.0,
        pow(saturate(1.0 - vec3(d0, d1, d2)), vec3(200.0)),
        focus
    );
}

// --- main ------------------------------------------------------------------
vec4 shader_main(EffectContext effect) {
    // Масштабируем время на скорость
    float t_speed = time * speed;

    vec2 p = effect.texture_uv - 0.5;
    p.x *= aspect;
    p.y = -p.y;

    vec2 center = light_position - 0.5;
    center.x *= aspect;

    // ДИНАМИКА: лучи вращаются, общая яркость мерцает
    float time_flicker = t_speed * 2.0;
    
    vec3 col = vec3(0.0);
    vec3 sun = mix(vec3(0.3, 0.2, 0.02) / 0.9, vec3(0.2, 0.5, 0.8), p.y) * 3.0 - 0.52 * sin(t_speed);

    // Вращение лучей
    float a = atan(p.y - center.y, p.x - center.x) + t_speed * 0.3;
    
    float l = max(1.0 - length(p - center) - 0.84, 0.0);
    float bright = 0.1;

    // ДИНАМИКА: лучи пульсируют
    sun += max(0.1 / pow(length(p - center) * 5.0, 5.0), 0.0) 
           * abs(sin(a * 5.0 + cos(a * 9.0 + time_flicker * 2.0) * flicker_intensity)) / 20.0;
           
    sun += max(0.1 / pow(length(p - center) * 10.0, 1.0 / 20.0), 0.0) 
           + abs(sin(a * 3.0 + cos(a * 9.0 + time_flicker) * flicker_intensity)) / 8.0 
           * (abs(sin(a * 9.0 + time_flicker * 3.0 * flicker_intensity))) / 1.0;
           
    sun += (max(bright / pow(length(p - center) * 4.0, 1.0 / 2.0), 0.0) * 4.0) 
           * vec3(0.2, 0.21, 0.3) * 4.0 
           * (1.0 + 0.2 * sin(time_flicker * 1.5 * flicker_intensity));

    sun *= exp(1.0 - length(p - center)) / 5.0;

    col += sun;

    // Ghosts (блики объектива)
    col += ghost3(p, center, 0.0,  1.5,   1.2, t_speed, flicker_intensity);
    col += ghost3(p, center, 0.3,  .105, 0.5 / 1.5, t_speed, flicker_intensity) * vec3(0.5, 0.1, -0.05);
    col += ghost3(p, center, 0.3,  .11,  .8, t_speed, flicker_intensity) * vec3(0.1, 0.6, -0.05);
    col += ghost3(p, center, 0.3,  .11,  0.3 / 1.5, t_speed, flicker_intensity) * vec3(0.05, -0.05, 0.45);
    col += ghost3(p, center, 0.2,  .13,  -0.8 / 3.5, t_speed, flicker_intensity) * vec3(0.5, 0.1, -0.05);
    col += ghost3(p, center, 0.05, .11,  -1.2 / 3.5, t_speed, flicker_intensity) * vec3(0.0, 0.5, -0.05);
    col += ghost3(p, center, 0.2,  .17,  -2.0 / 3.5, t_speed, flicker_intensity) * vec3(0.05, -0.05, 0.45);
    col += ghost3(p, center, 0.25, .14,  -3.15 / 3.5, t_speed, flicker_intensity) * vec3(0.0, 0.4, 0.2);
    col += ghost3(p, center, 0.15, .185, -3.75 / 3.5, t_speed, flicker_intensity) * vec3(0.0, 0.2, 0.05);
    col += ghost3(p, center, 0.05, .16,  -4.5 / 3.5, t_speed, flicker_intensity) * vec3(0.05, -0.05, 0.45);
    col += ghost3(p, center, 0.20, .13,  -5.75 / 3.5, t_speed, flicker_intensity) * vec3(0.0, 0.3,  0.5);
    col += ghost3(p, center, 0.08, .12,  -5.95 / 3.5, t_speed, flicker_intensity) * vec3(0.05, 0.2, 0.05);
    col += ghost3(p, center, 0.04, .11, -6.15 / 3.5, t_speed, flicker_intensity) * vec3(0.1, -0.05, 0.65);

    vec3 base = texture2D(tex, effect.texture_uv).rgb;
    
    // Используем screen blend (сложение), чтобы блики выглядели естественно на любом фоне
    vec3 finalColor = base + col * flare_intensity;

    return vec4(finalColor, 1.0);
}

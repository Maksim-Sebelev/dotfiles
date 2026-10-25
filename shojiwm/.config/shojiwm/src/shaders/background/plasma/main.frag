// Plasma Globe by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/XsjXRm
// License: CC BY-NC-SA 3.0 Unported
// Адаптировано для ShojiWM wallpaper.
//
// Контракт (см. background-animation.ts):
//   вход:  tex — обои слоя
//          effect.texture_uv
//          uniform float time, speed, aspect, rays_count
//          uniform vec3  glow_color, core_color, bg_color
//   выход: vec4 RGBA

uniform float time;
uniform float speed;
uniform float aspect;
uniform float rays_count;   // ~13 для оригинала, можно 8..25
uniform vec3  glow_color;   // основной цвет плазмы
uniform vec3  core_color;   // цвет ядра и отражений
uniform vec3  bg_color;     // цвет фона

#define VOLUMETRIC_STEPS 19
#define MAX_ITER 35
#define FAR 6.0

// ---- helpers ---------------------------------------------------------------

mat2 mm2(in float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash11(float n) {
    return fract(sin(n) * 43758.5453);
}

// Процедурный value-noise 3D вместо textureLod(iChannel0).
float noise3(vec3 p) {
    vec3 ip = floor(p);
    vec3 fp = fract(p);
    fp = fp * fp * (3.0 - 2.0 * fp);

    // 8 углов куба
    float n000 = hash21(ip.xy + ip.z * 17.0);
    float n100 = hash21(ip.xy + vec2(1.0, 0.0) + ip.z * 17.0);
    float n010 = hash21(ip.xy + vec2(0.0, 1.0) + ip.z * 17.0);
    float n110 = hash21(ip.xy + vec2(1.0, 1.0) + ip.z * 17.0);
    float n001 = hash21(ip.xy + (ip.z + 1.0) * 17.0);
    float n101 = hash21(ip.xy + vec2(1.0, 0.0) + (ip.z + 1.0) * 17.0);
    float n011 = hash21(ip.xy + vec2(0.0, 1.0) + (ip.z + 1.0) * 17.0);
    float n111 = hash21(ip.xy + vec2(1.0, 1.0) + (ip.z + 1.0) * 17.0);

    // Трилинейная интерполяция
    float nx00 = mix(n000, n100, fp.x);
    float nx10 = mix(n010, n110, fp.x);
    float nx01 = mix(n001, n101, fp.x);
    float nx11 = mix(n011, n111, fp.x);

    float nxy0 = mix(nx00, nx10, fp.y);
    float nxy1 = mix(nx01, nx11, fp.y);

    return mix(nxy0, nxy1, fp.z);
}

// 1D noise для flow
float noise1(float x) {
    return noise3(vec3(x * 0.01, 1.0, 0.0));
}

mat3 m3 = mat3( 0.00,  0.80,  0.60,
               -0.80,  0.36, -0.48,
               -0.60, -0.48,  0.64 );

// ---- flow / sins -----------------------------------------------------------

float flow(in vec3 p, in float t) {
    float z = 2.0;
    float rz = 0.0;
    vec3 bp = p;
    for (float i = 1.0; i < 5.0; i++) {
        p += t * 0.1;
        rz += (sin(noise3(p + t * 0.8) * 6.0) * 0.5 + 0.5) / z;
        p = mix(bp, p, 0.6);
        z *= 2.0;
        p *= 2.01;
        p *= m3;
    }
    return rz;
}

float sins(in float x, in float t) {
    float rz = 0.0;
    float z = 2.0;
    for (float i = 0.0; i < 3.0; i++) {
        rz += abs(fract(x * 1.4) - 0.5) / z;
        x *= 1.3;
        z *= 1.15;
        x -= t * 0.65 * z;
    }
    return rz;
}

// ---- geometry --------------------------------------------------------------

float segm(vec3 p, vec3 a, vec3 b) {
    vec3 pa = p - a;
    vec3 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) * 0.5;
}

vec3 path(in float i, in float d, in float t) {
    vec3 en = vec3(0.0, 0.0, 1.0);
    float sns2 = sins(d + i * 0.5, t) * 0.22;
    float sns  = sins(d + i * 0.6, t) * 0.21;
    en.xz *= mm2((hash11(i * 10.569) - 0.5) * 6.2 + sns2);
    en.xy *= mm2((hash11(i * 4.732) - 0.5) * 6.2 + sns);
    return en;
}

vec2 map(vec3 p, float i, float t) {
    float lp = length(p);
    vec3 bg = vec3(0.0);
    vec3 en = path(i, lp, t);

    float ins  = smoothstep(0.11, 0.46, lp);
    float outs = 0.15 + smoothstep(0.0, 0.15, abs(lp - 1.0));
    p *= ins * outs;
    float id = ins * outs;

    float rz = segm(p, bg, en) - 0.011;
    return vec2(rz, id);
}

float march(in vec3 ro, in vec3 rd, in float startf, in float maxd, in float j, in float t) {
    float precis = 0.001;
    float h = 0.5;
    float d = startf;
    for (int i = 0; i < MAX_ITER; i++) {
        if (abs(h) < precis || d > maxd) break;
        d += h * 1.2;
        float res = map(ro + rd * d, j, t).x;
        h = res;
    }
    return d;
}

// ---- volumetric ------------------------------------------------------------

vec3 vmarch(in vec3 ro, in vec3 rd, in float j, in vec3 orig, in float t) {
    vec3 p = ro;
    vec2 r = vec2(0.0);
    vec3 sum = vec3(0.0);
    float w = 0.0;
    for (int i = 0; i < VOLUMETRIC_STEPS; i++) {
        r = map(p, j, t);
        p += rd * 0.03;
        float lp = length(p);

        vec3 col = sin(vec3(1.05, 2.5, 1.52) * 3.94 + r.y) * 0.85 + 0.4;
        col.rgb *= smoothstep(0.0, 0.015, -r.x);
        col *= smoothstep(0.04, 0.2, abs(lp - 1.1));
        col *= smoothstep(0.1, 0.34, lp);
        sum += abs(col) * 5.0
             * (1.2 - noise3(vec3(lp * 2.0 + j * 13.0 + t * 5.0)) * 1.1)
             / (log(distance(p, orig) - 2.0) + 0.75);
    }
    return sum;
}

// ---- sphere intersection ---------------------------------------------------

vec2 iSphere2(in vec3 ro, in vec3 rd) {
    vec3 oc = ro;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - 1.0;
    float h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    return vec2((-b - sqrt(h)), (-b + sqrt(h)));
}

// ---- main ------------------------------------------------------------------

vec4 shader_main(EffectContext effect) {
    // UV: центрированные, с учётом аспекта.
    vec2 p = effect.texture_uv - 0.5;
    p.x *= aspect;

    float t = time * speed;

    // Камера.
    vec3 ro = vec3(0.0, 0.0, 5.0);
    vec3 rd = normalize(vec3(p * 0.7, -1.5));

    // Вращение сцены со временем (заменяет iMouse-интерактивность).
    mat2 mx = mm2(t * 0.4);
    mat2 my = mm2(t * 0.3);
    ro.xz *= mx; rd.xz *= mx;
    ro.xy *= my; rd.xy *= my;

    vec3 bro = ro;
    vec3 brd = rd;

    vec3 col = bg_color;

    // Лучи.
    for (float j = 1.0; j < rays_count + 1.0; j++) {
        ro = bro;
        rd = brd;
        mat2 mm = mm2((t * 0.1 + ((j + 1.0) * 5.1)) * j * 0.25);
        ro.xy *= mm; rd.xy *= mm;
        ro.xz *= mm; rd.xz *= mm;

        float rz = march(ro, rd, 2.5, FAR, j, t);
        if (rz >= FAR) continue;
        vec3 pos = ro + rz * rd;
        col = max(col, vmarch(pos, rd, j, bro, t));
    }

    // Отражения от сферы.
    ro = bro;
    rd = brd;
    vec2 sph = iSphere2(ro, rd);

    if (sph.x > 0.0) {
        vec3 pos  = ro + rd * sph.x;
        vec3 pos2 = ro + rd * sph.y;
        vec3 rf   = reflect(rd, pos);
        vec3 rf2  = reflect(rd, pos2);
        float nz  = (-log(abs(flow(rf  * 1.2,  t) - 0.01)));
        float nz2 = (-log(abs(flow(rf2 * 1.2, -t) - 0.01)));
        col += (0.1 * nz * nz * glow_color
              + 0.05 * nz2 * nz2 * core_color) * 0.8;
    }

    col *= 1.3;

    // Композиция с фоном обоев.
    // Если хочешь наложить плазму поверх обоев — используй tex.
    // Если хочешь чистую плазму — убери texture2D.
    vec3 bg = texture2D(tex, effect.texture_uv).rgb;
    col = max(col, bg * 0.15);

    return vec4(clamp(col, 0.0, 1.0), 1.0);
}

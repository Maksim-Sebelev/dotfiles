// "another synthwave sunset thing" — adapted for ShojiWM.
//
// Оригинал: Shadertoy, автор неизвестен (см. SHADERDATA в конце).
// Портировано: убраны iChannel0 / audio-модуляция / textureMirror,
// добавлены параметры для цвета дороги, неба, солнца, горизонта
// и скорости движения.
//
// Контракт (см. rain.ts):
//   вход:  effect.texture_uv
//          uniform float time, speed, aspect
//          uniform vec3  road_color, sky_color, sun_color, horizon_color
//   выход: vec4 RGBA

uniform float time;
uniform float speed;
uniform float aspect;
uniform vec3  road_color;
uniform vec3  sky_color;
uniform vec3  sun_color;
uniform vec3  horizon_color;

#define MARCH_STEPS 100

// ---- hash / noise -----------------------------------------------------------

float hash21(vec2 co) {
    return fract(sin(dot(co.xy, vec2(1.9898, 7.233))) * 45758.5433);
}

float amp(vec2 p) {
    return smoothstep(1., 8., abs(p.x));
}

float pow1d5(float a) {
    return a * sqrt(a);
}
float pow512(float a) {
    // a *= a; a *= a; a *= a; a *= a;
    // a *= a; a *= a; a *= a; a *= a;
    // return a * a;

    return a * a;
}

// Процедурный hash вместо textureMirror.
float hashNoise(vec2 uv) {
    return hash21(uv * 7.13);
}

// Замена textureMirror(iChannel0, ...).x — процедурный шум.
float noiseTex(vec2 uv) {
    return hashNoise(uv);
}

float round1(float v) {
    return floor(v + 0.5);
}

float edgeMin(float dx, vec2 da, vec2 db, vec2 uv) {
    uv.x += 5.;
    vec3 rounded = floor(vec3(uv, uv.x + uv.y) + 0.5);
    vec3 c = fract(rounded * (vec3(0, 1, 2) + 0.61803398875));
    float a1 = noiseTex(vec2(c.y, 0.)) > .6 ? .15 : 1.;
    float a2 = noiseTex(vec2(c.x, 0.)) > .6 ? .15 : 1.;
    float a3 = noiseTex(vec2(c.z, 0.)) > .6 ? .15 : 1.;
    return min(min((1. - dx) * db.y * a3, da.x * a2), da.y * a1);
}

float hashSurf(vec2 uv, float jTime) {
    float a = amp(uv);
    float w = a > 0.
        ? (1. - .4 * pow(a * a * a * a * a * a * a * a * a * a, 1.0))
        : 0.;
    // В оригинале pow512 — оставим как быстрое возведение в степень 512.
    // Заменяем на более дешёвое: pow1d5(hashNoise(uv)).
    return (a > 0.
        ? a * pow512(hashNoise(uv)) * w
        : 0.);
}

vec2 trinoise(vec2 uv, float jTime) {
    const float sq = sqrt(3. / 2.);
    uv.x *= sq;
    uv.y -= .5 * uv.x;
    vec2 d = fract(uv);
    uv -= d;

    bool c = dot(d, vec2(1)) > 1.;

    vec2 dd = 1. - d;
    vec2 da = c ? dd : d, db = c ? d : dd;

    float nn = hashSurf(uv + float(c), jTime);
    float n2 = hashSurf(uv + vec2(1, 0), jTime);
    float n3 = hashSurf(uv + vec2(0, 1), jTime);

    float nmid = mix(n2, n3, d.y);
    float ns = mix(nn, c ? n2 : n3, da.y);
    float dx = da.x / db.y;
    return vec2(mix(ns, nmid, dx), edgeMin(dx, da, db, uv + d));
}

vec2 map(vec3 p, float jTime) {
    vec2 n = trinoise(p.xz, jTime);
    return vec2(p.y - 2. * n.x, n.y);
}

vec3 grad(vec3 p, float jTime) {
    const vec2 e = vec2(.005, 0);
    float a = map(p, jTime).x;
    return vec3(map(p + e.xyy, jTime).x - a,
                map(p + e.yxy, jTime).x - a,
                map(p + e.yyx, jTime).x - a) / e.x;
}

vec2 intersect(vec3 ro, vec3 rd, float jTime) {
    float d = 0., h = 0.;
    for (int i = 0; i < MARCH_STEPS; i++) {
        vec3 p = ro + d * rd;
        vec2 s = map(p, jTime);
        h = s.x;
        d += h * .5;
        if (abs(h) < .003 * d) return vec2(d, s.y);
        if (d > 150. || p.y > 2.) break;
    }
    return vec2(-1);
}

void addsun(vec3 rd, vec3 ld, inout vec3 col) {
    float sun = smoothstep(.21, .2, distance(rd, ld));
    if (sun > 0.) {
        float yd = (rd.y - ld.y);
        float a = sin(3.1 * exp(-(yd) * 14.));
        sun *= smoothstep(-.8, 0., a);
        col = mix(col, sun_color * .75, sun);
    }
}

float starnoise(vec3 rd) {
    float c = 0.;
    vec3 p = normalize(rd) * 300.;
    for (float i = 0.; i < 4.; i++) {
        vec3 q = fract(p) - .5;
        vec3 id = floor(p);
        float c2 = smoothstep(.5, 0., length(q));
        c2 *= step(hash21(id.xz / id.y), .06 - i * i * 0.005);
        c += c2;
        p = p * .6 + .5 * p * mat3(3. / 5., 0, 4. / 5., 0, 1, 0, -4. / 5., 0, 3. / 5.);
    }
    c *= c;
    float g = dot(sin(rd * 10.512), cos(rd.yzx * 10.512));
    c *= smoothstep(-3.14, -.9, g) * .5 + .5 * smoothstep(-.3, 1., g);
    return c * c;
}

vec3 gsky(vec3 rd, vec3 ld, bool mask, float jTime) {
    float haze = exp2(-5. * (abs(rd.y) - .2 * dot(rd, ld)));
    float st = mask ? (starnoise(rd)) * (1. - min(haze, 1.)) : 0.;

    // В оригинале back = vec3(.4,.1,.7) * (1 - .5 * textureMirror(...)).
    // Заменяем на sky_color + процедурный шум.
    float noise = noiseTex(vec2(.5 + .05 * rd.x / max(rd.y, 1e-4), 0.));
    vec3 back = sky_color * (1. - .5 * noise
        * exp2(-.1 * abs(length(rd.xz) / max(rd.y, 1e-4)))
        * max(sign(rd.y), 0.));

    vec3 col = clamp(mix(back, horizon_color, haze) + st, 0., 1.);
    if (mask) addsun(rd, ld, col);
    return col;
}

// ---- main -------------------------------------------------------------------

vec4 shader_main(EffectContext effect) {
    vec2 uv = (2. * effect.texture_uv - 1.0);
    uv.y = -uv.y;        // инверсия Y: Shadertoy → ShojiWM
    uv.x *= aspect;
    // jTime — «время сцены», масштабируется скоростью.
    float jTime = mod(time * speed * 10.0, 4000.0);

    vec3 ro = vec3(0., 1.0, (-20000. + jTime * 10.0) * 0.001);
    // Масштабируем координаты так, чтобы сцена выглядела правильно.
    // В оригинале speed=10, ro.z = -20000 + jTime*speed, где jTime тоже
    // порядка тысяч. Здесь оставим близко к оригиналу.
    ro = vec3(0., 1.0, (-20000. + jTime * 10.0) * 0.001);

    vec3 rd = normalize(vec3(uv, 4. / 3.));

    vec2 i = intersect(ro, rd, jTime);
    float d = i.x;

    vec3 ld = normalize(vec3(0., 0.125, 1.));
    vec3 fog = d > 0. ? exp2(-d * vec3(.14, .1, .28)) : vec3(0.);
    vec3 sky = gsky(rd, ld, d < 0., jTime);

    vec3 p = ro + d * rd;
    vec3 n = normalize(grad(p, jTime));

    float diff = dot(n, ld) + .1 * n.y;
    vec3 col = road_color * diff;

    vec3 rfd = reflect(rd, n);
    vec3 rfcol = gsky(rfd, ld, true, jTime);

    col = mix(col, rfcol, .05 + .95 * pow(max(1. + dot(rd, n), 0.), 5.));

    // Оригинальный цвет поверхности — vec3(.8,.1,.92) (фиолетовый).
    // Теперь берётся из road_color.
    col = mix(col, road_color, smoothstep(.05, .0, i.y));
    col = mix(sky, col, fog);

    if (d < 0.) d = 1e6;
    d = min(d, 10.);

    // Фон: если луч не попал в поверхность (d<0), вернём sky.
    vec3 final_col = (i.x < 0.) ? sky : col;

    return vec4(clamp(final_col, 0., 1.), 1.0);
}

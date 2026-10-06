// "Drive Home" rain, adapted for ShojiWM wallpaper.
//
// Original shader: "The Drive Home" © Martijn Steinrucken aka BigWings, 2017
// LICENSE: CC BY-NC-SA 3.0. https://www.shadertoy.com/view/MdfBRX

uniform float time;
uniform float speed;
uniform float rain_amount;
uniform float aspect;
uniform float angle_deg;   // 0 = вертикально, +30 = наклон вправо, -30 = влево

float S(float x, float y, float z) { return smoothstep(x, y, z); }
float sat(float x) { return clamp(x, 0.0, 1.0); }

float N(float t) {
    return fract(sin(t * 10234.324) * 123423.23512);
}

vec3 N31(float p) {
    vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec3((p3.x + p3.y) * p3.z,
                      (p3.x + p3.z) * p3.y,
                      (p3.y + p3.z) * p3.x));
}

float N2(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float SawTooth(float t) {
    return cos(t + cos(t)) + sin(2. * t) * .2 + sin(4. * t) * .02;
}

float DeltaSawTooth(float t) {
    return 0.4 * cos(2. * t) + 0.08 * cos(4. * t)
         - (1. - sin(t)) * sin(t + cos(t));
}

// Возвращает UV-смещение от капель. Работает в той системе координат,
// которая ему передана. При angle_deg = 0 — «вертикальная» система,
// как в оригинале.
vec2 GetDrops(vec2 uv, float seed, float m) {
    float t = time * speed + m * 30.;
    vec2 o = vec2(0.);

    // Падение вниз в локальной (уже повёрнутой) системе.
    uv.y += t * .05;

    uv *= vec2(10., 2.5) * 2.;
    vec2 id = floor(uv);
    vec3 n = N31(id.x + (id.y + seed) * 546.3524);
    vec2 bd = fract(uv);

    vec2 uv2 = bd;
    bd -= .5;
    bd.y *= 4.;
    bd.x += (n.x - .5) * .6;

    t += n.z * 6.28;
    float slide = SawTooth(t);

    float ts = 1.5;
    vec2 trailPos = vec2(bd.x * ts,
                         (fract(bd.y * ts * 2. - t * 2.) - .5) * .5);

    bd.y += slide * 2.;

    float dropShape = bd.x * bd.x;
    dropShape *= DeltaSawTooth(t);
    bd.y += dropShape;

    float d = length(bd);

    float trailMask = S(-.2, .2, bd.y);
    trailMask *= bd.y;
    float td = length(trailPos * max(.5, trailMask));

    float mainDrop = S(.2, .1, d);
    float dropTrail = S(.1, .02, td);

    dropTrail *= trailMask;
    o = mix(bd * mainDrop, trailPos, dropTrail);

    return o;
}

vec4 shader_main(EffectContext effect) {
    // UV в «экранных» пропорциях, центрированные.
    vec2 uv = effect.texture_uv - .5;
    uv.x *= aspect;

    // Матрица поворота на angle_deg. При 0 — единичная.
    float a = radians(angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rot = mat2(ca, -sa, sa, ca);
    mat2 inv_rot = mat2(ca, sa, -sa, ca);

    // Капли считаем в повёрнутой системе. Внутри GetDrops падение
    // остаётся "вниз", но "низ" здесь — вдоль направления дождя.
    vec2 rot_uv = rot * uv;

    vec2 offs = vec2(0.);
    offs += GetDrops(rot_uv, 1., rain_amount);
    offs += GetDrops(rot_uv * 1.4, 10., rain_amount);
    offs += GetDrops(rot_uv * 2.4, 25., rain_amount);

    // Возвращаем смещение в исходную систему координат,
    // чтобы применить его к настоящему UV фона.
    offs = inv_rot * offs;

    // Лёгкая рябь. Считаем в исходной системе — она не зависит от наклона.
    float ripple = sin(time + uv.y * 3.1415 * 30. + uv.x * 124.) * .5 + .5;
    ripple *= .005 * rain_amount;
    offs += vec2(ripple * ripple, ripple);

    // Искажение фона.
    vec2 sampleUV = effect.texture_uv + offs * 0.5;

    vec3 col = texture2D(tex, sampleUV).rgb;

    // Виньетка.
    vec2 v = effect.texture_uv - .5;
    col *= 1. - dot(v, v) * .25;

    return vec4(col, 0.5);
}

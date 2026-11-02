// Feedback pass for Jupiter clouds simulation.
// Процедурная текстура Юпитера (без таблиц 16×16 — они не работают
// в GLSL ES 1.00, где array constructors запрещены).
// dFdx/dFdy заменены на конечные разности.

uniform float time;
uniform float aspect;
uniform float first_frame;

#define PI 3.141592653589793

// ---- noise ------------------------------------------------------------------

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float simplexNoise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash2(i + 0.0)),
                                   dot(b, hash2(i + o)),
                                   dot(c, hash2(i + 1.0)));
    return dot(n, vec3(70.0));
}

float noiseChannel(vec2 uv) {
    return simplexNoise(uv * 4.0) * 0.5 + 0.5;
}

vec2 QuakeLavaUV(vec2 coords, float amplitude, float speed, float frequency, float t) {
    float scaledTime = t * speed;
    vec2 scaledCoords = coords * frequency;
    float x = sin(scaledTime + scaledCoords.x) * amplitude;
    float y = sin(scaledTime + scaledCoords.y) * amplitude;
    return coords + vec2(y, x);
}

// ---- Процедурная текстура Юпитера -------------------------------------------
// Полосы как в 16×16 таблице оригинала, но с fbm-турбулентностью.
vec3 jupiterTexture(vec2 uv) {
    float v = uv.y;

    // Полосы: 4 частоты.
    float band1 = sin(v * PI * 8.0);
    float band2 = sin(v * PI * 14.0 + 0.7);
    float band3 = sin(v * PI * 22.0 + 1.3);
    float band4 = sin(v * PI * 31.0 + 2.1);

    float stripes = band1 * 0.45 + band2 * 0.30 + band3 * 0.15 + band4 * 0.10;
    stripes = stripes * 0.5 + 0.5;

    // fbm-турбулентность.
    float turb = 0.0;
    turb += simplexNoise(uv * 8.0) * 0.5;
    turb += simplexNoise(uv * 16.0) * 0.25;
    turb += simplexNoise(uv * 32.0) * 0.125;
    turb = turb * 0.5 + 0.5;

    float v2 = clamp(stripes * 0.75 + turb * 0.25, 0.0, 1.0);

    // Палитра из таблицы.
    vec3 colDark   = vec3(0.35, 0.16, 0.08);
    vec3 colMid    = vec3(0.60, 0.42, 0.30);
    vec3 colLight  = vec3(0.85, 0.72, 0.58);
    vec3 colBright = vec3(0.98, 0.92, 0.82);

    vec3 col = mix(colDark, colMid, smoothstep(0.0, 0.4, v2));
    col = mix(col, colLight, smoothstep(0.4, 0.7, v2));
    col = mix(col, colBright, smoothstep(0.7, 1.0, v2));

    return col;
}

// ---- main -------------------------------------------------------------------

vec4 shader_main(EffectContext effect) {
    vec2 uv = effect.texture_uv;
    uv.x *= aspect;

    if (first_frame > 0.5) {
        return vec4(jupiterTexture(uv), 1.0);
    }

    float t = time;

    float sourceNoise = noiseChannel(uv + vec2(-0.03, 0.0) * t);
    float sourceMask = clamp(((sourceNoise - 0.5) * 10.0) + 0.5, 0.0, 1.0);

    vec2 dotsUV = QuakeLavaUV(uv, 0.01, 4.0, 37.699, t);
    float dotsA = pow(noiseChannel(dotsUV * 3.0 + t * vec2(-0.1, -0.1)), 5.5);
    float dotsB = pow(noiseChannel(-dotsUV * 5.0 + t * vec2(0.1, 0.1)), 5.5);
    float dots = max(dotsA, dotsB);

    // turbulenceA — конечные разности вместо dFdx/dFdy.
    vec2 turbulenceUVA = QuakeLavaUV(uv, 0.005, 2.0, 37.699, t);
    float eps = 0.001;
    float nA0 = simplexNoise(turbulenceUVA * 6.0 + vec2(t * 1.0, 0.0));
    float nAdx = simplexNoise((turbulenceUVA + vec2(eps, 0.0)) * 6.0 + vec2(t * 1.0, 0.0));
    float nAdy = simplexNoise((turbulenceUVA + vec2(0.0, eps)) * 6.0 + vec2(t * 1.0, 0.0));
    vec2 turbulenceA = vec2((nAdy - nA0) / eps, -(nAdx - nA0) / eps);

    vec2 turbulenceUVB = QuakeLavaUV(uv, 0.002, 4.0, 157.079, t);
    float nB0 = noiseChannel(turbulenceUVB + t * vec2(-0.05, 0.0));
    float nBdx = noiseChannel((turbulenceUVB + vec2(eps, 0.0)) + t * vec2(-0.05, 0.0));
    float nBdy = noiseChannel((turbulenceUVB + vec2(0.0, eps)) + t * vec2(-0.05, 0.0));
    vec2 turbulenceB = vec2((nBdy - nB0) / eps, -(nBdx - nB0) / eps);

    vec2 combinedVelocity = turbulenceA * 0.015
                          + turbulenceB * 0.004
                          + vec2(sin(uv.y * 40.0) + 1.5, 0.0) * 0.0006;

    vec3 previousFrame = texture2D(tex, effect.texture_uv + combinedVelocity).rgb;

    // Две «фазы» Юпитера — A и B, смешиваются по sourceMask.
    vec3 jA = jupiterTexture(uv + vec2(t * 0.005, 0.0));
    vec3 jB = jupiterTexture(uv * 1.7 + vec2(t * 0.003, 0.1));
    vec3 sourceColor = mix(jA, jB, sourceMask);

    vec3 mixed = mix(previousFrame, sourceColor, dots * 0.04 + 0.02);
    mixed = clamp(mixed, 0.0, 1.0);

    return vec4(mixed, 1.0);
}

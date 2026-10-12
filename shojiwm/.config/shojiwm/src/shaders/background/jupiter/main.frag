// Final Jupiter scene: планета + Ио + звёзды + туманность + overlay.
//
// ВАЖНО: читаем Юпитер и Ио из state (stateTexture, заполняется
// jupiter-feedback.frag), а НЕ из tex. tex — это обои слоя,
// которые не должны попадать внутрь сферы.

uniform float time;
uniform float aspect;
uniform float spin_speed;
uniform vec3  jupiter_color;
uniform vec3  io_color;
uniform vec3  nebula_color;
uniform vec3  stars_color;
uniform sampler2D state;   // ← state из renderTo в jupiter.ts

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

// ---- сфера и UV -------------------------------------------------------------

vec4 generateSphereSurfaceWithMask(vec2 uv, float radius) {
    float radiusSquared = radius * radius;
    float uvLengthSquared = dot(uv, uv);
    float uvLength = sqrt(uvLengthSquared);
    float mask = step(uvLength, radius);
    vec3 surface;
    if (mask > 0.0) {
        surface = vec3(uv / radius, sqrt(max(radiusSquared - uvLengthSquared, 0.0)));
    } else {
        surface = vec3(uv / max(uvLength, 1e-4), uvLength - radius);
    }
    return vec4(surface, mask);
}

vec2 generateSphericalUV(vec3 position, float spin) {
    float width = sqrt(max(1.0 - position.y * position.y, 1e-4));
    float generatrixX = position.x / width;
    vec2 generatrix = vec2(generatrixX, position.y);
    vec2 uv = asin(clamp(generatrix, vec2(-1.0), vec2(1.0))) / PI
            + vec2(0.5 + spin, 0.5);
    return uv;
}

mat3 createRotationMatrix(float pitch, float roll) {
    float cosPitch = cos(pitch);
    float sinPitch = sin(pitch);
    float cosRoll = cos(roll);
    float sinRoll = sin(roll);
    return mat3(
        cosRoll, -sinRoll * cosPitch, sinRoll * sinPitch,
        sinRoll, cosRoll * cosPitch, -cosRoll * sinPitch,
        0.0, sinPitch, cosPitch
    );
}

// ---- атмосфера --------------------------------------------------------------

vec4 atmosphere(vec4 sphereSurfaceWithMask, vec3 lightDirection,
                vec3 atmosphereColor, float haloWidth,
                float minAtmosphere, float maxAtmosphere, float falloff) {
    vec3 absorbtion = vec3(2.0, 3.0, 4.0);
    float inverseWidth = 1.0 / haloWidth;
    float fresnelBlend = pow(1.0 - sphereSurfaceWithMask.z, falloff);
    float amount = mix(minAtmosphere, maxAtmosphere, fresnelBlend);
    vec3 normal = sphereSurfaceWithMask.xyz;
    if (sphereSurfaceWithMask.w < 0.5) {
        float haloBlend = pow(max(1.0 - sphereSurfaceWithMask.z * inverseWidth, 0.0), 5.0);
        amount = haloBlend * maxAtmosphere;
        normal = vec3(sphereSurfaceWithMask.xy, 0.0);
    }
    float light = max((dot(normal, lightDirection) + 0.3) / 1.3, 0.0);
    vec3 absorbedLight = vec3(pow(light, absorbtion.x),
                              pow(light, absorbtion.y),
                              pow(light, absorbtion.z));
    return vec4(absorbedLight * atmosphereColor, amount);
}

// ---- QuakeLavaUV ------------------------------------------------------------

vec2 QuakeLavaUV(vec2 coords, float amplitude, float speed, float frequency, float t) {
    float scaledTime = t * speed;
    vec2 scaledCoords = coords * frequency;
    float x = sin(scaledTime + scaledCoords.x) * amplitude;
    float y = sin(scaledTime + scaledCoords.y) * amplitude;
    return coords + vec2(y, x);
}

// ---- звёзды / туманность ----------------------------------------------------

vec3 starsTexture(vec2 uv) {
    vec2 grid = uv * 100.0;
    vec2 id = floor(grid);
    vec2 gv = fract(grid) - 0.5;
    float rnd = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);
    float bright = step(0.93, rnd) * (0.5 + 0.5 * rnd);
    float d = length(gv);
    float star = bright * smoothstep(0.5, 0.0, d * 10.0);
    star *= 0.7 + 0.3 * sin(time * 3.0 + rnd * 100.0);
    return vec3(star);
}

vec3 nebulaTexture(vec2 uv) {
    vec2 warped = QuakeLavaUV(uv, 0.04, 0.06, 13.0, time);
    float n = simplexNoise(warped * 4.0) * 0.5 + 0.5;
    float n2 = simplexNoise(warped * 8.0 + 17.3) * 0.5 + 0.5;
    float neb = pow(n * n2, 2.0);
    return vec3(neb);
}

// ---- main -------------------------------------------------------------------

vec4 shader_main(EffectContext effect) {
    vec2 uv = effect.texture_uv;
    uv -= 0.5;
    uv.x *= aspect;
    uv.y = -uv.y;

    vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.8));

    // ---- Фон: звёзды + туманность ----
    vec3 stars = starsTexture(uv * 1.5) * stars_color * 3.0;
    vec3 nebulaTex = nebulaTexture(uv);
    float nebulaFade = pow(max(1.0 - length(uv) * 1.2, 0.0), 1.5);
    vec3 nebula = nebulaTex * nebulaFade * nebula_color * 0.6;
    vec3 background = stars + nebula;

    // ---- Jupiter ----
    vec4 jupiterSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(0.2, 0.15), 0.6);
    float jupiterLight = pow(max(dot(lightDirection, jupiterSurfaceWithMask.xyz), 0.0), 0.8);
    vec4 jupiterAtmosphere = atmosphere(jupiterSurfaceWithMask, lightDirection,
                                        vec3(1.0, 0.7, 0.4) * 3.0,
                                        0.2, 0.05, 0.6, 2.0);
    float jupiterMask = clamp(jupiterSurfaceWithMask.w, 0.0, 1.0);

    mat3 jupiterRotationMatrix = createRotationMatrix(-0.2, 0.3);
    vec3 rotatedJupiter = jupiterRotationMatrix * (jupiterSurfaceWithMask.xyz * jupiterMask);
    vec2 jupiterUV = generateSphericalUV(rotatedJupiter, time * spin_speed * 0.02);

    // ВАЖНО: читаем из state, а не из tex — иначе обои попадут внутрь.
    vec3 jupiterTex = texture2D(state, fract(jupiterUV * 2.2 + vec2(0.0, 0.8))).rgb;
    jupiterTex *= jupiter_color;

    // ---- Io ----
    vec4 ioSurfaceWithMask = generateSphereSurfaceWithMask(uv + vec2(-0.32, -0.2), 0.07);
    float ioLight = pow(max(dot(lightDirection, ioSurfaceWithMask.xyz), 0.0), 0.4);
    vec4 ioAtmosphere = atmosphere(ioSurfaceWithMask, lightDirection,
                                   vec3(1.0, 0.9, 0.8) * 1.5,
                                   0.06, 0.03, 1.0, 4.0);
    float ioMask = clamp(ioSurfaceWithMask.w, 0.0, 1.0);

    mat3 ioRotationMatrix = createRotationMatrix(0.4, -0.1);
    vec3 rotatedIo = ioRotationMatrix * (ioSurfaceWithMask.xyz * ioMask);
    vec2 ioUV = generateSphericalUV(rotatedIo, -time * spin_speed * 0.05);
    // Тоже из state.
    vec3 ioTexSample = texture2D(state, fract(ioUV + vec2(0.0, 0.8))).rgb;
    ioTexSample = vec3(min(pow(1.0 - ioTexSample.x, 5.5) * 2.0, 1.0)) * io_color;

    // ---- Combining ----
    vec3 jupiterWithBackground = mix(background, jupiterTex * jupiterLight, jupiterMask);
    vec3 jupiterWithAtmosphere = mix(jupiterWithBackground, jupiterAtmosphere.xyz, jupiterAtmosphere.w);
    vec3 jupiterWithIo = mix(jupiterWithAtmosphere, ioTexSample * ioLight, ioMask);
    vec3 finalScene = mix(jupiterWithIo, ioAtmosphere.xyz, ioAtmosphere.w);

    // ---- Overlay ----
    vec2 overlayUV = effect.texture_uv;
    vec3 overlayColor = mix(vec3(0.3), vec3(0.9), pow(overlayUV.x, 1.7))
                      * vec3(1.0, 0.35, 0.1) * 1.4;
    vec3 imageWithOverlay = mix(finalScene, overlayColor,
                                pow(1.0 - overlayUV.y * 0.5, 5.0) * 0.7 + 0.1);

    return vec4(imageWithOverlay, 1.0);
}

// Raindrops on glass, adapted for ShojiWM.
//
// Based on "Raindrops on glass" by YeHaike (https://www.shadertoy.com/view/DdKyR1),
// which in turn references "Heartfelt" by Martijn Steinrucken (BigWings).
// YeHaike's license: NonCommercial, No Copy, No Modify. This port keeps the
// same non-commercial, no-copy, no-modify terms.
//
// Адаптация под ShojiWM:
//   - iChannel0 → tex (backdropSource / layerSource)
//   - iResolution → aspect + effect.texture_uv
//   - textureLod(..., Blur) → texture2D(tex, UVWithNormal) (без mip-blur);
//     размытие даёт dualKawaseBlur в pipeline.
//   - iTime → time * speed
//   - NumberScaleOf* → привязаны к rain_amount
//   - mat4x3 → явная сумма (в GLSL ES 1.00 нет mat4x3)
//
// Контракт (см. rain.ts):
//   вход:  tex — то, что за стеклом
//          effect.texture_uv
//          uniform float time, speed, rain_amount, aspect, angle_deg
//          uniform float streak_length, splashes
//   выход: vec4 RGBA

uniform float time;
uniform float speed;
uniform float rain_amount;
uniform float aspect;
uniform float angle_deg;
uniform float streak_length;
uniform float splashes;

// ---- настройки (из оригинала) ----------------------------------------------

#define RandomSeed 4.3315
#define NumberScaleOfStaticRaindrops   0.35
#define NumberScaleOfRollingRaindrops  0.35
#define StaticRaindropUVScale          20.0
#define RollingRaindropUVScaleLayer01  2.25

// ---- 3D OpenSimplex2S noise с производными ---------------------------------
// Output: vec4(dF/dx, dF/dy, dF/dz, value)

vec4 permute(vec4 t) {
    return t * (t * 34.0 + 133.0);
}

vec3 grad(float hash) {
    vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
    vec3 cuboct = cube;
    cuboct[int(hash / 16.0)] = 0.0;
    float type = mod(floor(hash / 8.0), 2.0);
    vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
    vec3 g = cuboct * 1.22474487139 + rhomb;
    g *= (1.0 - 0.042942436724648037 * type) * 3.5946317686139184;
    return g;
}

vec4 os2NoiseWithDerivativesPart(vec3 X) {
    vec3 b = floor(X);
    vec4 i4 = vec4(X - b, 2.5);

    vec3 v1 = b + floor(dot(i4, vec4(.25)));
    vec3 v2 = b + vec3(1, 0, 0) + vec3(-1, 1, 1) * floor(dot(i4, vec4(-.25, .25, .25, .35)));
    vec3 v3 = b + vec3(0, 1, 0) + vec3(1, -1, 1) * floor(dot(i4, vec4(.25, -.25, .25, .35)));
    vec3 v4 = b + vec3(0, 0, 1) + vec3(1, 1, -1) * floor(dot(i4, vec4(.25, .25, -.25, .35)));

    vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
    hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
    hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);

    vec3 d1 = X - v1; vec3 d2 = X - v2; vec3 d3 = X - v3; vec3 d4 = X - v4;
    vec4 a = max(0.75 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
    vec4 aa = a * a;
    vec4 aaaa = aa * aa;
    vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
    vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
    vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));

    // Derivatives of the noise.
    // Оригинал: -8.0 * mat4x3(d1,d2,d3,d4) * (aa*a*extrapolations)
    //           + mat4x3(g1,g2,g3,g4) * aaaa
    // mat4x3 в GLSL ES 1.00 отсутствует, поэтому раскрываем в явную сумму.
    vec3 term1 = d1 * (aa.x * a.x * extrapolations.x)
               + d2 * (aa.y * a.y * extrapolations.y)
               + d3 * (aa.z * a.z * extrapolations.z)
               + d4 * (aa.w * a.w * extrapolations.w);

    vec3 term2 = g1 * aaaa.x
               + g2 * aaaa.y
               + g3 * aaaa.z
               + g4 * aaaa.w;

    vec3 derivative = -8.0 * term1 + term2;

    return vec4(derivative, dot(aaaa, extrapolations));
}

vec4 os2NoiseWithDerivatives_ImproveXY(vec3 X) {
    mat3 orthonormalMap = mat3(
        0.788675134594813, -0.211324865405187, -0.577350269189626,
        -0.211324865405187, 0.788675134594813, -0.577350269189626,
        0.577350269189626, 0.577350269189626, 0.577350269189626);
    X = orthonormalMap * X;
    vec4 result = os2NoiseWithDerivativesPart(X) + os2NoiseWithDerivativesPart(X + 144.5);
    return vec4(result.xyz * orthonormalMap, result.w);
}

// ---- helpers ----------------------------------------------------------------

float GradientWave(float b, float t) {
    return smoothstep(0., b, t) * smoothstep(1., b, t);
}

float Random(vec2 UV, float Seed) {
    return fract(sin(dot(UV.xy * 13.235, vec2(12.9898, 78.233)) * 0.000001) * 43758.5453123 * Seed);
}

vec3 RandomVec3(vec2 UV, float Seed) {
    return vec3(Random(UV, Seed), Random(UV * 2.0, Seed), Random(UV * 3.0, Seed));
}

float MapToRange(float edge0, float edge1, float x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

float ProportionalMapToRange(float edge0, float edge1, float x) {
    return edge0 + (edge1 - edge0) * x;
}

// ---- RaindropSurface ---------------------------------------------------------
// Уравнение капли YeHaike: возвращает (height, ∂z/∂x, ∂z/∂y).

vec3 RaindropSurface(vec2 XY, float DistanceScale, float ZScale) {
    float A = DistanceScale;
    float x = XY.x;
    float y = XY.y;
    float N = 1.5;
    float M = 0.5;
    float S = ZScale;

    float TempZ = 1.0 - pow(x / A, 2.0) - pow(y / A, 2.0);
    float Z = pow(max(TempZ, 0.0), A / 2.0);
    float ZInMAndN = (Z - M) / (N - M);
    float t = min(max(ZInMAndN, 0.0), 1.0);

    float Height = S * t * t * (3.0 - 2.0 * t);

    float Part01 = S * (6.0 * t - 8.0 * t * t);
    float Part02 = 1.0 / (N - M);
    float Part03 = -1.0 / A * pow(max(TempZ, 1e-4), A / 2.0 - 1.0);

    float TempValue = (ZInMAndN > 0.0 && ZInMAndN < 1.0) ? Part01 * Part02 : 0.0;

    vec2 PD = Height > 0.0 ? vec2(TempValue * Part03 * x, TempValue * Part03 * y)
                           : vec2(0.0, 0.0);
    return vec3(Height, PD);
}

// ---- StaticRaindrops --------------------------------------------------------

vec3 StaticRaindrops(vec2 UV, float Time, float UVScale) {
    vec2 TempUV = UV * UVScale;

    vec2 ID = floor(TempUV);
    vec3 RandomValue = RandomVec3(vec2(ID.x * 470.15, ID.y * 653.58), RandomSeed);
    TempUV = fract(TempUV) - 0.5;
    vec2 RandomPoint = (RandomValue.xy - 0.5) * 0.25;
    vec2 XY = RandomPoint - TempUV;
    float Distance = length(TempUV - RandomPoint);

    vec3 X = vec3(vec2(TempUV.x * 305.0 * 0.02, TempUV.y * 305.0 * 0.02), 1.8660254037844386);
    vec4 noiseResult = os2NoiseWithDerivatives_ImproveXY(X);
    float EdgeRandomCurveAdjust = noiseResult.w * mix(0.02, 0.175, fract(RandomValue.x));

    Distance = EdgeRandomCurveAdjust * 0.5 + Distance;
    Distance = Distance * clamp(mix(1.0, 55.0, RandomPoint.x), 1.0, 3.0);
    float Height = smoothstep(.2, 0., Distance);

    float GradientFade = GradientWave(.0005, fract(Time * 0.02 + RandomValue.z));

    float DistanceMaxRange = 1.45 * GradientFade;
    vec2 Direction = (TempUV - RandomPoint);

    float Theta = 3.141592653 - acos(dot(normalize(Direction + vec2(1e-5)), vec2(0.0, 1.0)));
    Theta = Theta * RandomValue.z;
    float DistanceScale = 0.2 / (1.0 - 0.8 * cos(Theta - 3.141593 / 2.0 - 1.6));
    float YDistance = length(vec2(0.0, TempUV.y) - vec2(0.0, RandomPoint.y));

    float Scale = 1.65 * (0.2 + DistanceScale) * DistanceMaxRange * mix(1.5, 0.5, RandomValue.x);
    vec2 TempXY = vec2(XY.x, XY.y) * 4.0;
    float RandomScale = ProportionalMapToRange(0.85, 1.35, RandomValue.z);
    TempXY.x = RandomScale * mix(TempXY.x,
                                 TempXY.x / smoothstep(1.0, 0.4, YDistance * RandomValue.z),
                                 smoothstep(1.0, 0.0, RandomValue.x));
    TempXY = TempXY + EdgeRandomCurveAdjust;
    vec3 HeightAndNormal = RaindropSurface(TempXY, Scale, 1.0);
    HeightAndNormal.yz = -HeightAndNormal.yz;

    // rain_amount управляет плотностью.
    float threshold = mix(1.0, 0.0, rain_amount * NumberScaleOfStaticRaindrops * 2.857);
    float RandomVisible = (fract(RandomValue.z * 10.0 * RandomSeed) < threshold) ? 1.0 : 0.0;
    HeightAndNormal.yz *= RandomVisible;
    HeightAndNormal.x = smoothstep(0.0, 1.0, HeightAndNormal.x) * RandomVisible;

    return HeightAndNormal;
}

// ---- RollingRaindrops -------------------------------------------------------

vec4 RollingRaindrops(vec2 UV, float Time, float UVScale) {
    vec2 LocalUV = UV * UVScale;
    vec2 TempUV = LocalUV;

    vec2 ConstantA = vec2(6.0, 1.0);
    vec2 GridNum = ConstantA * 2.0;
    vec2 GridID = floor(LocalUV * GridNum);

    float RandomFloat = Random(vec2(GridID.x * 131.26, GridID.x * 101.81), RandomSeed);

    float TimeMovingY = Time * 0.85 * ProportionalMapToRange(0.1, 0.25, RandomFloat);
    LocalUV.y += TimeMovingY;
    float YShift = RandomFloat;
    LocalUV.y += YShift;

    vec2 ScaledUV = LocalUV * GridNum;
    GridID = floor(ScaledUV);
    vec3 RandomValue3 = RandomVec3(vec2(GridID.x * 17.32, GridID.y * 2217.54), RandomSeed);

    vec2 GridUV = fract(ScaledUV) - vec2(0.5, 0.0);

    float SwingX = RandomValue3.x - 0.5;

    float SwingY = TempUV.y * 20.0;
    float SwingPosition = sin(SwingY + sin(GridID.y * RandomValue3.z + SwingY) + GridID.y * RandomValue3.z);
    SwingX += SwingPosition * (0.5 - abs(SwingX)) * (RandomValue3.z - 0.5);
    SwingX *= 0.65;
    float RandomNormalizedTime = fract(TimeMovingY + RandomValue3.z);
    SwingY = (GradientWave(0.87, RandomNormalizedTime) - 0.5) * 0.9 + 0.5;
    SwingY = clamp(SwingY, 0.15, 0.85);
    vec2 Position = vec2(SwingX, SwingY);

    vec2 XY = Position - GridUV;
    vec2 Direction = (GridUV - Position) * ConstantA.yx;
    float Distance = length(Direction);

    vec3 X = vec3(vec2(TempUV.x * 513.20 * 0.02, TempUV.y * 779.40 * 0.02), 2.1660251037743386);
    vec4 NoiseResult = os2NoiseWithDerivatives_ImproveXY(X);
    float EdgeRandomCurveAdjust = NoiseResult.w * mix(0.02, 0.175, fract(RandomValue3.y));

    Distance = EdgeRandomCurveAdjust + Distance;

    float DistanceMaxRange = 1.45;
    float Theta = 3.141592653 - acos(dot(normalize(Direction + vec2(1e-5)), vec2(0.0, 1.0)));
    Theta = Theta * RandomValue3.z;
    float DistanceScale = 0.2 / (1.0 - 0.8 * cos(Theta - 3.141593 / 2.0 - 1.6));
    float Scale = 1.65 * (0.2 + DistanceScale) * DistanceMaxRange * mix(1.0, 0.25, RandomValue3.x);
    vec2 TempXY = vec2(XY.x, XY.y) * 4.0;
    float RandomScale = ProportionalMapToRange(0.85, 1.35, RandomValue3.z);
    TempXY = TempXY * vec2(1.0, 4.2) + EdgeRandomCurveAdjust * 0.85;
    vec3 HeightAndNormal = RaindropSurface(TempXY, Scale, 1.0);

    // Trail
    float TrailY = pow(smoothstep(1.0, SwingY, GridUV.y), 0.5);
    float TrailX = abs(GridUV.x - SwingX) * mix(0.8, 4.0, smoothstep(0.0, 1.0, RandomValue3.x));
    float Trail = smoothstep(0.25 * TrailY, 0.15 * TrailY * TrailY, TrailX);
    float TrailClamp = smoothstep(-0.02, 0.02, GridUV.y - SwingY);
    Trail *= TrailClamp * TrailY;

    float SignOfTrailX = sign(GridUV.x - SwingX);
    vec3 NoiseInput = vec3(vec2(TempUV.x * 513.20 * 0.02 * SignOfTrailX, TempUV.y * 779.40 * 0.02), 2.1660251037743386);
    vec4 TrailNoiseResult = os2NoiseWithDerivatives_ImproveXY(NoiseInput);
    float TrailEdgeRandomCurveAdjust = TrailNoiseResult.w * mix(0.002, 0.175, fract(RandomValue3.y));
    float TrailXDistance = MapToRange(0.0, 0.1, TrailEdgeRandomCurveAdjust * 0.5 + TrailX);
    vec2 TrailDirection = SignOfTrailX * vec2(1.0, 0.0) + vec2(0.0, 1.0) * smoothstep(1.0, 0.0, Trail) * 0.5;
    vec2 TrailXY = TrailDirection * TrailXDistance;

    vec3 TrailHeightAndNormal = RaindropSurface(TrailXY, 1.0, 1.0);
    TrailHeightAndNormal = TrailHeightAndNormal * pow(Trail * RandomValue3.y, 2.0);
    TrailHeightAndNormal.x = smoothstep(0.0, 1.0, TrailHeightAndNormal.x);

    SwingY = TempUV.y;
    float RemainTrail = smoothstep(0.2 * TrailY, 0.0, TrailX);
    float RemainDroplet = max(0.0, (sin(SwingY * (1.0 - SwingY) * 120.0) - GridUV.y)) * RemainTrail * TrailClamp * RandomValue3.z;
    SwingY = fract(SwingY * 10.0) + (GridUV.y - 0.5);
    vec2 RemainDropletXY = GridUV - vec2(SwingX, SwingY);
    RemainDropletXY = RemainDropletXY * vec2(1.2, 0.8);
    RemainDropletXY = RemainDropletXY + EdgeRandomCurveAdjust * 0.85;
    vec3 RemainDropletHeightAndNormal = RaindropSurface(RemainDropletXY, 2.0 * RemainDroplet, 1.0);
    RemainDropletHeightAndNormal.x = smoothstep(0.0, 1.0, RemainDropletHeightAndNormal.x);
    RemainDropletHeightAndNormal = TrailHeightAndNormal.x > 0.0
        ? vec3(0.0) : RemainDropletHeightAndNormal;

    vec4 ReturnValue;
    ReturnValue.x = HeightAndNormal.x
                  + TrailHeightAndNormal.x * TrailY * TrailClamp
                  + RemainDropletHeightAndNormal.x * TrailY * TrailClamp;
    ReturnValue.yz = HeightAndNormal.yz + TrailHeightAndNormal.yz + RemainDropletHeightAndNormal.yz;
    ReturnValue.w = Trail;

    float threshold = mix(1.0, 0.0, rain_amount * NumberScaleOfRollingRaindrops * 2.857);
    float RandomVisible = (fract(RandomValue3.z * 20.0 * RandomSeed) < threshold) ? 1.0 : 0.0;
    return ReturnValue * RandomVisible;
}

// ---- Raindrops (общая сборка) ----------------------------------------------

vec4 Raindrops(vec2 UV, float Time, float UVScale00, float UVScale01) {
    vec3 StaticRaindrop = StaticRaindrops(UV, Time, UVScale00);
    vec4 RollingRaindrop01 = RollingRaindrops(UV, Time, UVScale01);

    float Height = StaticRaindrop.x + RollingRaindrop01.x;
    vec2 Normal = StaticRaindrop.yz + RollingRaindrop01.yz;
    float Trail = RollingRaindrop01.w;
    return vec4(Height, Normal, Trail);
}

vec4 shader_main(EffectContext effect) {
    vec2 GlobalUV = effect.texture_uv;
    vec2 LocalUV = (effect.texture_uv - 0.5);
    LocalUV.x *= aspect;

    float a = radians(-angle_deg);
    float ca = cos(a);
    float sa = sin(a);
    mat2 rotM = mat2(ca, -sa, sa, ca);
    LocalUV = rotM * LocalUV;

    float Time = - time * speed;

    vec4 Raindrop = Raindrops(LocalUV, Time,
        StaticRaindropUVScale, RollingRaindropUVScaleLayer01);

    float RaindropHeight = Raindrop.x;
    float RaindropTrail = Raindrop.w;
    vec2 RaindropNormal = -Raindrop.yz;
    RaindropNormal = RaindropHeight > 0.0 ? RaindropNormal * 0.15 : vec2(0.0);

    // Возвращаем нормаль в исходную систему координат.
    RaindropNormal = (RaindropHeight > 0.0) ? (rotM * RaindropNormal) : vec2(0.0);

    vec2 UVWithNormal = GlobalUV + RaindropNormal;

    float EdgeColorScale = smoothstep(0.2, 0.0, length(RaindropNormal));
    EdgeColorScale = RaindropHeight > 0.0
        ? pow(EdgeColorScale, 0.5) * 0.2 + 0.8 : 1.0;
    EdgeColorScale = pow(EdgeColorScale, 0.85);

    vec3 FinalColor = texture2D(tex, UVWithNormal).rgb * EdgeColorScale;

    // Лёгкая виньетка.
    vec2 v = effect.texture_uv - 0.5;
    FinalColor *= 1.0 - dot(v, v) * 0.2;

    return vec4(FinalColor, 0.5);
}

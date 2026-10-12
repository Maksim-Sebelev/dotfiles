// import {
//   COMPOSITOR,
//   compileEffect,
//   compileLayerEffect,
//   dualKawaseBlur,
//   backdropSource,
//   layerSource,
//   loadShader,
//   renderTo,
//   shaderStage,
//   signal,
//   stateSource,
//   stateTexture,
//   type WaylandWindow,
// } from "shoji_wm";
// import type { LayerEffectHandle } from "shoji_wm/types";
// import { acquireClock } from "./../system/animation-clock";

// const clock = acquireClock();

// interface RainInstance {
//   effect: LayerEffectHandle;
// }

// const instances = new Map<string, RainInstance>();

// export enum BackgroundAnimation {
//   Nothing,
//   BlurOnly,
//   Rain_1, Rain_2, Rain_3, Rain_4,
//   Synthway_day, Synthway_night,
//   Jupiter,
// }

// export function backgroundAnimation(outputName: string, animation: BackgroundAnimation): LayerEffectHandle {
//   let instance = instances.get(outputName);
//   if (!instance) {
//     instance = createInstance(outputName, animation);
//     instances.set(outputName, instance);
//   }
//   return instance.effect;
// }

// const RAIN_STREAK_LENGTH = 10;
// const RAIN_SPLASHES = 1.0;

// function createInstance(_outputName: string, animation: BackgroundAnimation): RainInstance {
//   if (animation === BackgroundAnimation.Nothing) {
//     return {
//       effect: compileLayerEffect({
//         input: layerSource(),
//         invalidate: { kind: "always" },
//         alpha: "opaque",
//         pipeline: [],
//       }),
//     };
//   }

//   if (animation === BackgroundAnimation.BlurOnly) {
//     return {
//       effect: compileLayerEffect({
//         input: layerSource(),
//         invalidate: { kind: "always" },
//         alpha: "opaque",
//         pipeline: [
//           dualKawaseBlur({ radius: 1, passes: 2 }),
//         ],
//       }),
//     };
//   }

//   return {
//     effect: compileLayerEffect({
//       input: layerSource(),
//       invalidate: { kind: "always" },
//       alpha: "opaque",
//       pipeline: [
//         dualKawaseBlur({ radius: 0, passes: 0 }),
//         loadSelectedShader(animation),
//       ],
//     }),
//   };
// }

// // FIXME: actually needed???
// const [firstFrameSig, setFirstFrame] = signal(1.0);
// let firstFrameConsumed = false;

// function loadSelectedShader(animation: BackgroundAnimation) {
//   /*
//   |\
//   |-\ <- rain degree
//   |  \
//   |   \
//   */
  
//   const RAIN_BACKGROUND_ANGLE_DEG = 15;
//   const RAIN_BACKGROUND_SPEED = 5.0;
//   const RAIN_WINDOW_SPEED = RAIN_BACKGROUND_SPEED * 0.7;
//   const RAIN_WINDOW_ANGLE_DEG = RAIN_BACKGROUND_ANGLE_DEG * 0.9;
  
//   switch (animation) {
//     case BackgroundAnimation.Rain_1:
//       return shaderStage(loadShader("./shaders/background/rain/1.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_BACKGROUND_SPEED,
//           angle_deg: RAIN_BACKGROUND_ANGLE_DEG * 2,
//           rain_amount: 0.8,
//           streak_length: 10,
//           splashes: 0,
//         },
//       });
//     case BackgroundAnimation.Rain_2:
//       return shaderStage(loadShader("./shaders/background/rain/2.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_BACKGROUND_SPEED,
//           angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
//           rain_amount: 0.6,
//           streak_length: 10,
//         },
//       });
//     case BackgroundAnimation.Rain_3:
//       return shaderStage(loadShader("./shaders/background/rain/3.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_BACKGROUND_SPEED,
//           angle_deg: RAIN_BACKGROUND_SPEED,
//           rain_amount: 10,
//           streak_length: 5,
//           splashes: 0.0,
//         },
//       });
//     case BackgroundAnimation.Rain_4:
//       return shaderStage(loadShader("./shaders/background/rain/4.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: RAIN_BACKGROUND_SPEED,
//           angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
//           rain_amount: 10,
//           streak_length: 5,
//           splashes: 0.0,
//         },
//       });
//     case BackgroundAnimation.Synthway_day:
//       return shaderStage(loadShader("./shaders/background/synthway/1.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: 10.0,
//           road_color:     [0.35, 0.30, 0.45],
//           sky_color:      [0.45, 0.55, 0.95],
//           sun_color:      [1.00, 0.85, 0.55],
//           horizon_color:  [1.00, 0.65, 0.75],
//         },
//       });
    
//     case BackgroundAnimation.Synthway_night:
//       return shaderStage(loadShader("./shaders/background/synthway/1.frag"), {
//         uniforms: {
//           time: clock.time,
//           aspect: clock.aspect,
//           speed: 10.0,
//           road_color:     [0.70, 0.05, 0.85],
//           sky_color:      [0.161, 0.067, 0.678],
//           sun_color:      [1.00, 0.8, 1.0],
//           horizon_color:  [0.161, 0.067, 0.678],
//         },
//     });
//     case BackgroundAnimation.Jupiter: {
//       const JUPITER_COLOR = [1.0, 1.0 , 1.0];
//       const      IO_COLOR = [1.0, 0.95, 0.8];
//       const  NEBULA_COLOR = [0.9, 0.3 , 0.4];
//       const   STARS_COLOR = [1.0, 0.9 , 0.8];
//       const    SPIN_SPEED = 1.0;
//       const RESET_NONCE   = Date.now().toString(36);

//       const state = stateTexture(`jupiter-state-${RESET_NONCE}`, {
//         scale: 1.0,
//         format: "rgba16f",
//         resize: "clear",
//       });
      
//       return compileLayerEffect({
//         input: layerSource(),
//         invalidate: { kind: "always" },
//         alpha: "opaque",
//         pipeline: [
//           renderTo(state, {
//             input: stateSource(state),
//             pipeline: [
//               shaderStage(loadShader("./shaders/background/jupiter/feedback.frag"), {
//                 uniforms: {
//                   time: timeSig,
//                   aspect: aspectSig,
//                   first_frame: firstFrameSig,
//                 },
//               }),
//             ],
//           }),
//           shaderStage(loadShader("./shaders/background/jupiter/sharpen.frag"), {
//             uniforms: {
//               aspect: aspectSig,
//             },
//           }),
//           shaderStage(loadShader("./shaders/background/jupiter/main.frag"), {
//             uniforms: {
//               time: timeSig,
//               aspect: aspectSig,
//               spin_speed: SPIN_SPEED,
//               jupiter_color: JUPITER_COLOR,
//               io_color: IO_COLOR,
//               nebula_color: NEBULA_COLOR,
//               stars_color: STARS_COLOR,
//             },
//           }),
//         ],
//       });
//     }
//     default:
//       console.error('selected shader for background rain does not exist');
//   }
// }
import {
  COMPOSITOR,
  compileLayerEffect,
  dualKawaseBlur,
  layerSource,
  loadShader,
  renderTo,
  shaderStage,
  signal,
  stateSource,
  stateTexture,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";
import { acquireClock } from "./../system/animation-clock";

const clock = acquireClock();

// ---------------------------------------------------------------------------
// Jupiter feedback state — одна общая текстура на все outputs.
// RESET_NONCE сбрасывает state при hot reload, чтобы feedback не тянул
// мусор из предыдущей сессии.
// ---------------------------------------------------------------------------
const JUPITER_RESET_NONCE = Date.now().toString(36);
const JUPITER_STATE = stateTexture(`jupiter-state-${JUPITER_RESET_NONCE}`, {
  scale: 1.0,
  format: "rgba16f",
  resize: "clear",
});

// first_frame: 1.0 в первом кадре, потом 0.0.
// Нужен только для feedback-шейдера Юпитера.
const [firstFrameSig, setFirstFrame] = signal(1.0);
let firstFrameConsumed = false;

// ---------------------------------------------------------------------------
// BackgroundAnimation enum
// ---------------------------------------------------------------------------
export enum BackgroundAnimation {
  Nothing,
  BlurOnly,
  Rain_1, Rain_2, Rain_3, Rain_4,
  Synthway_day, Synthway_night,
  Jupiter,
}

interface BackgroundInstance {
  animation: BackgroundAnimation;
  effect: LayerEffectHandle;
}

const instances = new Map<string, BackgroundInstance>();

export function backgroundAnimation(
  outputName: string,
  animation: BackgroundAnimation,
): LayerEffectHandle {
  let instance = instances.get(outputName);
  if (instance && instance.animation !== animation) {
    instance.effect.dispose?.();
    instances.delete(outputName);
    instance = undefined;
  }
  if (!instance) {
    instance = { animation, effect: createInstance(outputName, animation) };
    instances.set(outputName, instance);

    // При первом использовании Юпитера — сбрасываем first_frame.
    if (animation === BackgroundAnimation.Jupiter && !firstFrameConsumed) {
      firstFrameConsumed = true;
      setFirstFrame(1.0);
      // На следующем тике clock'а погасим.
      queueMicrotask(() => setFirstFrame(0.0));
    }
  }
  return instance.effect;
}

function createInstance(
  _outputName: string,
  animation: BackgroundAnimation,
): LayerEffectHandle {
  if (animation === BackgroundAnimation.Nothing) {
    return compileLayerEffect({
      input: layerSource(),
      invalidate: { kind: "always" },
      alpha: "opaque",
      pipeline: [],
    });
  }

  if (animation === BackgroundAnimation.BlurOnly) {
    return compileLayerEffect({
      input: layerSource(),
      invalidate: { kind: "always" },
      alpha: "opaque",
      pipeline: [dualKawaseBlur({ radius: 1, passes: 2 })],
    });
  }

  // Юпитер — отдельная ветка: ему нужен renderTo + stateSource.
  if (animation === BackgroundAnimation.Jupiter) {
    return createJupiterEffect();
  }

  // Все остальные анимации — stateless shaderStage поверх layerSource.
  return compileLayerEffect({
    input: layerSource(),
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: [
      dualKawaseBlur({ radius: 0, passes: 0 }),
      loadSelectedShader(animation),
    ],
  });
}

// ---------------------------------------------------------------------------
// Jupiter: feedback + sharpen + main
// ---------------------------------------------------------------------------
const JUPITER_COLOR = [1.0, 1.0, 1.0];
const IO_COLOR      = [1.0, 0.95, 0.8];
const NEBULA_COLOR  = [0.9, 0.3, 0.4];
const STARS_COLOR   = [1.0, 0.9, 0.8];
const SPIN_SPEED    = 1.0;

function createJupiterEffect(): LayerEffectHandle {
  return compileLayerEffect({
    input: layerSource(),
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: [
      // 1. Feedback: пишем в state.
      renderTo(state, {
        input: stateSource(state),
        pipeline: [
          shaderStage(loadShader("./src/jupiter-feedback.frag"), {
            uniforms: {
              time: timeSig,
              aspect: aspectSig,
              first_frame: firstFrameSig,
            },
          }),
        ],
      }),
      
      // 2. Sharpen: теперь читает state через textures, а не tex.
      shaderStage(loadShader("./src/jupiter-sharpen.frag"), {
        textures: {
          state: stateSource(state),
        },
        uniforms: {
          aspect: aspectSig,
        },
      }),
      
      // 3. Финал: тоже читает state, а не tex.
      shaderStage(loadShader("./src/jupiter.frag"), {
        textures: {
          state: stateSource(state),
        },
        uniforms: {
          time: timeSig,
          aspect: aspectSig,
          spin_speed: SPIN_SPEED,
          jupiter_color: JUPITER_COLOR,
          io_color: IO_COLOR,
          nebula_color: NEBULA_COLOR,
          stars_color: STARS_COLOR,
        },
      }),
    ],
  });
}

// ---------------------------------------------------------------------------
// Все остальные шейдеры
// ---------------------------------------------------------------------------
function loadSelectedShader(animation: BackgroundAnimation) {
  const RAIN_BACKGROUND_ANGLE_DEG = 15;
  const RAIN_BACKGROUND_SPEED = 5.0;

  switch (animation) {
    case BackgroundAnimation.Rain_1:
      return shaderStage(loadShader("./shaders/background/rain/1.frag"), {
        uniforms: {
          time: clock.time,
          aspect: clock.aspect,
          speed: RAIN_BACKGROUND_SPEED,
          angle_deg: RAIN_BACKGROUND_ANGLE_DEG * 2,
          rain_amount: 0.8,
          streak_length: 10,
          splashes: 0,
        },
      });
    case BackgroundAnimation.Rain_2:
      return shaderStage(loadShader("./shaders/background/rain/2.frag"), {
        uniforms: {
          time: clock.time,
          aspect: clock.aspect,
          speed: RAIN_BACKGROUND_SPEED,
          angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
          rain_amount: 0.6,
          streak_length: 10,
        },
      });
    case BackgroundAnimation.Rain_3:
      return shaderStage(loadShader("./shaders/background/rain/3.frag"), {
        uniforms: {
          time: clock.time,
          aspect: clock.aspect,
          speed: RAIN_BACKGROUND_SPEED,
          angle_deg: RAIN_BACKGROUND_SPEED,
          rain_amount: 10,
          streak_length: 5,
          splashes: 0.0,
        },
      });
    case BackgroundAnimation.Rain_4:
      return shaderStage(loadShader("./shaders/background/rain/4.frag"), {
        uniforms: {
          time: clock.time,
          aspect: clock.aspect,
          speed: RAIN_BACKGROUND_SPEED,
          angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
          rain_amount: 10,
          streak_length: 5,
          splashes: 0.0,
        },
      });
    case BackgroundAnimation.Synthway_day:
      return shaderStage(loadShader("./shaders/background/synthway/1.frag"), {
        uniforms: {
          time: clock.time,
          aspect: clock.aspect,
          speed: 10.0,
          road_color:    [0.35, 0.30, 0.45],
          sky_color:     [0.45, 0.55, 0.95],
          sun_color:     [1.00, 0.85, 0.55],
          horizon_color: [1.00, 0.65, 0.75],
        },
      });
    case BackgroundAnimation.Synthway_night:
      return shaderStage(loadShader("./shaders/background/synthway/1.frag"), {
        uniforms: {
          time: clock.time,
          aspect: clock.aspect,
          speed: 10.0,
          road_color:    [0.70, 0.05, 0.85],
          sky_color:     [0.161, 0.067, 0.678],
          sun_color:     [1.00, 0.8, 1.0],
          horizon_color: [0.161, 0.067, 0.678],
        },
      });
    case BackgroundAnimation.Jupiter:
      // Обрабатывается отдельно в createInstance — сюда не доходит.
      throw new Error("Jupiter should be handled in createInstance");
    default:
      console.warn(`No shader for animation ${animation}`);
      return null;
  }
}

// ---------------------------------------------------------------------------
// Dispose
// ---------------------------------------------------------------------------
export function disposeBackgroundAnimation() {
  clock.release();
  for (const instance of instances.values()) {
    instance.effect.dispose?.();
  }
  instances.clear();
  firstFrameConsumed = false;
  setFirstFrame(1.0);
}

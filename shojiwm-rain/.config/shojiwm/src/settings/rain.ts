import {
  COMPOSITOR,
  compileEffect,
  compileLayerEffect,
  createPoll,
  dualKawaseBlur,
  backdropSource,
  layerSource,
  loadShader,
  shaderStage,
  signal,
  type PollHandle,
  type WaylandWindow,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";

/*
|\
|-\ <- RAIN_ANGLE_DEG
|  \
|   \
*/
const RAIN_BACKGROUND_ANGLE_DEG = 15;
const RAIN_BACKGROUND_SPEED = 5.0;
const RAIN_WINDOW_SPEED = RAIN_BACKGROUND_SPEED * 0.7;
const RAIN_WINDOW_ANGLE_DEG = RAIN_BACKGROUND_ANGLE_DEG * 0.9;

const POLL_INTERVAL_MS = 16;

const instances = new Map<string, RainInstance>();
let poll: PollHandle | null = null;
let pollLastNowMs: number | null = null;

const [timeSig, setTime] = signal(0);

const [aspectSig, setAspect] = signal(16 / 9);

interface RainInstance {
  effect: LayerEffectHandle;
}

export function rainWindowWallpaperEffect(outputName: string): LayerEffectHandle {
  let instance = instances.get(outputName);
  if (!instance) {
    instance = createInstance(outputName);
    instances.set(outputName, instance);
    startPoll();
  }
  return instance.effect;
}
const RAIN_STREAK_LENGTH = 10;
const RAIN_SPLASHES = 1.0;

function createInstance(_outputName: string): RainInstance {
  const effect = compileLayerEffect({
    input: layerSource(),
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: [
      dualKawaseBlur({ radius: 0, rasses: 0}),
      // // ===================================================================
      // shaderStage(loadShader("./shaders/background/rain.1.frag"), {
      //   uniforms: {
      //     time: timeSig,
      //     aspect: aspectSig,
      //     speed: RAIN_BACKGROUND_SPEED,
      //     angle_deg: RAIN_BACKGROUND_ANGLE_DEG * 2,
      //     rain_amount: 0.8,
      //     streak_length: 10,
      //     splashes: 0,
      //   },
      // }),
      // ===================================================================
      shaderStage(loadShader("./shaders/background/rain.2.frag"), {
        uniforms: {
          time: timeSig,
          aspect: aspectSig,
          speed: RAIN_BACKGROUND_SPEED,
          angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
          rain_amount: 0.6,
          streak_length: 10,
        },
      }),
      // ===================================================================
      // shaderStage(loadShader("./shaders/background/rain.3.frag"), {
      //   uniforms: {
      //     time: timeSig,
      //     aspect: aspectSig,
      //     speed: RAIN_BACKGROUND_SPEED,
      //     angle_deg: RAIN_BACKGROUND_SPEED,
      //     rain_amount: 10,
      //     streak_length: 5,
      //     splashes: 0.0,
      //   },
      // }),
      // // ===================================================================
      // shaderStage(loadShader("./shaders/background/rain.4.frag"), {
      //   uniforms: {
      //     time: timeSig,
      //     aspect: aspectSig,
      //     speed: RAIN_BACKGROUND_SPEED,
      //     angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
      //     rain_amount: 10,
      //     streak_length: 5,
      //     splashes: 0.0,
      //   },
      // }),
    ],
  });
  return { effect };
}

function startPoll() {
  if (poll && !poll.cancelled) {
    return;
  }
  pollLastNowMs = null;
  poll = createPoll(POLL_INTERVAL_MS, tick);
}

function tick(handle: PollHandle) {
  const nowMs = handle.nowMs;
  const deltaMs =
    pollLastNowMs === null ? POLL_INTERVAL_MS : nowMs - pollLastNowMs;
  pollLastNowMs = nowMs;

  // time в секундах, монотонно растёт. mod 600 — чтобы float16 не терял
  // точность через час.
  setTime((nowMs / 1000) % 600);

  // Обновляем аспект по первому output'у. Дождь синхронный, так что
  // одного значения хватает; если мониторы очень разные — можно
  // сделать по сигналу на output и подавать в соответствующий effect.
  const outputs = COMPOSITOR.output.list;
  if (outputs.length > 0) {
    const out = COMPOSITOR.output.get(outputs[0]);
    if (out && out.resolution && out.scale) {
      const w = out.resolution.width / out.scale;
      const h = out.resolution.height / out.scale;
      if (h > 0) setAspect(w / h);
    }
  }
}

const windowInstances = new Map<string, LayerEffectHandle>();

export function rainWindowWindowEffect(window: WaylandWindow): LayerEffectHandle {
  let effect = windowInstances.get(window.id);
  if (!effect) {
    effect = compileEffect({
      input: backdropSource(),
      capturePadding: 24,
      invalidate: { kind: "always" },
      alpha: "opaque",
      pipeline: [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        // ===================================================================
        // shaderStage(loadShader("./shaders/window/rain.1.frag"), {
        //   uniforms: {
        //     time: timeSig,
        //     aspect: aspectSig,
        //     speed: RAIN_WINDOW_SPEED,
        //     angle_deg: RAIN_WINDOW_ANGLE_DEG,
        //     rain_amount: 0.4,
        //   },
        // }),
        // ===================================================================
        shaderStage(loadShader("./shaders/window/rain.2.frag"), {
          uniforms: {
            time: timeSig,
            aspect: aspectSig,
            speed: RAIN_WINDOW_SPEED,
            angle_deg: 180 - RAIN_WINDOW_ANGLE_DEG,
            rain_amount: 0.0,
          },
        }),
        // // ===================================================================
        // shaderStage(loadShader("./shaders/window/rain.3.frag"), {
        //   uniforms: {
        //     time: timeSig,
        //     aspect: aspectSig,
        //     speed: RAIN_WINDOW_SPEED,
        //     angle_deg: RAIN_WINDOW_ANGLE_DEG,
        //     rain_amount: 0.4,
        //   },
        // }),
        // // ===================================================================
        // shaderStage(loadShader("./shaders/window/rain.4.frag"), {
        //   uniforms: {
        //     time: timeSig,
        //     aspect: aspectSig,
        //     speed: RAIN_WINDOW_SPEED,
        //     angle_deg: RAIN_WINDOW_ANGLE_DEG,
        //     rain_amount: 0.4,
        //   },
        // }),
        // // ===================================================================
        // shaderStage(loadShader("./shaders/window/rain.5.frag"), {
        //   uniforms: {
        //     time: timeSig,
        //     aspect: aspectSig,
        //     speed: RAIN_WINDOW_SPEED * 0.5,
        //     angle_deg: 180 - RAIN_WINDOW_ANGLE_DEG,
        //     rain_amount: 0.2,
        //     streak_length: 1,
        //     brightness: 1.0,
        //     trail_strength: 0.1,
        //     trail_color: [0.6, 0.6, 0.6],
        //     bg_blur: 1.0,
        //   },
        // }),
        // // ===================================================================
      ],
    });
    windowInstances.set(window.id, effect);
    startPoll();
  }
  return effect;
}

/**
 * Остановить полл и сбросить состояние. Вызывается из COMPOSITOR.onDisable
 * при выгрузке конфига, чтобы не оставлять висящий полл.
 */
export function disposeRain() {
  if (poll && !poll.cancelled) {
    poll.cancel();
  }
  poll = null;
  pollLastNowMs = null;
  instances.clWindowear();
}

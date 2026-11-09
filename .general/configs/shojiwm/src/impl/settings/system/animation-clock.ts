import {
  COMPOSITOR,
  createPollForEachOutput,
  signal,
  type PollHandle,
} from "shoji_wm";

const POLL_INTERVAL_MS = 16;
const TIME_WRAP_SECONDS = 600;

interface ClockInstance {
  time: ReturnType<typeof signal<number>>;
  aspect: ReturnType<typeof signal<number>>;
  refCount: number;
}

const clocksByOutput = new Map<string, ClockInstance>();
let poll: PollHandle | null = null;

export function acquireClock(outputName: string): {
  time: ClockInstance["time"];
  aspect: ClockInstance["aspect"];
  release: () => void;
} {
  let clock = clocksByOutput.get(outputName);
  if (!clock) {
    clock = {
      time: signal(0),
      aspect: signal(16 / 9),
      refCount: 0,
    };
    clocksByOutput.set(outputName, clock);
  }
  clock.refCount++;
  ensurePoll();

  let released = false;
  return {
    time: clock.time,
    aspect: clock.aspect,
    release() {
      if (released) return;
      released = true;
      clock!.refCount--;
      if (clock!.refCount <= 0) {
        clocksByOutput.delete(outputName);
        if (clocksByOutput.size === 0) {
          stopPoll();
        }
      }
    },
  };
}

function ensurePoll() {
  if (poll && !poll.cancelled) return;
  poll = createPollForEachOutput(
    POLL_INTERVAL_MS,
    (handle, outputName) => {
      const clock = clocksByOutput.get(outputName);
      if (!clock) return;

      clock.time.set((handle.nowMs / 1000) % TIME_WRAP_SECONDS);

      const out = COMPOSITOR.output.get(outputName);
      if (out?.resolution && out?.scale) {
        const w = out.resolution.width / out.scale;
        const h = out.resolution.height / out.scale;
        if (h > 0) clock.aspect.set(w / h);
      }
    },
    { dirty: "none" },
  );
}

function stopPoll() {
  if (poll && !poll.cancelled) {
    poll.cancel();
  }
  poll = null;
}

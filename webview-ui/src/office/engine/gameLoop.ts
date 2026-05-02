const MAX_DELTA_TIME_SEC = 0.1;

interface GameLoopCallbacks {
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export function startGameLoop(
  canvas: HTMLCanvasElement,
  callbacks: GameLoopCallbacks,
): () => void {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  let stopped = false;
  let rafId = 0;
  let lastTime: number | undefined;

  function frame(timestamp: number) {
    if (stopped) return;

    let dt = 0;
    if (lastTime !== undefined) {
      dt = Math.min((timestamp - lastTime) / 1000, MAX_DELTA_TIME_SEC);
    }
    lastTime = timestamp;

    ctx.imageSmoothingEnabled = false;
    callbacks.update(dt);
    callbacks.render(ctx);

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}

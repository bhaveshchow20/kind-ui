// Dispatch an actual touch sequence: Chromium's synthesized touch scroll can
// complete without producing input in headless mobile emulation.
export async function swipeUp(cdp, { x, y, distance }) {
  const end = Math.max(20, y - distance);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 12; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + ((end - y) * step) / 12 }],
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

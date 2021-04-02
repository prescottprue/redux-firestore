let win;
try {
  win = window;
} catch (e) {}
const perf = win && win.performance && win.performance();
const tracer = {};

/**
 *
 * @param {*} marker
 * @param {*} isDone
 */
export default function mark(marker, isDone = false) {
  if (!perf) return;

  try {
    const trace = tracer[marker] || perf.trace(marker);
    if (!isDone) {
      trace.start();
      tracer[marker] = trace;
      trace.putAttribute('marker', marker ?? 'unknown');
    } else {
      trace.stop();
      tracer[marker] = perf.trace(marker);
    }
  } catch (err) {
    // ensure timings never impact the user
  }
}

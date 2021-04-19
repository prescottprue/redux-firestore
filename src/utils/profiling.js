import { noop } from 'lodash';

// webpack eternal removes
let win = require('perf_hooks');

const isDev =
  !process.env.NODE_ENV ||
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test';

try {
  win = window;
} catch (e) {}
const perf = win && win.performance;
/**
 *
 * @param {*} marker
 * @param {*} isDone
 * @returns {Function}
 */
export default function mark(marker) {
  if (!isDev || !perf) return noop;

  try {
    const now = perf.now();
    const start = `@rrf/${marker}-${now}`;
    perf.mark(start);
    return () => {
      perf.measure(`@rrf/${marker}`, start);
    };
  } catch (err) {
    // ensure timings never impact the user
    return noop;
  }
}

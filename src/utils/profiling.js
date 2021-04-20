import { noop } from 'lodash';
import debug from 'debug';

let win;

try {
  // eslint-disable-next-line dot-notation
  const nodeRequire = module[`require`].bind(module);
  win = nodeRequire('perf_hooks');
} catch (e) {}

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
  if (!debug.enabled('rrf') || !perf) return noop;

  /* istanbul ignore next */
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

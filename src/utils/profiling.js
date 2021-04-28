/* istanbul ignore file */
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
  if (!debug.enabled('rrf:*') || !debug.enabled('rrf:profile') || !perf) {
    return noop;
  }

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

if (win) {
  win.rrfStats = () => {
    const stats = performance
      .getEntries()
      .filter(({ entryType }) => entryType === 'measure')
      .filter(({ name }) => name.indexOf('@rrf/') === 0)
      .reduce((stats, { duration, name }) => {
        if (stats[name]) {
          stats[name].push(duration);
        } else {
          // eslint-disable-next-line no-param-reassign
          stats[name] = [duration];
        }
        return stats;
      }, {});
    Object.keys(stats).map((name) => {
      const arr = stats[name];
      const sum = arr.reduce((a, b) => a + b, 0);
      const mean = (sum / arr.length).toFixed(2);
      const min = arr.reduce((a, b) => (a < b ? a : b), arr[0]).toFixed(2);
      const max = arr.reduce((a, b) => (a > b ? a : b), arr[0]).toFixed(2);
      console.log(
        `${name}\nmean: ${mean}ms\nmin: ${min}ms\nmax: ${max}ms\ntotal: ${sum.toFixed(
          2,
        )}ms\ncount: ${arr.length}`,
      );
    });
  };
}

/* istanbul ignore file */

import { noop } from 'lodash';
import debug from 'debug';

const info = debug('rrf:profile');

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
export default function mark(marker, context = '') {
  if (!debug.enabled('rrf:*') || !debug.enabled('rrf:profile') || !perf) {
    return noop;
  }

  try {
    const now = perf.now();
    const start = `@rrf/${marker}-${now}`;
    perf.mark(start);
    if (context) {
      info(`${marker}.${context}`);
    }
    return () => {
      perf.measure(`@rrf/${marker}`, start);
    };
  } catch (err) {
    // ensure timings never impact the user
    return noop;
  }
}

/**
 *
 * @param {*} marker
 * @returns
 */
export function resource(marker) {
  if (!debug.enabled('rrf:*') || !debug.enabled('rrf:profile') || !perf) {
    return noop;
  }

  try {
    const now = perf.now();
    const start = `@rrf.load/${marker}-${now}`;
    perf.mark(start);
    return (count = '') => {
      perf.measure(`@rrf.load/${marker}.|${count}|`, start);
    };
  } catch (err) {
    // ensure timings never impact the user
    return noop;
  }
}

if (win) {
  win.rrfStats = () => {
    if (!debug.enabled('rrf:*') || !debug.enabled('rrf:profile') || !perf) {
      return console.log(
        "Profiling not enabled. Enable using `debug.enable('rrf:profile').`",
      );
    }
    const getMarks = ({ name }) => name.indexOf('@rrf/') === 0;
    const getLoads = ({ name }) => name.indexOf('@rrf.load/') === 0;
    const duration = (stats, { duration, name }) => {
      if (stats[name]) {
        stats[name].push(duration);
      } else {
        // eslint-disable-next-line no-param-reassign
        stats[name] = [duration];
      }
      return stats;
    };

    const logStats = (grouped) => {
      console.group(`Redux Firestore Profiling`);
      console.table(
        Object.keys(grouped)
          .map((name) => {
            const arr = grouped[name];
            const sum = arr.reduce((a, b) => a + b, 0);
            return {
              [name]: {
                mean: parseFloat((sum / arr.length).toFixed(2)),
                samples: arr.length,
                min: parseFloat(
                  arr.reduce((a, b) => (a < b ? a : b), arr[0]).toFixed(2),
                ),
                max: parseFloat(
                  arr.reduce((a, b) => (a > b ? a : b), arr[0]).toFixed(2),
                ),
                sum: parseFloat(sum.toFixed(2)),
              },
            };
          })
          .reduce((result, item) => ({ ...result, ...item })),
      );
      console.groupEnd();
    };

    const marks = performance
      .getEntriesByType('measure')
      .filter(getMarks)
      .reduce(duration, {});

    logStats(marks);

    const phases = ((last, phase) => ({ startTime, duration, name }) => {
      if (last + 16 <= startTime) {
        phase++;
      }
      const item = {
        name,
        start: parseFloat(startTime.toFixed(2)),
        phase,
        duration: parseFloat(duration.toFixed(2)),
        loaded: (/\|(\d+)\|/g.exec(name) || [0, 0])[1],
      };
      // eslint-disable-next-line no-param-reassign
      last = startTime;
      return item;
    })(false, 0);

    const group = (arr, prop) =>
      arr.reduce((stats, { phase, name, start, duration, loaded }) => {
        if (!stats[phase]) {
          stats[phase] = {};
        }

        stats[phase][name] = { start, duration, loaded };
        return stats;
      }, {});

    const logPhases = (phases) => {
      let last = 0;
      console.group(`Firestore Collection Loads`);
      Object.keys(phases).forEach((key) => {
        const start = Object.values(phases[key]).reduce(
          (num, { start }) => Math.min(num, start),
          Number.MAX_VALUE,
        );

        console.group(`Phase ${key} +${Math.floor(start - last)}ms`);
        console.table(phases[key]);
        console.groupEnd();
        last = start;
      });
      console.groupEnd();
    };

    const loads = performance
      .getEntriesByType('measure')
      .filter(getLoads)
      .map(phases);

    logPhases(group(loads, 'phase'));
  };
}

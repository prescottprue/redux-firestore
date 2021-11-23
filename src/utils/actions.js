import { isObject, mapValues } from 'lodash';
import mutate from './mutate';

/**
 * Build payload by invoking payload function if it a function, otherwise
 * returning the payload.
 * @param {Function|object|boolean} payload - Payload value (invoked if it
 * is a function)
 * @param {any} valToPass - Value to pass to custom payload function
 * @returns {any} Result of building payload
 */
function makePayload({ payload }, valToPass) {
  return typeof payload === 'function' ? payload(valToPass) : payload;
}

/**
 * Wrap method call in dispatched actions
 * @param {Function} dispatch - Action dispatch function
 * @param {object} opts - Options object
 * @param {Function} opts.method - Method to call
 * @param {Array} opts.args - Arguments to call method with
 * @param {Array} opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @param {object} opts.ref - Firestore reference
 * @param {object} opts.meta - Meta object
 * @returns {Promise} Results of method call
 * @private
 */
export function wrapInDispatch(
  dispatch,
  { ref, meta = {}, method, args = [], types },
) {
  if (typeof dispatch !== 'function') {
    throw new Error('dispatch is not a function');
  }

  const [requestingType, successType, errorType] = types;
  const startAction = {
    type: isObject(requestingType) ? requestingType.type : requestingType,
    meta,
    payload: isObject(requestingType) ? requestingType.payload : { args },
  };
  const optimistic = new Promise((resolve, reject) => {
    Object.defineProperty(startAction, '_promise', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: { resolve, reject },
    });
    if (method !== 'mutate') {
      resolve();
    }
    dispatch(startAction);
  });

  const saved =
    method === 'mutate' ? mutate(ref, ...args) : ref[method](...args);

  saved
    .then((result) => {
      const successIsObject = isObject(successType);
      // Built action object handling function for custom payload
      const actionObj = {
        type: successIsObject ? successType.type : successType,
        meta,
        payload:
          successIsObject && successType.payload
            ? makePayload(successType, result)
            : { args },
      };
      // Attach preserve to action if it is passed
      if (successIsObject && successType.preserve) {
        actionObj.preserve = successType.preserve;
      }
      // Attach merge to action if it is passed
      if (successIsObject && successType.merge) {
        actionObj.merge = successType.merge;
      }
      dispatch(actionObj);
      return result;
    })
    .catch((err) => {
      dispatch({
        type: errorType,
        meta,
        payload: err,
      });
      return Promise.reject(err);
    });

  return Promise.allSettled([saved, optimistic]).then(([firestore, memory]) => {
    if (memory.status === 'rejected') return Promise.reject(memory.reason);
    if (firestore.status === 'rejected')
      return Promise.reject(firestore.reason);
    return firestore.value;
  });
}

/**
 * Function that builds a factory that passes firebase and dispatch as
 * first two arguments.
 * @param {object} firebase - Internal firebase instance
 * @param {Function} dispatch - Redux's dispatch function
 * @returns {Function} A wrapper that accepts a function to wrap with firebase
 * and dispatch.
 */
function createWithFirebaseAndDispatch(firebase, dispatch) {
  return (func) =>
    (...args) =>
      func.apply(firebase, [firebase, dispatch, ...args]);
}

/**
 * Map each action with Firebase and Dispatch. Includes aliasing of actions.
 * @param {object} firebase - Internal firebase instance
 * @param {Function} dispatch - Redux's dispatch function
 * @param {object} actions - Action functions to map with firebase and dispatch
 * @param {object} aliases - List of name aliases for wrapped functions
 * @returns {object} Actions mapped with firebase and dispatch
 */
export function mapWithFirebaseAndDispatch(
  firebase,
  dispatch,
  actions,
  aliases,
) {
  const withFirebaseAndDispatch = createWithFirebaseAndDispatch(
    firebase,
    dispatch,
  );
  return {
    ...mapValues(actions, withFirebaseAndDispatch),
    ...aliases.reduce(
      (acc, { action, name }) => ({
        ...acc,
        [name]: withFirebaseAndDispatch(action),
      }),
      {},
    ),
  };
}
